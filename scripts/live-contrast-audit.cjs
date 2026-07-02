/**
 * Live Contrast Audit — Uses Playwright to check ACTUAL computed styles
 * on the rendered pages. Only reports failures where real text is unreadable
 * against its actual background.
 *
 * WCAG AA: 4.5:1 for normal text, 3.0:1 for large text (>=18px or >=14px bold)
 */

const { chromium } = require('playwright');

const BASE = process.env.PROD_URL || 'http://localhost:4173';

// Pages to audit — Jekyll uses directory-style URLs (about/index.html)
const PAGES = [
  '/',
  '/about/',
  '/services/',
  '/portfolio/',
  '/contact/',
  '/pricing/',
  '/reviews/',
  '/faq/',
  '/blog/',
  '/financing/',
  '/tools-hub/',
  '/process/',
  '/products/',
  '/homeowner-resources/',
  '/for-general-contractors/',
  '/build/',
  '/nj-tile-guide/',
  '/plans/',
];

function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(str) {
  if (!str || str === 'transparent') return null;
  // rgba(R, G, B, A) or rgb(R, G, B)
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    return {
      r: parseInt(m[1]),
      g: parseInt(m[2]),
      b: parseInt(m[3]),
      a: m[4] !== undefined ? parseFloat(m[4]) : 1,
    };
  }
  return null;
}

function blendOnBackground(fg, bg) {
  if (!fg || !bg) return fg;
  if (fg.a >= 1) return fg;
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1,
  };
}

function colorToHex(c) {
  if (!c) return '???';
  return '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const allFailures = [];
  const pageSummary = {};

  for (const path of PAGES) {
    const url = BASE + path;
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
      console.log(`SKIP ${path} — ${e.message.split('\n')[0]}`);
      await page.close();
      continue;
    }

    // Wait and scroll to trigger lazy elements and scroll-fade-in animations
    await page.waitForTimeout(500);
    // Force all scroll-fade-in elements to be visible
    await page.evaluate(() => {
      document.querySelectorAll('.scroll-fade-in, [data-animate]').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('is-visible');
      });
    });
    // Scroll to bottom to trigger any intersection observers
    await page.evaluate(async () => {
      const delay = (ms) => new Promise(r => setTimeout(r, ms));
      for (let y = 0; y < document.body.scrollHeight; y += 800) {
        window.scrollTo(0, y);
        await delay(50);
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);

    const results = await page.evaluate(() => {
      const seen = new Set();
      const failures = [];

      function parseRGBA(str) {
        if (!str || str === 'transparent') return null;
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) return null;
        return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
      }

      function compositeOver(fg, bg) {
        if (!fg || fg.a === 0) return bg;
        if (!bg) return fg;
        const a = fg.a + bg.a * (1 - fg.a);
        if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
        return {
          r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
          g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
          b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
          a,
        };
      }

      // Get all text-containing elements — include opacity>0 AND elements
      // that use scroll-fade-in (they might have opacity 0 before animation)
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            const tag = node.tagName.toLowerCase();
            if (['script', 'style', 'svg', 'path', 'noscript', 'link', 'meta', 'br', 'hr', 'img', 'video', 'audio', 'canvas', 'iframe', 'picture', 'source'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') {
              return NodeFilter.FILTER_REJECT;
            }
            // Allow opacity 0 elements if they have scroll-fade-in (animation pending)
            if (style.opacity === '0' && !node.classList.contains('scroll-fade-in') && !node.hasAttribute('data-animate')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const elements = [];
      let node;
      while ((node = walker.nextNode())) {
        elements.push(node);
      }

      for (const el of elements) {
        let hasText = false;
        for (const child of el.childNodes) {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
            hasText = true;
            break;
          }
        }
        if (!hasText) continue;

        const style = window.getComputedStyle(el);
        const color = style.color;
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight) || 400;
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
        const threshold = isLargeText ? 3.0 : 4.5;

        // COMPOSITE background: walk up ALL layers and blend them
        let compositeBg = null; // Start with nothing
        const bgStack = [];
        let bgEl = el;
        while (bgEl) {
          const bgStyle = window.getComputedStyle(bgEl);
          const bg = parseRGBA(bgStyle.backgroundColor);
          if (bg && bg.a > 0) {
            bgStack.push(bg);
          }
          // If we hit a fully opaque background, stop
          if (bg && bg.a >= 1) break;
          bgEl = bgEl.parentElement;
        }
        // Composite from bottom (root) to top
        bgStack.reverse();
        for (const bg of bgStack) {
          if (!compositeBg) {
            compositeBg = bg;
          } else {
            compositeBg = compositeOver(bg, compositeBg);
          }
        }
        // Default to black (our dark theme) if no bg found
        if (!compositeBg || compositeBg.a < 1) {
          const fallback = { r: 0, g: 0, b: 0, a: 1 };
          compositeBg = compositeBg ? compositeOver(compositeBg, fallback) : fallback;
        }

        const bgColorStr = `rgb(${compositeBg.r}, ${compositeBg.g}, ${compositeBg.b})`;

        // Create dedup key — dedup by color pair + first class
        const key = `${color}|${bgColorStr}|${el.tagName}|${el.className?.toString?.().split?.(' ')?.[0] || ''}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Get text sample
        let textSample = '';
        for (const child of el.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            textSample += child.textContent.trim() + ' ';
          }
        }
        textSample = textSample.trim().substring(0, 60);
        if (!textSample) continue;

        failures.push({
          tag: el.tagName.toLowerCase(),
          className: (el.className || '').toString().substring(0, 80),
          id: el.id || '',
          color,
          bgColor: bgColorStr,
          fontSize,
          fontWeight,
          isLargeText,
          threshold,
          textSample,
          selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + (el.className.toString().split(' ')[0]) : ''),
        });
      }

      return failures;
    });

    // Process results
    let pageFailCount = 0;
    for (const r of results) {
      const fg = parseColor(r.color);
      const bg = parseColor(r.bgColor);
      if (!fg || !bg) continue;

      const effective = blendOnBackground(fg, bg);
      const fgLum = relativeLuminance(effective.r, effective.g, effective.b);
      const bgLum = relativeLuminance(bg.r, bg.g, bg.b);
      const ratio = contrastRatio(fgLum, bgLum);

      if (ratio < r.threshold) {
        pageFailCount++;
        allFailures.push({
          page: path,
          ratio: ratio.toFixed(1),
          threshold: r.threshold,
          fgHex: colorToHex(effective),
          bgHex: colorToHex(bg),
          fgRaw: r.color,
          bgRaw: r.bgColor,
          fontSize: r.fontSize,
          fontWeight: r.fontWeight,
          isLargeText: r.isLargeText,
          selector: r.selector,
          className: r.className,
          text: r.textSample,
        });
      }
    }

    pageSummary[path] = { total: results.length, fails: pageFailCount };
    console.log(`${path}: ${results.length} elements, ${pageFailCount} failures`);

    await page.close();
  }

  await browser.close();

  // Sort by ratio ascending
  allFailures.sort((a, b) => parseFloat(a.ratio) - parseFloat(b.ratio));

  // Print report
  console.log('\n' + '='.repeat(80));
  console.log('LIVE CONTRAST AUDIT REPORT');
  console.log('='.repeat(80));
  console.log('\nPage Summary:');
  for (const [pg, s] of Object.entries(pageSummary)) {
    console.log(`  ${pg}: ${s.fails}/${s.total} fail`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`TOTAL FAILURES: ${allFailures.length}`);
  console.log('='.repeat(80));

  // Group by color pair for deduplication
  const byColorPair = {};
  for (const f of allFailures) {
    const key = `${f.fgHex}/${f.bgHex}`;
    if (!byColorPair[key]) {
      byColorPair[key] = { ...f, pages: [f.page], count: 1 };
    } else {
      byColorPair[key].count++;
      if (!byColorPair[key].pages.includes(f.page)) {
        byColorPair[key].pages.push(f.page);
      }
    }
  }

  // Sort by worst ratio
  const pairs = Object.values(byColorPair).sort((a, b) => parseFloat(a.ratio) - parseFloat(b.ratio));

  console.log(`\nUnique failing color pairs: ${pairs.length}\n`);

  for (const p of pairs) {
    const level = parseFloat(p.ratio) < 3.0 ? 'FAIL' : 'WARN';
    console.log(`  ${level} ${p.ratio}:1  fg=${p.fgHex}  bg=${p.bgHex}  (need ${p.threshold}:1)`);
    console.log(`    Raw: color=${p.fgRaw}  bg=${p.bgRaw}`);
    console.log(`    ${p.fontSize}px / weight ${p.fontWeight} / ${p.isLargeText ? 'LARGE' : 'normal'} text`);
    console.log(`    Selector: ${p.selector}  class="${p.className}"`);
    console.log(`    Text: "${p.text}"`);
    console.log(`    Pages (${p.count}x): ${p.pages.join(', ')}`);
    console.log();
  }

  // Print CSV-style for easy consumption
  console.log('\n' + '='.repeat(80));
  console.log('FIX LIST (sorted by severity):');
  console.log('='.repeat(80));
  for (const p of pairs) {
    console.log(`${p.ratio}:1 | ${p.fgHex} on ${p.bgHex} | ${p.selector} | "${p.text.substring(0, 40)}" | ${p.pages[0]}`);
  }
})();
