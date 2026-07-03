/**
 * Tillerstead — Health Check Module
 *
 * Standalone PackageHealth interface. No external Evident config dependency.
 * Build-time oriented checks for an Eleventy static site.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

type HealthCheck = {
  name: string;
  passed: boolean;
  message?: string;
  vital: boolean;
};

type PackageHealth = {
  name: string;
  version: string;
  status: 'healthy' | 'degraded' | 'critical';
  checks: HealthCheck[];
  reportedAt: string;
};

function readPkg(): { name: string; version: string } {
  try {
    return JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  } catch {
    return { name: 'tillerstead', version: '0.0.0' };
  }
}

function checkBuildOutput(): HealthCheck {
  const siteIndex = resolve(root, '_site', 'index.html');
  const passed = existsSync(siteIndex);
  return {
    name: 'build-output',
    passed,
    message: passed ? undefined : '_site/index.html missing — run build',
    vital: true,
  };
}

function checkEleventyConfig(): HealthCheck {
  const config = resolve(root, '.eleventy.js');
  const configAlt = resolve(root, 'eleventy.config.js');
  const passed = existsSync(config) || existsSync(configAlt);
  return {
    name: 'eleventy-config',
    passed,
    message: passed ? undefined : 'Eleventy config missing',
    vital: true,
  };
}

function checkServiceWorker(): HealthCheck {
  const sw = resolve(root, '_site', 'sw.js');
  const passed = existsSync(sw);
  return {
    name: 'service-worker',
    passed,
    message: passed ? undefined : 'sw.js not generated — run sw:generate',
    vital: false,
  };
}

function checkAssets(): HealthCheck {
  const cssBundle = resolve(root, 'assets', 'css', 'bundle.min.css');
  const jsBundle = resolve(root, 'assets', 'js', 'bundle.min.js');
  const passed = existsSync(cssBundle) && existsSync(jsBundle);
  return {
    name: 'asset-bundles',
    passed,
    message: passed ? undefined : 'Minified bundles missing — run minify:all',
    vital: false,
  };
}

function run(): PackageHealth {
  const pkg = readPkg();
  const checks = [checkBuildOutput(), checkEleventyConfig(), checkServiceWorker(), checkAssets()];
  const vitalFailed = checks.some((c) => c.vital && !c.passed);
  const anyFailed = checks.some((c) => !c.passed);

  const health: PackageHealth = {
    name: pkg.name,
    version: pkg.version,
    status: vitalFailed ? 'critical' : anyFailed ? 'degraded' : 'healthy',
    checks,
    reportedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(health, null, 2));
  return health;
}

export default run;

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
