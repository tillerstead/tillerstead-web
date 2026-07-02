// Workbox v7 configuration for Tillerstead.com
// Used by: npm run sw:inject
// The hand-written sw.js contains custom caching strategies;
// workbox injectManifest adds a precache manifest into it.
module.exports = {
  globDirectory: '_site/',
  globPatterns: [
    '**/*.{html,css,js,webp,png,jpg,svg,woff2}',
  ],
  globIgnores: [
    'sw.js',
    'workbox-*.js',
    '**/node_modules/**',
  ],
  swSrc: 'sw.js',
  swDest: '_site/sw.js',
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
};
