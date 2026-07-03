#!/usr/bin/env node
const http = require('http');
const url = new URL(process.argv[3] || 'http://127.0.0.1:4173/');
const expectedText = process.argv[5] || 'Tillerstead';
const req = http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    if (!data.includes(expectedText)) {
      console.error(`Expected text "${expectedText}" not found at ${url}`);
      process.exit(1);
    }
    console.log('Standalone http-check passed');
  });
});
req.on('error', (err) => {
  console.error(`Request failed: ${err.message}`);
  process.exit(1);
});
