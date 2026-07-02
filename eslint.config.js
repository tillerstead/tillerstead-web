// Tillerstead.com ESLint v9 configuration
// Migrated from .eslintrc.json — see /.ai/OUTPUT_RULES.md for code quality standards

import js from '@eslint/js';
import globals from 'globals';

export default [
  // Global ignores (equivalent to .eslintignore)
  {
    ignores: [
      'node_modules/',
      '_site/',
      '_site_public/',
      'test-results/',
      '**/*.min.js',
      '**/*.bundle.js',
      '*.test.js',
      '*.spec.js',
      'vendor/',
      'dist/',
      'coverage/',
      'playwright-report/',
      'scripts/test-results/',
      'archive/',
      '_includes/',
      'scripts/verify-deployment.scss',
      '**/*.scss',
      '.mcp-agents/**',
      'build/**',
      '.venv/**',
      'admin/**/*.js',
      'sw.js',
      'tests/**/*.js',
      'Contractor-Command-Center/**',
      'toolkit/**/dist/**',
    ],
  },

  // Base configuration for all JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Custom globals
        tsScrollFix: 'writable',
        tsPerformanceMode: 'writable',
        // Third-party libraries (loaded via CDN / separate scripts)
        gsap: 'readonly',
        Lenis: 'readonly',
        lottie: 'readonly',
        AOS: 'readonly',
        gtag: 'readonly',
        ga: 'readonly',
        // Cross-script shared globals
        showToast: 'readonly',
        LOGO_BASE64: 'readonly',
        PROJECTS: 'readonly',
        QuoteValidator: 'readonly',
        rect: 'readonly',
        // Dual-mode module support (CJS export guard at EOF)
        module: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,

      // Warn on unused variables, but ignore those prefixed with _
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // Allow console for transparency and debugging (see /.ai/DOMAIN.md)
      'no-console': 'off',

      // Enforce consistent 2-space indentation
      indent: ['warn', 2, { SwitchCase: 1 }],

      // Semicolons: warn only
      semi: ['warn', 'always'],

      // Quotes: warn only, allow double quotes
      quotes: ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],

      // Disallow trailing spaces
      'no-trailing-spaces': 'warn',

      // Require newline at end of file
      'eol-last': ['warn', 'always'],
    },
  },

  // Node.js scripts and automation files
  {
    files: [
      'scripts/**/*.js',
      'scripts/**/*.mjs',
      'admin/**/*.js',
      '_data/**/*.js',
      'ventures/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        console: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },

  // CommonJS files specifically
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        // Node.js + CommonJS globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        console: 'readonly',
      },
    },
  },
];
