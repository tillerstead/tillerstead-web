const fs = require('fs');
const path = require('path');
const target = process.argv[2] || '_site';
const root = path.resolve(process.cwd(), target);

let failed = false;
for (const p of ['index.html', 'CNAME']) {
  const full = path.join(root, p);
  if (!fs.existsSync(full)) {
    console.error(`Missing: ${full}`);
    failed = true;
  }
}

if (failed) {
  console.error('Standalone verify-build failed');
  process.exit(1);
}
console.log('Standalone verify-build passed');
