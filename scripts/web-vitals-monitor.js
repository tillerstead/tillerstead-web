/**
 * Web Vitals Monitoring Script
 * Generates performance monitoring code for Core Web Vitals
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'js', 'web-vitals-tracker.js');

const webVitalsCode = `/**
 * Web Vitals Tracker
 * Monitors Core Web Vitals (LCP, FID, CLS) and reports to analytics
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

// Send vitals to analytics endpoint
function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Send to Google Analytics if available
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Log to console in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(\`📊 \${metric.name}:\`, {
      value: \`\${Math.round(metric.value)}ms\`,
      rating: metric.rating,
      delta: \`\${Math.round(metric.delta)}ms\`,
    });
  }

  // Send to custom analytics endpoint (optional)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/web-vitals', body);
  }
}

// Monitor all Core Web Vitals
onCLS(sendToAnalytics);  // Cumulative Layout Shift
onFID(sendToAnalytics);  // First Input Delay
onLCP(sendToAnalytics);  // Largest Contentful Paint
onFCP(sendToAnalytics);  // First Contentful Paint
onTTFB(sendToAnalytics); // Time to First Byte

// Performance observer for additional metrics
if ('PerformanceObserver' in window) {
  // Monitor long tasks (blocking the main thread)
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('⚠️ Long task detected:', {
            duration: \`\${Math.round(entry.duration)}ms\`,
            startTime: \`\${Math.round(entry.startTime)}ms\`,
          });
        }
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long task API not supported
  }

  // Monitor resource timing
  try {
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) {
          console.warn('⚠️ Slow resource:', {
            name: entry.name,
            duration: \`\${Math.round(entry.duration)}ms\`,
            type: entry.initiatorType,
          });
        }
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
  } catch (e) {
    // Resource timing API not supported
  }
}

// Export for manual tracking
export { sendToAnalytics };
`;

async function main() {
  console.log('📊 Generating Web Vitals monitoring code...\n');

  try {
    await fs.writeFile(OUTPUT_FILE, webVitalsCode, 'utf8');
    console.log(`✓ Created ${path.relative(process.cwd(), OUTPUT_FILE)}`);
    console.log('\n✨ Web Vitals monitoring code generated!');
    console.log('\n📝 Add this to your site:');
    console.log('   <script type="module" src="/assets/js/web-vitals-tracker.js"></script>');
  } catch (error) {
    console.error('❌ Error generating Web Vitals code:', error);
    process.exit(1);
  }
}

main();
