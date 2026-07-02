#!/usr/bin/env node
/**
 * Tillerstead Interactive Dev Server
 *
 * Features:
 *  - Serves _site/ on http://localhost:4173
 *  - CSS hot-swap: changes to assets/css/** copy instantly to _site/, no rebuild
 *  - JS/HTML/MD/Liquid changes trigger a full Jekyll rebuild + reload
 *  - In-browser interactive inspector auto-injected on localhost
 *  - WebSocket live-reload (port 4174)
 *  - Colored terminal output
 *
 * Usage:
 *   node scripts/devserver.js
 *   node scripts/devserver.js --port 4173 --ws-port 4174 --open
 */

import http from 'http';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const chokidar = require('chokidar');
const { WebSocketServer } = require('ws');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, '_site');

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const HTTP_PORT = parseInt(getArg('--port', '5173'), 10);
const WS_PORT = parseInt(getArg('--ws-port', '5174'), 10);
const OPEN_BROWSER = args.includes('--open');

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  grey: '\x1b[90m',
};
const log = (color, tag, msg) =>
  console.log(`${color}${C.bold}[${tag}]${C.reset}${color} ${msg}${C.reset}`);
const info = m => log(C.cyan, 'DEV', m);
const ok = m => log(C.green, 'OK', m);
const warn = m => log(C.yellow, 'CSS', m);
const err = m => log(C.red, 'ERR', m);
const build_log = m => log(C.magenta, 'BUILD', m);

// ─── MIME types ──────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.map': 'application/json',
};

// ─── Live-reload snippet injected into HTML ───────────────────────────────────
const RELOAD_SNIPPET = `
<!-- [devserver] live-reload + inspector -->
<script>
(function(){
  var ws=new WebSocket('ws://localhost:${WS_PORT}');
  ws.onmessage=function(e){
    var d=JSON.parse(e.data);
    if(d.type==='css-hot'){
      // Hot-swap CSS without full reload
      document.querySelectorAll('link[rel="stylesheet"]').forEach(function(el){
        var url=el.href.split('?')[0];
        if(url.includes(d.file)){
          el.href=url+'?v='+Date.now();
          console.log('[devserver] hot-swapped',d.file);
        }
      });
    } else if(d.type==='reload'){
      console.log('[devserver] reloading...');
      location.reload();
    }
  };
  ws.onopen=function(){ console.log('[devserver] live-reload connected'); };
  ws.onerror=function(){ /* server not running, silent */ };
})();
</script>
<script src="/assets/js/dev-inspector.js" data-dev="true"></script>
`;

// ─── Static file server ───────────────────────────────────────────────────────
async function serveFile(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  // Remove trailing slash → try index.html
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  let filePath = path.join(SITE, urlPath);

  // If no extension, try /index.html
  if (!path.extname(filePath)) {
    const candidate = path.join(filePath, 'index.html');
    if (fs.existsSync(candidate)) filePath = candidate;
    else {
      // Try with .html
      const htmlCandidate = filePath + '.html';
      if (fs.existsSync(htmlCandidate)) filePath = htmlCandidate;
    }
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const fallback = path.join(SITE, '404.html');
    if (fs.existsSync(fallback)) filePath = fallback;
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  try {
    let content = await fsp.readFile(filePath);

    if (mime.startsWith('text/html')) {
      // Inject live-reload + inspector before </body>
      let html = content.toString('utf8');
      if (html.includes('</body>')) {
        html = html.replace('</body>', RELOAD_SNIPPET + '\n</body>');
      } else {
        html += RELOAD_SNIPPET;
      }
      content = Buffer.from(html, 'utf8');
    }

    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': content.length,
      'Cache-Control': 'no-store',
      'X-Dev-Server': 'tillerstead',
    });
    res.end(content);
  } catch (e) {
    err(String(e));
    res.writeHead(500);
    res.end('Server Error');
  }
}

// ─── Jekyll builder ───────────────────────────────────────────────────────────
let building = false;
let buildQueued = false;

function runJekyllBuild() {
  if (building) {
    buildQueued = true;
    return;
  }
  building = true;
  build_log('Running Jekyll build...');
  const start = Date.now();

  const proc = spawn(
    'C:\\Ruby34-x64\\bin\\ruby.exe',
    [
      '-e',
      "ENV['BUNDLE_GEMFILE']='nonexistent'; require 'jekyll'; Jekyll::Commands::Build.process({})",
    ],
    {
      cwd: ROOT,
      env: { ...process.env, GIT_DIR: undefined, GIT_WORK_TREE: undefined },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let stderr = '';
  proc.stderr.on('data', d => {
    stderr += d.toString();
  });

  proc.on('close', code => {
    building = false;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (code === 0) {
      ok(`Jekyll build done in ${elapsed}s`);
      broadcast({ type: 'reload' });
    } else {
      err(`Jekyll build failed (${elapsed}s)`);
      if (stderr) console.error(stderr.trim());
    }
    if (buildQueued) {
      buildQueued = false;
      runJekyllBuild();
    }
  });
}

// ─── CSS hot-swap ─────────────────────────────────────────────────────────────
async function hotSwapCSS(srcFile) {
  // srcFile is absolute path inside assets/css/**
  const rel = path.relative(ROOT, srcFile); // e.g. assets/css/navigation.css
  const dest = path.join(SITE, rel);
  try {
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.copyFile(srcFile, dest);
    const shortName = rel.replace(/\\/g, '/');
    warn(`Hot-swapped → ${shortName}`);
    broadcast({ type: 'css-hot', file: path.basename(srcFile) });
  } catch (e) {
    err(`CSS hot-swap failed: ${e}`);
    runJekyllBuild();
  }
}

// ─── WebSocket broadcast ─────────────────────────────────────────────────────
const clients = new Set();

function broadcast(msg) {
  const payload = JSON.stringify(msg);
  clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(payload);
  });
}

// ─── Start WebSocket server ──────────────────────────────────────────────────
const wss = new WebSocketServer({ port: WS_PORT });
wss.on('connection', ws => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});
wss.on('error', e => {
  if (e.code === 'EADDRINUSE') err(`WS port ${WS_PORT} in use — pick another with --ws-port`);
});
info(`WebSocket live-reload on ws://localhost:${WS_PORT}`);

// ─── Start HTTP server ────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`${C.grey}${ts} ${req.method} ${req.url}${C.reset}`);
  serveFile(req, res);
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    const nextPort = HTTP_PORT + 1;
    warn(`Port ${HTTP_PORT} in use, trying ${nextPort}...`);
    server.listen(nextPort, onListen.bind(null, nextPort));
  } else {
    err(String(e));
    process.exit(1);
  }
});

function onListen(port) {
  console.log('');
  info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  info(`  Tillerstead Dev Server`);
  info(`  http://localhost:${port}`);
  info(`  CSS changes → instant hot-swap (no rebuild)`);
  info(`  JS/HTML/MD  → Jekyll rebuild + reload`);
  info(`  Inspector panel auto-injected in browser`);
  info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('');

  if (OPEN_BROWSER) {
    try {
      execSync(`start http://localhost:${port}`, { shell: true });
    } catch (openErr) {
      warn(`Could not auto-open browser: ${openErr.message}`);
    }
  }
}

server.listen(HTTP_PORT, () => onListen(HTTP_PORT));

// ─── File watcher ─────────────────────────────────────────────────────────────
const CSS_PATTERN = path.join(ROOT, 'assets/css/**/*.css').replace(/\\/g, '/');
const OTHER_PATTERN = [
  'assets/js/**/*.js',
  '_includes/**',
  '_layouts/**',
  '_data/**',
  '_posts/**',
  '*.md',
  '*.html',
  '*.yml',
  '_config.yml',
].map(p => path.join(ROOT, p).replace(/\\/g, '/'));

// Watch CSS — hot-swap only
chokidar
  .watch(CSS_PATTERN, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 80 } })
  .on('change', file => hotSwapCSS(file))
  .on('add', file => hotSwapCSS(file));

// Watch everything else — full rebuild
chokidar
  .watch(OTHER_PATTERN, {
    ignoreInitial: true,
    ignored: ['**/node_modules/**', '**/_site/**', '**/.jekyll-cache/**'],
    awaitWriteFinish: { stabilityThreshold: 200 },
  })
  .on('change', file => {
    build_log(`Changed: ${path.relative(ROOT, file).replace(/\\/g, '/')}`);
    runJekyllBuild();
  })
  .on('add', file => {
    build_log(`Added: ${path.relative(ROOT, file).replace(/\\/g, '/')}`);
    runJekyllBuild();
  });

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  info('Shutting down...');
  server.close();
  wss.close();
  process.exit(0);
});
