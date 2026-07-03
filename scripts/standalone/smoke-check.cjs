#!/usr/bin/env node
const http = require('http');
const base = process.argv[3] || 'http://127.0.0.1:4173';
const endpoints = (process.argv[5] || '/health,/ready').split(',');

let pending = endpoints.length;
let failed = false;

for (const endpoint of endpoints) {
  const url = new URL(endpoint, base);
  http
    .get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 400) {
        console.error(`Smoke check failed for ${endpoint}: ${res.statusCode}`);
        failed = true;
      }
      res.resume();
      if (--pending === 0) {
        if (failed) process.exit(1);
        console.log('Standalone smoke-check passed');
      }
    })
    .on('error', (err) => {
      console.error(`Smoke check failed for ${endpoint}: ${err.message}`);
      failed = true;
      if (--pending === 0) process.exit(1);
    });
}
