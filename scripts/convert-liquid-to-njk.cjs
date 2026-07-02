/**
 * Liquid → Nunjucks converter for Tillerstead Jekyll migration
 * Converts all .html includes to .njk with Nunjucks syntax
 */
const fs = require('fs');
const path = require('path');

const INCLUDES_DIR = path.join(__dirname, '..', '_includes');
const SKIP_DIRS = new Set(['layouts']); // Already converted

function convertLiquidToNunjucks(content, filePath) {
  let out = content;

  // 1. Comments: {% comment %}...{% endcomment %} → {# ... #}
  out = out.replace(
    /\{%-?\s*comment\s*-?%\}([\s\S]*?)\{%-?\s*endcomment\s*-?%\}/g,
    (_, body) => `{#${body}#}`
  );

  // 2. assign → set
  out = out.replace(
    /\{%-?\s*assign\s+(\w+)\s*=\s*(.*?)\s*-?%\}/g,
    (_, varName, value) => `{%- set ${varName} = ${value} -%}`
  );

  // 3. capture → set (block form)
  out = out.replace(
    /\{%-?\s*capture\s+(\w+)\s*-?%\}/g,
    (_, varName) => `{%- set ${varName} -%}`
  );
  out = out.replace(/\{%-?\s*endcapture\s*-?%\}/g, '{%- endset -%}');

  // 4. include "file.html" param=val → include "file.njk"
  // Keep simple: just change extensions in include paths
  out = out.replace(
    /\{%-?\s*include\s+(?:["']?)([^"'\s%}]+(?:\.html))(?:["']?)(\s+[^%]*?)?\s*-?%\}/g,
    (match, file, params) => {
      const njkFile = file.replace('.html', '.njk');
      // Drop parameters — they're set as variables before the include in Nunjucks
      return `{% include "${njkFile}" %}`;
    }
  );

  // Also handle includes without extension
  out = out.replace(
    /\{%-?\s*include\s+(?:["']?)([^"'\s%}]+(?:\.js))(?:["']?)(\s+[^%]*?)?\s*-?%\}/g,
    (match, file) => {
      const njkFile = file.replace('.js', '.njk');
      return `{% include "${njkFile}" %}`;
    }
  );

  // 5. site.data.X → X (Eleventy makes _data available at top level)
  out = out.replace(/site\.data\.(\w+)/g, '$1');

  // 6. site.X → site.X (keep — we have _data/site.yml)
  // Already correct format

  // 7. page.X → X for common front-matter vars in layouts
  //    Be careful: page.url stays as page.url in Eleventy
  //    page.title → title, page.description → description, etc.

  // 8. include.X → the variable directly (since we set them before include)
  out = out.replace(/include\.(\w+)/g, '$1');

  // 9. Jekyll environment check → eleventy env
  out = out.replace(
    /\{%-?\s*if\s+jekyll\.environment\s*==\s*['"]development['"]\s*-?%\}/g,
    "{% if env == 'development' %}"
  );

  // 10. Fix Nunjucks filter syntax: | filter: "arg" → | filter("arg")
  // Common cases:
  out = out.replace(/\|\s*date:\s*['"]([^'"]+)['"]/g, '| date("$1")');
  out = out.replace(/\|\s*relative_url/g, '| relative_url');
  out = out.replace(/\|\s*absolute_url/g, '| absolute_url');
  out = out.replace(/\|\s*strip_html/g, '| strip_html');
  out = out.replace(/\|\s*strip_newlines/g, '| strip_newlines');
  out = out.replace(/\|\s*strip\b/g, '| trim');
  out = out.replace(/\|\s*escape/g, '| e');
  out = out.replace(/\|\s*default:\s*['"]([^'"]*)['"]/g, '| default("$1")');
  out = out.replace(/\|\s*default:\s*(\w+)/g, '| default($1)');
  out = out.replace(/\|\s*truncate:\s*(\d+)/g, '| truncate($1)');
  out = out.replace(/\|\s*where:\s*['"](\w+)['"],\s*['"]([^'"]+)['"]/g, '| where("$1", "$2")');
  out = out.replace(/\|\s*sort:\s*['"](\w+)['"]/g, '| sort_by("$1")');
  out = out.replace(/\|\s*join:\s*['"]([^'"]*)['"]/g, "| join('$1')");
  out = out.replace(/\|\s*minus:\s*(\d+)/g, '| minus($1)');
  out = out.replace(/\|\s*plus:\s*(\d+)/g, '| plus($1)');
  out = out.replace(/\|\s*append:\s*['"]([^'"]*)['"]/g, '+ "$1"');
  out = out.replace(/\|\s*prepend:\s*['"]([^'"]*)['"]/g, (_, val) => `"${val}" +`);
  out = out.replace(/\|\s*replace:\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]/g, '| replace("$1", "$2")');
  out = out.replace(/\|\s*split:\s*['"]([^'"]*)['"]/g, '.split("$1")');
  out = out.replace(/\|\s*size\b/g, '| size');

  // 11. unless → if not
  out = out.replace(
    /\{%-?\s*unless\s+(.*?)\s*-?%\}/g,
    (_, cond) => `{%- if not (${cond}) -%}`
  );
  out = out.replace(/\{%-?\s*endunless\s*-?%\}/g, '{%- endif -%}');

  // 12. Ensure double-quoted include paths
  out = out.replace(
    /\{%\s*include\s+([^"'][^\s%]+\.njk)/g,
    '{% include "$1"'
  );

  return out;
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let converted = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      converted += processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const njkContent = convertLiquidToNunjucks(content, fullPath);
      const njkPath = fullPath.replace(/\.html$/, '.njk');

      fs.writeFileSync(njkPath, njkContent, 'utf-8');
      converted++;
      console.log(`✓ ${path.relative(INCLUDES_DIR, njkPath)}`);
    } else if (entry.isFile() && entry.name.endsWith('.js') && dir.includes('schema')) {
      // Schema JS includes → .njk
      const content = fs.readFileSync(fullPath, 'utf-8');
      const njkContent = convertLiquidToNunjucks(content, fullPath);
      const njkPath = fullPath.replace(/\.js$/, '.njk');

      fs.writeFileSync(njkPath, njkContent, 'utf-8');
      converted++;
      console.log(`✓ ${path.relative(INCLUDES_DIR, njkPath)}`);
    }
  }
  return converted;
}

console.log('Converting Liquid → Nunjucks includes...\n');
const count = processDirectory(INCLUDES_DIR);
console.log(`\n✅ Converted ${count} files`);
