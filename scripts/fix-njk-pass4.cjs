/**
 * Fourth-pass: Fix remaining Liquid colon-syntax filters
 * - append: → ~ (concatenation)
 * - push: → push() (custom filter)
 * - slice: → slice() (custom filter)
 * - plus: → plus() where not already done
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

  // Fix | append: expr → string concatenation with ~
  // Pattern: VAR | append: EXPR where EXPR can be quoted string or variable
  // In Nunjucks: use ~ for concatenation
  // "icon-" | append: fact.icon → "icon-" ~ fact.icon
  content = content.replace(
    /\|\s*append:\s*([^\s%}|]+(?:\s*\+\s*[^\s%}|]+)*)/g,
    '~ $1'
  );

  // Fix | push: value → | push(value)
  content = content.replace(
    /\|\s*push:\s*([^\s%}|]+)/g,
    '| push($1)'
  );

  // Fix | slice: N, M → | slice(N, M)
  content = content.replace(
    /\|\s*slice:\s*(\d+)\s*,\s*(\w+)/g,
    '| slice($1, $2)'
  );

  // Fix | plus: N → | plus(N) (where not already parenthesized)
  content = content.replace(
    /\|\s*plus:\s*(\d+)/g,
    '| plus($1)'
  );

  // Fix | minus: N → | minus(N) 
  content = content.replace(
    /\|\s*minus:\s*(\d+)/g,
    '| minus($1)'
  );

  // Fix remaining | default: value patterns
  content = content.replace(
    /\|\s*default:\s*(\[[^\]]*\]|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\w+(?:\.\w+)*)/g,
    '| default($1)'
  );

  // Fix | remove: "x" → | replace("x", "")
  content = content.replace(
    /\|\s*remove:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, 
    '| replace($1, "")'
  );

  // Fix remaining nil → none
  content = content.replace(/== nil\b/g, '== none');
  content = content.replace(/!= nil\b/g, '!= none');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${path.relative(ROOT, filePath)}`);
    totalFixed++;
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
