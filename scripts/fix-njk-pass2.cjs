/**
 * Second-pass Liquid→Nunjucks syntax fixer
 * Catches patterns missed by the first conversion script
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dirs = ['_includes', '.'];

function getFiles(dir, ext) {
  const results = [];
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return results;
  
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '_site') {
        walk(p);
      } else if (entry.isFile() && (entry.name.endsWith(ext) || (ext === '.html' && entry.name.endsWith('.html')))) {
        results.push(p);
      }
    }
  }
  walk(full);
  return results;
}

// Get all .njk and root .html files
const njkFiles = getFiles('_includes', '.njk');
const htmlFiles = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.html') && fs.statSync(path.join(ROOT, f)).isFile())
  .map(f => path.join(ROOT, f));

const allFiles = [...njkFiles, ...htmlFiles];

let totalFixed = 0;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // 1. assign → set
  content = content.replace(/\{%-?\s*assign\s+/g, (m) => m.replace('assign', 'set'));
  
  // 2. Liquid filter syntax: | filter: arg → | filter(arg)
  // Handle: | default: value
  content = content.replace(/\|\s*default:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\S+)/g, '| default($1)');
  // Handle: | date: "format"
  content = content.replace(/\|\s*date:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '| date($1)');
  // Handle: | truncate: N
  content = content.replace(/\|\s*truncate:\s*(\d+)/g, '| truncate($1)');
  // Handle: | truncatewords: N
  content = content.replace(/\|\s*truncatewords:\s*(\d+)/g, '| truncatewords($1)');
  // Handle: | replace: "a", "b"
  content = content.replace(/\|\s*replace:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*,\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '| replace($1, $2)');
  // Handle: | append: val
  content = content.replace(/\|\s*append:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\S+?)(\s*[%}|])/g, '| append($1)$2');
  // Handle: | prepend: val
  content = content.replace(/\|\s*prepend:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\S+?)(\s*[%}|])/g, '| prepend($1)$2');
  // Handle: | split: "x"
  content = content.replace(/\|\s*split:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '| split($1)');
  // Handle: | join: "x"
  content = content.replace(/\|\s*join:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '| join($1)');
  // Handle: | sort: "field"
  content = content.replace(/\|\s*sort:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '| sort_by($1)');
  // Handle: | where: "field", "value"
  content = content.replace(/\|\s*where:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*,\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '| where($1, $2)');
  // Handle: | where_exp: "var", "expr"
  content = content.replace(/\|\s*where_exp:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*,\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '| where_exp($1, $2)');
  // Handle: | slice: start, count
  content = content.replace(/\|\s*slice:\s*(\d+)\s*,\s*(\d+)/g, '| slice($1, $2)');
  // Handle: | minus: N
  content = content.replace(/\|\s*minus:\s*(\d+)/g, '| minus($1)');
  // Handle: | plus: N  (but not plus(N) already done)
  content = content.replace(/\|\s*plus:\s*(\d+)(?!\))/g, '| plus($1)');
  // Handle: | escape
  content = content.replace(/\|\s*escape(?!\()\b/g, '| e');
  // Handle: | strip (?!_)
  content = content.replace(/\|\s*strip(?!_)(?!\()\b/g, '| trim');
  // Handle: | jsonify
  content = content.replace(/\|\s*jsonify(?!\()\b/g, '| dump');
  // Handle: | capitalize
  content = content.replace(/\|\s*capitalize(?!\()\b/g, '| capitalize');
  // Handle: | size → | length
  content = content.replace(/\|\s*size(?!\()\b/g, '| length');
  // Handle: | first → | first
  content = content.replace(/\|\s*first(?!\()\b/g, '| first');
  // Handle: | last → | last
  content = content.replace(/\|\s*last(?!\()\b/g, '| last');
  // Handle: | reverse
  content = content.replace(/\|\s*reverse(?!\()\b/g, '| reverse');
  
  // 3. .size → .length
  content = content.replace(/\.size\b(?!\s*[=(])/g, '.length');
  
  // 4. forloop → loop
  content = content.replace(/\bforloop\./g, 'loop.');
  
  // 5. Fix elsif → elif (missed ones)
  content = content.replace(/\{%-?\s*elsif\s/g, (m) => m.replace('elsif', 'elif'));
  
  // 6. Fix endunless → endif (missed ones)
  content = content.replace(/\{%-?\s*endunless\s*-?%}/g, '{% endif %}');
  
  // 7. Fix unless → if not
  content = content.replace(/\{%-?\s*unless\s+(.+?)\s*-?%}/g, (_, cond) => `{%- if not (${cond.trim()}) -%}`);
  
  // 8. site.posts → collections.posts
  content = content.replace(/\bsite\.posts\b/g, 'collections.posts');
  
  // 9. site.build → collections.buildGuides
  content = content.replace(/\bsite\.build\b/g, 'collections.buildGuides');
  
  // 10. .split("/") method call → Nunjucks doesn't have .split, use split filter
  // This one is tricky - .split() is JS not Liquid, but was generated by prior conversion
  // content = content.replace(/(\w+)\s*\.split\(("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\)/g, '$1 | split($2)');
  
  // 11. nil → none (Nunjucks uses none for null)
  content = content.replace(/\b== nil\b/g, '== none');
  content = content.replace(/\b!= nil\b/g, '!= none');
  content = content.replace(/\bset\s+(\w+)\s*=\s*nil\b/g, 'set $1 = none');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const rel = path.relative(ROOT, filePath);
    console.log(`Fixed: ${rel}`);
    totalFixed++;
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
