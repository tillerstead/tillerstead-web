/**
 * Fix remaining Liquid→Nunjucks issues in .njk files
 * - elsif → elif
 * - X contains Y → Y in X  
 * - endunless leftover → endif
 * - page.X → X for front matter data (except page.url, page.date)
 */
const fs = require('fs');
const path = require('path');

const INCLUDES_DIR = path.join(__dirname, '..', '_includes');
let fixCount = 0;

function fixNunjucks(content, filePath) {
  let out = content;

  // elsif → elif
  out = out.replace(/\{%-?\s*elsif\b/g, (m) => m.replace('elsif', 'elif'));
  
  // X contains 'Y' → 'Y' in X (simple cases)
  out = out.replace(/(\w+)\s+contains\s+(['"][^'"]+['"])/g, '$2 in $1');
  
  // Fix leftover endunless
  out = out.replace(/\{%-?\s*endunless\s*-?%\}/g, '{%- endif -%}');
  
  // Fix leftover unless → if not
  out = out.replace(
    /\{%-?\s*unless\s+(.*?)\s*-?%\}/g,
    (_, cond) => `{%- if not (${cond}) -%}`
  );

  // page.collection → collections
  // page.layout → layout
  // page.is_home → is_home (front matter direct access)
  // BUT keep page.url and page.date (these are Eleventy page object properties)
  out = out.replace(/page\.is_home/g, 'is_home');
  out = out.replace(/page\.layout/g, 'layout');
  out = out.replace(/page\.collection/g, 'collections');
  out = out.replace(/page\.meta_title/g, 'meta_title');
  out = out.replace(/page\.meta_description/g, 'meta_description');
  out = out.replace(/page\.description/g, 'description');
  out = out.replace(/page\.title\b/g, 'title');
  out = out.replace(/page\.body_class/g, 'body_class');
  out = out.replace(/page\.build_guide/g, 'build_guide');
  out = out.replace(/page\.build_title/g, 'build_title');
  out = out.replace(/page\.order\b/g, 'order');
  out = out.replace(/page\.toc\b/g, 'toc');
  out = out.replace(/page\.author\b/g, 'author');
  out = out.replace(/page\.featured_image/g, 'featured_image');
  out = out.replace(/page\.date_modified/g, 'date_modified');
  out = out.replace(/page\.hero_/g, 'hero_');
  out = out.replace(/page\.show_breadcrumbs/g, 'show_breadcrumbs');
  out = out.replace(/page\.keywords\b/g, 'keywords');
  out = out.replace(/page\.scripts\b/g, 'scripts');
  out = out.replace(/page\.stylesheets\b/g, 'stylesheets');
  out = out.replace(/page\.robots\b/g, 'robots');
  out = out.replace(/page\.extra_head/g, 'extra_head');
  out = out.replace(/page\.parent\b/g, 'parent');
  out = out.replace(/page\.breadcrumb_parent/g, 'breadcrumb_parent');
  out = out.replace(/page\.parent_label/g, 'parent_label');
  out = out.replace(/page\.breadcrumb_parent_label/g, 'breadcrumb_parent_label');
  out = out.replace(/page\.breadcrumb_title/g, 'breadcrumb_title');
  out = out.replace(/page\.category/g, 'category');
  out = out.replace(/page\.tags/g, 'tags');
  out = out.replace(/page\.permalink/g, 'permalink');
  out = out.replace(/page\.canonical_url/g, 'canonical_url');
  out = out.replace(/page\.og_/g, 'og_');
  out = out.replace(/page\.twitter_/g, 'twitter_');
  out = out.replace(/page\.schema_type/g, 'schema_type');

  // site.html_pages → collections.all
  out = out.replace(/site\.html_pages/g, 'collections.all');
  
  // where_exp with complex p.url == lookup_url → simplified
  // This is too complex for auto-fix, the breadcrumbs include would need manual work

  return out;
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.njk') && !fullPath.includes('layouts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const fixed = fixNunjucks(content, fullPath);
      if (fixed !== content) {
        fs.writeFileSync(fullPath, fixed, 'utf-8');
        fixCount++;
        console.log(`✓ Fixed: ${path.relative(INCLUDES_DIR, fullPath)}`);
      }
    }
  }
}

console.log('Fixing Nunjucks syntax issues...\n');
processDirectory(INCLUDES_DIR);
console.log(`\n✅ Fixed ${fixCount} files`);
