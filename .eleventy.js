/**
 * Tillerstead.com â€” Eleventy Configuration
 * Migrated from Jekyll 4.2 â†’ Eleventy 3.x
 */
import { createRequire } from 'module';
import { DateTime } from 'luxon';
import markdownIt from 'markdown-it';
import pluginRss from '@11ty/eleventy-plugin-rss';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';


export default function (eleventyConfig) {
  const markdownWrappedBlockTags = [
    'article',
    'a',
    'aside',
    'div',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'main',
    'nav',
    'ol',
    'section',
    'table',
    'ul',
  ];

  // â”€â”€â”€ YAML Data Extension (required for Eleventy 3.x) â”€â”€
  eleventyConfig.addDataExtension('yaml,yml', contents => yaml.load(contents));

  // â”€â”€â”€ Plugins â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  eleventyConfig.addPlugin(pluginRss);

  // â”€â”€â”€ Passthrough Copy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.addPassthroughCopy('manifest.webmanifest');
  eleventyConfig.addPassthroughCopy('robots.txt');
  eleventyConfig.addPassthroughCopy('CNAME');
  eleventyConfig.addPassthroughCopy('_headers');
  eleventyConfig.addPassthroughCopy('favicon.ico');
  eleventyConfig.addPassthroughCopy('tile-visualizer.html');
  eleventyConfig.addPassthroughCopy('about.html');
  eleventyConfig.addPassthroughCopy('blog.html');
  eleventyConfig.addPassthroughCopy('homeowner-resources.html');
  eleventyConfig.addPassthroughCopy('portfolio.html');
  eleventyConfig.addPassthroughCopy('apple-touch-icon.png');
  eleventyConfig.addPassthroughCopy('favicon-16x16.png');
  eleventyConfig.addPassthroughCopy('favicon-32x32.png');
  eleventyConfig.addPassthroughCopy('browserconfig.xml');
  eleventyConfig.addPassthroughCopy('sitemap.xml');
  eleventyConfig.addPassthroughCopy('.well-known');

  // â”€â”€â”€ HTML Cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Public routes now render directly from Nunjucks templates, so the
  // legacy markdown wrapper cleanup is disabled to avoid mutating valid HTML.

  // â”€â”€â”€ Watch Targets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  eleventyConfig.addWatchTarget('assets/css/');
  eleventyConfig.addWatchTarget('assets/js/');

  // â”€â”€â”€ Markdown Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const md = markdownIt({
    html: true,
    breaks: false,
    linkify: true,
    typographer: true,
  });
  eleventyConfig.setLibrary('md', md);

  // markdownify filter (Jekyll compat â€” renders Markdown inline)
  eleventyConfig.addFilter('markdownify', function (str) {
    if (!str) return '';
    return md.renderInline(String(str));
  });

  // â”€â”€â”€ Collections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Blog posts from _posts/ (Jekyll-compatible date-slug filenames)
  eleventyConfig.addCollection('posts', function (collectionApi) {
    return collectionApi.getFilteredByGlob('_posts/*.md').sort((a, b) => b.date - a.date);
  });

  // Build guides from src/build/ folder
  eleventyConfig.addCollection('buildGuides', function (collectionApi) {
    return collectionApi
      .getFilteredByGlob('src/build/**/*.{html,njk,md}')
      .filter(item => item.data.build_guide)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // â”€â”€â”€ Custom Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Jekyll-compatible relative_url filter
  eleventyConfig.addFilter('relative_url', function (url) {
    return url || '';
  });

  // Jekyll-compatible absolute_url filter
  eleventyConfig.addFilter('absolute_url', function (url) {
    const siteUrl = this.ctx?.site?.url || 'https://tillerstead.com';
    if (!url) return siteUrl;
    if (url.startsWith('http')) return url;
    return siteUrl + url;
  });

  // Date formatting (replaces Jekyll date filter)
  eleventyConfig.addFilter('date', function (dateObj, format) {
    if (!dateObj) return '';
    // Handle Jekyll-style format strings
    const formatMap = {
      '%Y-%m-%d': 'yyyy-MM-dd',
      '%Y-%m-%dT%H:%M:%SZ': "yyyy-MM-dd'T'HH:mm:ss'Z'",
      '%B %-d, %Y': 'MMMM d, yyyy',
      '%B %d, %Y': 'MMMM dd, yyyy',
      '%Y': 'yyyy',
    };
    const luxonFormat = formatMap[format] || format || 'MMMM d, yyyy';

    // Handle 'now' string
    if (dateObj === 'now') {
      return DateTime.now().toFormat(luxonFormat);
    }
    const dt =
      dateObj instanceof Date ? DateTime.fromJSDate(dateObj) : DateTime.fromISO(String(dateObj));
    return dt.isValid ? dt.toFormat(luxonFormat) : String(dateObj);
  });

  // Array where filter (replaces Jekyll where)
  eleventyConfig.addFilter('where', function (array, key, value) {
    if (!array) return [];
    return array.filter(item => item[key] === value);
  });

  // where_exp filter (replaces Jekyll where_exp)
  // Simplified: use where filter + key comparison
  eleventyConfig.addFilter('where_exp', function (array, varName, expression) {
    if (!array) return [];
    // Parse simple "x.prop == value" expressions
    const match = expression.match(/(\w+)\.(\w+)\s*==\s*['"]?([^'"]+)['"]?/);
    if (match) {
      const [, , prop, val] = match;
      return array.filter(item => String(item[prop]).trim() === String(val).trim());
    }
    return array;
  });

  // Jekyll sort filter
  eleventyConfig.addFilter('sort_by', function (array, key) {
    if (!array) return [];
    return [...array].sort((a, b) => {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    });
  });

  // first / last
  eleventyConfig.addFilter('first', function (array) {
    return array && array.length ? array[0] : null;
  });

  eleventyConfig.addFilter('last', function (array) {
    return array && array.length ? array[array.length - 1] : null;
  });

  // push filter (for array building in breadcrumbs)
  eleventyConfig.addFilter('push', function (array, item) {
    return [...(array || []), item];
  });

  // slice filter (replaces Liquid slice/limit)
  eleventyConfig.addFilter('slice', function (array, start, count) {
    if (!array) return [];
    return Array.isArray(array)
      ? array.slice(start, start + count)
      : String(array).slice(start, start + count);
  });

  // strip_html (replaces Jekyll strip_html)
  eleventyConfig.addFilter('strip_html', function (str) {
    return str ? String(str).replace(/<[^>]*>/g, '') : '';
  });

  // strip_newlines
  eleventyConfig.addFilter('strip_newlines', function (str) {
    return str ? String(str).replace(/\n/g, '') : '';
  });

  // truncatewords
  eleventyConfig.addFilter('truncatewords', function (str, count) {
    if (!str) return '';
    const words = String(str).split(/\s+/);
    if (words.length <= count) return str;
    return words.slice(0, count).join(' ') + '...';
  });

  // size filter (array/string length)
  eleventyConfig.addFilter('size', function (val) {
    if (!val) return 0;
    return val.length || 0;
  });

  // minus / plus (arithmetic)
  eleventyConfig.addFilter('minus', function (a, b) {
    return Number(a) - Number(b);
  });
  eleventyConfig.addFilter('plus', function (a, b) {
    return Number(a) + Number(b);
  });

  // date_to_xmlschema (Jekyll compat â€” ISO 8601)
  eleventyConfig.addFilter('date_to_xmlschema', function (dateObj) {
    if (!dateObj) return '';
    return new Date(dateObj).toISOString();
  });

  // capitalize
  eleventyConfig.addFilter('capitalize', function (str) {
    if (!str) return '';
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
  });

  // join filter (in case Nunjucks join isn't enough)
  eleventyConfig.addFilter('join_array', function (arr, sep) {
    return arr ? arr.join(sep || ', ') : '';
  });

  // â”€â”€â”€ Shortcodes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Year shortcode for copyright
  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  // â”€â”€â”€ Global Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Set Nunjucks as default for .html files
  eleventyConfig.setNunjucksEnvironmentOptions({
    throwOnUndefined: false,
    autoescape: false,
  });

  // â”€â”€â”€ Layouts Alias â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  eleventyConfig.addLayoutAlias('default', 'layouts/default.njk');
  eleventyConfig.addLayoutAlias('page', 'layouts/page.njk');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.njk');
  eleventyConfig.addLayoutAlias('build-page', 'layouts/page.njk');

  // â”€â”€ Dev-mode source annotations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Injects data-source attribute and HTML comment on <body> so you can
  // Inspect Element â†’ see which template generated the page.
  // Only active in development â€” zero impact on production builds.
  const isDev =
    process.env.ELEVENTY_ENV === 'development' || process.env.NODE_ENV === 'development';
  if (isDev) {
    eleventyConfig.addTransform('devSourceAnnotation', function (content) {
      if (!(this.page.outputPath || '').endsWith('.html')) return content;
      const src = this.page.inputPath.replace(/^\.\//, '');
      const comment = `<!-- SOURCE: ${src} -->`;
      const annotated = content.replace(
        /(<body\b)([^>]*>)/i,
        `$1 data-source="${src}"$2\n${comment}`
      );
      return annotated;
    });
  }

  // â”€â”€â”€ Directory Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Build hash + content-hashed asset pipeline
  const buildHash = crypto.createHash('sha256').update(Date.now().toString()).digest('hex').slice(0, 12);


  eleventyConfig.on('eleventy.after', () => {
    const siteDir = path.join(process.cwd(), '_site');

    // Local replacement for removed ../../packages/build-utils postBuild
    // Writes a minimal BUILD_INFO.json for parity with prior deploy verification.
    const buildInfo = { project: "tillerstead", hash: buildHash, builtAt: new Date().toISOString() };
    try {
      fs.writeFileSync(path.join(siteDir, "BUILD_INFO.json"), JSON.stringify(buildInfo, null, 2));
    } catch (err) {
      console.warn("Warning: could not write BUILD_INFO.json:", err.message);
    }
  });

    return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    pathPrefix: '/',
  };
}
