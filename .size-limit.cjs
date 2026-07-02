// Size Limit Configuration
// Monitors bundle sizes to prevent bloat

module.exports = [
  {
    name: 'Main JS Bundle',
    path: '_site/assets/js/main.js',
    limit: '50 KB',
  },
  {
    name: 'CSS Bundle',
    path: '_site/assets/css/*.css',
    limit: '200 KB', // Increased for comprehensive tile contractor site
  },
];
