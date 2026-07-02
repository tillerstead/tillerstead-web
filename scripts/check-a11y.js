#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pa11y from 'pa11y';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const configPath = path.join(rootDir, '.pa11yci.json');

function loadConfig() {
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function collectUrls(config) {
  const cliUrls = process.argv.slice(2).filter(Boolean);
  if (cliUrls.length > 0) {
    return cliUrls;
  }

  return Array.isArray(config.urls) ? config.urls : [];
}

function createOptions(config) {
  const defaults = config.defaults ?? {};

  return {
    timeout: defaults.timeout ?? 30000,
    wait: defaults.wait ?? 1000,
    standard: defaults.standard ?? 'WCAG2AA',
    chromeLaunchConfig: defaults.chromeLaunchConfig ?? { args: ['--no-sandbox'] },
    ignore: defaults.ignore ?? [],
  };
}

function printIssues(url, issues) {
  if (issues.length === 0) {
    console.log(`PASS ${url}`);
    return;
  }

  console.log(`FAIL ${url}`);
  for (const issue of issues) {
    const selector = issue.selector ? ` ${issue.selector}` : '';
    console.log(`  [${issue.type}] ${issue.code}${selector}`);
    console.log(`  ${issue.message}`);
  }
}

async function main() {
  const config = loadConfig();
  const urls = collectUrls(config);

  if (urls.length === 0) {
    console.error('No URLs configured for accessibility checks.');
    process.exit(1);
  }

  const options = createOptions(config);
  let hasFailures = false;

  for (const url of urls) {
    try {
      const result = await pa11y(url, options);
      printIssues(url, result.issues);
      if (result.issues.length > 0) {
        hasFailures = true;
      }
    } catch (error) {
      hasFailures = true;
      console.log(`ERROR ${url}`);
      console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  process.exit(hasFailures ? 1 : 0);
}

main();
