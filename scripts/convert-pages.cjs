/**
 * Convert Tillerstead page templates (root .html/.md files) from Liquid to Nunjucks
 * Updates: include syntax, assign→set, comment→{# #}, contains→in, etc.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES_GLOB = [
  'index.md',
  'about.html', 'blog.html', 'contact.html', 'faq.html',
  'portfolio.html', 'services.html', 'reviews.html', 'pricing.html',
  'process.html', 'products.html', 'privacy.html', 'terms.html',
  'disclaimers.html', 'copyright.html', 'plans.html',
  'homeowner-resources.html', 'for-general-contractors.html',
  'nj-tile-guide.html', 'tile-visualizer.html', 'tillerpro.html',
  'tools-hub.html', 'tools.html', 'room-planner.html',
  '404.html', 'offline.html', 'success.html',
  'financing.html', 'build.html',
  'atlantic-county-nj.html', 'ocean-county-nj.html', 'cape-may-county-nj.html',
];

let converted = 0;

for (const file of PAGES_GLOB) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Split front matter from body
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) continue;

  let frontMatter = fmMatch[1];
  let body = fmMatch[2];

  // Convert body Liquid → Nunjucks
  let newBody = body;

  // Comments
  newBody = newBody.replace(
    /\{%-?\s*comment\s*-?%\}([\s\S]*?)\{%-?\s*endcomment\s*-?%\}/g,
    (_, b) => `{#${b}#}`
  );

  // assign → set
  newBody = newBody.replace(
    /\{%-?\s*assign\s+(\w+)\s*=\s*(.*?)\s*-?%\}/g,
    (_, v, val) => `{%- set ${v} = ${val} -%}`
  );

  // include file.html → include "file.njk"
  newBody = newBody.replace(
    /\{%-?\s*include\s+(?:["']?)([^"'\s%}]+\.html)(?:["']?)(\s+[^%]*?)?\s*-?%\}/g,
    (_, file, params) => `{% include "${file.replace('.html', '.njk')}" %}`
  );

  // site.data.X → X
  newBody = newBody.replace(/site\.data\.(\w+)/g, '$1');

  // page.X → X for front matter (keep page.url, page.date)
  newBody = newBody.replace(/page\.description/g, 'description');
  newBody = newBody.replace(/page\.title\b/g, 'title');

  // Filter syntax
  newBody = newBody.replace(/\|\s*relative_url/g, '| relative_url');
  newBody = newBody.replace(/\|\s*absolute_url/g, '| absolute_url');
  newBody = newBody.replace(/\|\s*default:\s*['"]([^'"]*)['"]/g, '| default("$1")');
  newBody = newBody.replace(/\|\s*default:\s*(\w+)/g, '| default($1)');

  // site.company → site.company (keep, it's in _data/site.yml)
  
  // elsif → elif
  newBody = newBody.replace(/\{%-?\s*elsif\b/g, (m) => m.replace('elsif', 'elif'));

  // size filter on collections
  newBody = newBody.replace(/site\.data\.reviews\.size/g, 'reviews | size');

  if (newBody !== body) {
    changed = true;
  }

  if (changed) {
    const output = `---\n${frontMatter}\n---\n${newBody}`;
    fs.writeFileSync(filePath, output, 'utf-8');
    converted++;
    console.log(`✓ ${file}`);
  }
}

console.log(`\n✅ Converted ${converted} pages`);
