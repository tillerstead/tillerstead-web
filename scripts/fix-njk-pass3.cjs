/**
 * Third-pass: Fix default(page).property → default(page.property)
 * and .split("x") → | split("x")
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let totalFixed = 0;

function getFiles(dir, ext) {
  const results = [];
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return results;
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '_site') {
        walk(p);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(p);
      }
    }
  }
  walk(full);
  return results;
}

const njkFiles = getFiles('_includes', '.njk');
const htmlFiles = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.html') && fs.statSync(path.join(ROOT, f)).isFile())
  .map(f => path.join(ROOT, f));

const allFiles = [...njkFiles, ...htmlFiles];

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix: | default(page).property → | default(page.property)
  // Also handles chaining: | default(page).a | default(page).b
  // Pattern: default(WORD).DOTPATH where WORD doesn't contain )
  let changed = true;
  while (changed) {
    const before = content;
    content = content.replace(
      /\|\s*default\(([^)]+)\)\.(\w+(?:\.\w+)*)/g,
      '| default($1.$2)'
    );
    changed = content !== before;
  }

  // Fix: | default(site).property → | default(site.property)
  // Already handled by above since it matches any word

  // Fix: VAR .split("delim") → VAR | split("delim")
  content = content.replace(
    /(\w+)\s*\.split\(("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\)/g,
    '$1 | split($2)'
  );

  // Fix: '' | split("") pattern for empty array init
  content = content.replace(
    /''\s*\|\s*split\((""|'')\)/g,
    '[]'
  );

  // Fix double-default chains: | default(page.a) | default(page.b)
  // These are fine actually — Nunjucks chains defaults properly

  // Fix: include.X → X (Nunjucks includes pass variables directly)
  // This was partially done but may have been missed
  content = content.replace(/\binclude\.(\w+)/g, '$1');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${path.relative(ROOT, filePath)}`);
    totalFixed++;
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
