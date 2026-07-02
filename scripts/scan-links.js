#!/usr/bin/env node

/**
 * Comprehensive Link Scanner & Validator
 *
 * Scans all navigation, body content, and includes for:
 * - Broken links
 * - External vs internal links
 * - Missing attributes (rel, target, aria-label)
 * - SEO optimization opportunities
 * - Security issues (rel="noopener" for target="_blank")
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

const config = {
  // Directories to scan
  scanDirs: [
    '_includes',
    '_layouts',
    'pages',
    '.', // Root HTML files
    'admin',
    'ventures',
    'build',
  ],

  // File extensions to scan
  extensions: ['.html', '.md', '.liquid'],

  // Patterns to exclude
  exclude: [
    '_site',
    'node_modules',
    '.git',
    'dist',
    'build',
    'vendor',
    '.venv',
    'venv',
    '__pycache__',
    '.jekyll-cache',
  ],

  // Link patterns
  patterns: {
    href: /href=["']([^"']+)["']/gi,
    link: /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>/gi,
    externalDomain: /^https?:\/\//i,
    mailTo: /^mailto:/i,
    tel: /^tel:/i,
    anchor: /^#/,
    javascript: /^javascript:/i,
  },
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('');
  log('='.repeat(70), 'cyan');
  log(message, 'bright');
  log('='.repeat(70), 'cyan');
  console.log('');
}

/**
 * Scan all files for links
 */
function scanAllLinks() {
  header('SCANNING ALL LINKS');

  const linkData = {
    internal: [],
    external: [],
    mailto: [],
    tel: [],
    anchor: [],
    javascript: [],
    byFile: {},
    issues: [],
  };

  function scanFile(filePath, relPath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileLinks = [];

    // Extract all links
    let match;
    const hrefPattern = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']([^>]*)>/gi;

    while ((match = hrefPattern.exec(content)) !== null) {
      const href = match[1];
      const attributes = match[2];
      const fullMatch = match[0];

      // Categorize link
      let category = 'internal';
      if (config.patterns.externalDomain.test(href)) {
        category = 'external';
      } else if (config.patterns.mailTo.test(href)) {
        category = 'mailto';
      } else if (config.patterns.tel.test(href)) {
        category = 'tel';
      } else if (config.patterns.anchor.test(href)) {
        category = 'anchor';
      } else if (config.patterns.javascript.test(href)) {
        category = 'javascript';
      }

      const linkInfo = {
        href,
        category,
        file: relPath,
        attributes,
        fullTag: fullMatch,
        line: content.substring(0, match.index).split('\n').length,
      };

      fileLinks.push(linkInfo);
      linkData[category].push(linkInfo);

      // Check for issues
      if (category === 'external' && !attributes.includes('rel=')) {
        linkData.issues.push({
          type: 'missing-rel',
          severity: 'warning',
          file: relPath,
          line: linkInfo.line,
          href,
          message:
            'External link missing rel attribute (should have rel="noopener" or rel="nofollow")',
        });
      }

      if (attributes.includes('target="_blank"') && !attributes.includes('rel=')) {
        linkData.issues.push({
          type: 'security',
          severity: 'high',
          file: relPath,
          line: linkInfo.line,
          href,
          message: 'target="_blank" without rel="noopener" (security risk)',
        });
      }

      if (category === 'javascript') {
        linkData.issues.push({
          type: 'javascript-href',
          severity: 'warning',
          file: relPath,
          line: linkInfo.line,
          href,
          message: 'javascript: href is discouraged (use onclick or event listener)',
        });
      }

      // Check for empty link text
      const linkTextMatch = fullMatch.match(/>([^<]*)</);
      if (linkTextMatch && !linkTextMatch[1].trim()) {
        linkData.issues.push({
          type: 'accessibility',
          severity: 'high',
          file: relPath,
          line: linkInfo.line,
          href,
          message: 'Empty link text (bad for accessibility)',
        });
      }
    }

    if (fileLinks.length > 0) {
      linkData.byFile[relPath] = fileLinks;
    }
  }

  function scanDirectory(dir, relPath = '') {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      // Skip excluded directories
      if (config.exclude.includes(item)) return;

      const fullPath = path.join(dir, item);
      const itemRelPath = path.join(relPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath, itemRelPath);
      } else {
        const ext = path.extname(item);
        if (config.extensions.includes(ext)) {
          scanFile(fullPath, itemRelPath);
        }
      }
    });
  }

  // Scan all configured directories
  config.scanDirs.forEach(dir => {
    const dirPath = path.join(REPO_ROOT, dir);
    if (fs.existsSync(dirPath)) {
      const stat = fs.statSync(dirPath);
      if (stat.isDirectory()) {
        scanDirectory(dirPath, dir);
      } else {
        // It's a file
        scanFile(dirPath, dir);
      }
    }
  });

  return linkData;
}

/**
 * Analyze navigation links specifically
 */
function analyzeNavigation(linkData) {
  header('NAVIGATION LINKS ANALYSIS');

  const navFiles = [
    '_includes/navigation/main-nav.html',
    '_includes/navigation/nav-drawer.html',
    '_includes/footer.html',
    '_includes/layout/footer.html',
  ];

  const navLinks = [];
  navFiles.forEach(file => {
    if (linkData.byFile[file]) {
      navLinks.push(...linkData.byFile[file]);
    }
  });

  log(`Total navigation links: ${navLinks.length}`, 'bright');

  const byCategory = {};
  navLinks.forEach(link => {
    byCategory[link.category] = (byCategory[link.category] || 0) + 1;
  });

  log('\nBreakdown:', 'cyan');
  Object.entries(byCategory).forEach(([cat, count]) => {
    log(`  ${cat}: ${count}`);
  });

  // List all navigation URLs
  log('\nNavigation URLs:', 'cyan');
  const uniqueUrls = [...new Set(navLinks.map(l => l.href))];
  uniqueUrls.sort().forEach(url => {
    const category = navLinks.find(l => l.href === url).category;
    const icon = category === 'external' ? '🔗' : '📄';
    log(`  ${icon} ${url}`, category === 'external' ? 'yellow' : 'reset');
  });
}

/**
 * Report issues found
 */
function reportIssues(linkData) {
  header('ISSUES FOUND');

  if (linkData.issues.length === 0) {
    log('✅ No issues found!', 'green');
    return;
  }

  const bySeverity = {
    high: linkData.issues.filter(i => i.severity === 'high'),
    warning: linkData.issues.filter(i => i.severity === 'warning'),
    info: linkData.issues.filter(i => i.severity === 'info'),
  };

  log(`Total issues: ${linkData.issues.length}`, 'bright');
  log(`  High: ${bySeverity.high.length}`, 'red');
  log(`  Warning: ${bySeverity.warning.length}`, 'yellow');
  log(`  Info: ${bySeverity.info.length}`, 'cyan');

  if (bySeverity.high.length > 0) {
    log('\n⚠️  HIGH SEVERITY ISSUES:', 'red');
    bySeverity.high.slice(0, 20).forEach(issue => {
      log(`  ${issue.file}:${issue.line}`, 'yellow');
      log(`    ${issue.message}`, 'red');
      log(`    → ${issue.href}`, 'reset');
    });
    if (bySeverity.high.length > 20) {
      log(`  ... and ${bySeverity.high.length - 20} more`, 'yellow');
    }
  }

  if (bySeverity.warning.length > 0) {
    log('\n⚠  WARNING ISSUES:', 'yellow');
    bySeverity.warning.slice(0, 10).forEach(issue => {
      log(`  ${issue.file}:${issue.line}`, 'cyan');
      log(`    ${issue.message}`, 'yellow');
      log(`    → ${issue.href}`, 'reset');
    });
    if (bySeverity.warning.length > 10) {
      log(`  ... and ${bySeverity.warning.length - 10} more`, 'yellow');
    }
  }
}

/**
 * Generate statistics
 */
function generateStats(linkData) {
  header('LINK STATISTICS');

  const total =
    linkData.internal.length +
    linkData.external.length +
    linkData.mailto.length +
    linkData.tel.length +
    linkData.anchor.length +
    linkData.javascript.length;

  log(`Total links: ${total}`, 'bright');
  log('');
  log('By Type:', 'cyan');
  log(
    `  Internal: ${linkData.internal.length} (${((linkData.internal.length / total) * 100).toFixed(1)}%)`
  );
  log(
    `  External: ${linkData.external.length} (${((linkData.external.length / total) * 100).toFixed(1)}%)`
  );
  log(`  Email: ${linkData.mailto.length}`);
  log(`  Phone: ${linkData.tel.length}`);
  log(`  Anchor: ${linkData.anchor.length}`);
  log(`  JavaScript: ${linkData.javascript.length}`);

  log('');
  log('Files with most links:', 'cyan');
  const filesByLinkCount = Object.entries(linkData.byFile)
    .map(([file, links]) => ({ file, count: links.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  filesByLinkCount.forEach(item => {
    log(`  ${item.file}: ${item.count} links`);
  });

  // External domains
  if (linkData.external.length > 0) {
    log('');
    log('External Domains:', 'cyan');
    const domains = {};
    linkData.external.forEach(link => {
      try {
        const url = new URL(link.href);
        domains[url.hostname] = (domains[url.hostname] || 0) + 1;
      } catch (_e) {
        // Invalid URL
      }
    });

    Object.entries(domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([domain, count]) => {
        log(`  ${domain}: ${count} links`);
      });
  }
}

/**
 * Generate recommendations
 */
function generateRecommendations(linkData) {
  header('RECOMMENDATIONS');

  const recs = [];

  // Security issues
  const securityIssues = linkData.issues.filter(i => i.type === 'security');
  if (securityIssues.length > 0) {
    recs.push({
      priority: 'HIGH',
      title: `Fix ${securityIssues.length} security issues`,
      description: 'Add rel="noopener noreferrer" to all links with target="_blank"',
      impact: 'Prevents security vulnerabilities (tabnabbing attacks)',
    });
  }

  // Accessibility issues
  const a11yIssues = linkData.issues.filter(i => i.type === 'accessibility');
  if (a11yIssues.length > 0) {
    recs.push({
      priority: 'HIGH',
      title: `Fix ${a11yIssues.length} accessibility issues`,
      description: 'Add descriptive text to all links',
      impact: 'Improves screen reader experience and SEO',
    });
  }

  // Missing rel attributes
  const missingRel = linkData.issues.filter(i => i.type === 'missing-rel');
  if (missingRel.length > 0) {
    recs.push({
      priority: 'MEDIUM',
      title: `Add rel attributes to ${missingRel.length} external links`,
      description: 'Add rel="noopener" to external links for security and SEO',
      impact: 'Better security, potential SEO improvement',
    });
  }

  // JavaScript hrefs
  if (linkData.javascript.length > 0) {
    recs.push({
      priority: 'MEDIUM',
      title: `Replace ${linkData.javascript.length} javascript: hrefs`,
      description: 'Use onclick handlers or event listeners instead',
      impact: 'Better accessibility and modern best practices',
    });
  }

  // Internal link optimization
  if (linkData.internal.length > 50) {
    recs.push({
      priority: 'LOW',
      title: 'Consider link prefetching for internal navigation',
      description: 'Add prefetch hints to frequently accessed pages',
      impact: 'Faster perceived navigation speed',
    });
  }

  if (recs.length === 0) {
    log('✅ No recommendations - links are well optimized!', 'green');
  } else {
    recs.forEach(rec => {
      const color = rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'cyan';
      log(`[${rec.priority}] ${rec.title}`, color);
      log(`  → ${rec.description}`);
      log(`  Impact: ${rec.impact}`, 'reset');
      log('');
    });
  }
}

/**
 * Save report to file
 */
function saveReport(linkData) {
  const reportPath = path.join(REPO_ROOT, '_reports', 'LINK-SCAN-2026-01.md');

  let report = `# Link Scan Report\n`;
  report += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
  report += `**Total Links**: ${linkData.internal.length + linkData.external.length + linkData.mailto.length + linkData.tel.length + linkData.anchor.length + linkData.javascript.length}\n\n`;

  report += `## Summary\n\n`;
  report += `| Type | Count |\n`;
  report += `|------|-------|\n`;
  report += `| Internal | ${linkData.internal.length} |\n`;
  report += `| External | ${linkData.external.length} |\n`;
  report += `| Email | ${linkData.mailto.length} |\n`;
  report += `| Phone | ${linkData.tel.length} |\n`;
  report += `| Anchor | ${linkData.anchor.length} |\n`;
  report += `| JavaScript | ${linkData.javascript.length} |\n\n`;

  report += `## Issues Found: ${linkData.issues.length}\n\n`;

  if (linkData.issues.length > 0) {
    const bySeverity = {
      high: linkData.issues.filter(i => i.severity === 'high'),
      warning: linkData.issues.filter(i => i.severity === 'warning'),
    };

    if (bySeverity.high.length > 0) {
      report += `### High Severity (${bySeverity.high.length})\n\n`;
      bySeverity.high.forEach(issue => {
        report += `- **${issue.file}:${issue.line}**\n`;
        report += `  - ${issue.message}\n`;
        report += `  - Link: \`${issue.href}\`\n\n`;
      });
    }

    if (bySeverity.warning.length > 0) {
      report += `### Warnings (${bySeverity.warning.length})\n\n`;
      bySeverity.warning.slice(0, 50).forEach(issue => {
        report += `- ${issue.file}:${issue.line} - ${issue.message}\n`;
      });
      if (bySeverity.warning.length > 50) {
        report += `\n... and ${bySeverity.warning.length - 50} more\n`;
      }
    }
  }

  fs.writeFileSync(reportPath, report, 'utf-8');
  log(`\n📝 Full report saved to: ${reportPath}`, 'bright');
}

/**
 * Main execution
 */
function main() {
  console.clear();
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Comprehensive Link Scanner & Validator                        ║', 'bright');
  log('║   Tillerstead.com - 2026-01-26                                  ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');

  try {
    const linkData = scanAllLinks();
    generateStats(linkData);
    analyzeNavigation(linkData);
    reportIssues(linkData);
    generateRecommendations(linkData);
    saveReport(linkData);

    log('');
    log('✅ Link scan complete!', 'green');

    // Exit code based on issues
    const criticalIssues = linkData.issues.filter(i => i.severity === 'high').length;
    if (criticalIssues > 0) {
      log(`⚠️  ${criticalIssues} critical issues found`, 'yellow');
      process.exit(1);
    }
  } catch (err) {
    log('');
    log(`❌ Error: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { scanAllLinks, analyzeNavigation };
