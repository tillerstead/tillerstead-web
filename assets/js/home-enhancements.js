/**
 * Homepage Enhancements - Scroll Animations & Sticky CTA
 *
 * Features:
 * - Scroll-triggered animations (fade-in, scale-in)
 * - Sticky mobile CTA that appears on scroll
 * - Performance optimized with IntersectionObserver
 * - Respects prefers-reduced-motion
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    scrollThreshold: 0.15, // 15% of element visible triggers animation
    stickyCtaShowAt: 800, // Show sticky CTA after 800px scroll
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  /**
   * Initialize scroll-triggered animations
   */
  function initScrollAnimations() {
    if (CONFIG.reducedMotion) {
      // Skip animations if user prefers reduced motion
      document.querySelectorAll('.scroll-fade-in, .scroll-scale-in').forEach(el => {
        el.classList.add('animated');
      });
      return;
    }

    // Use IntersectionObserver for performance
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: CONFIG.scrollThreshold,
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          // Optionally unobserve after animation to save resources
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.scroll-fade-in, .scroll-scale-in').forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Create and manage sticky mobile CTA
   */
  function initStickyCTA() {
    // Only on mobile/tablet
    if (window.innerWidth >= 1024) return;

    // Create sticky CTA element
    const stickyCTA = document.createElement('div');
    stickyCTA.className = 'mobile-sticky-cta';
    stickyCTA.setAttribute('role', 'complementary');
    stickyCTA.setAttribute('aria-label', 'Quick contact actions');

    stickyCTA.innerHTML = `
      <div class="cta-content">
        <a href="/contact/" class="btn btn--primary btn--pulse">
          Request Estimate
        </a>
        <a href="tel:+16098628808" class="btn btn--ghost">
          Call Now
        </a>
      </div>
    `;

    document.body.appendChild(stickyCTA);

    // Show/hide based on scroll position
    let isVisible = false;
    let ticking = false;

    function updateStickyState() {
      const shouldShow = window.scrollY > CONFIG.stickyCtaShowAt;

      if (shouldShow !== isVisible) {
        isVisible = shouldShow;
        stickyCTA.classList.toggle('visible', isVisible);
      }

      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(updateStickyState);
        ticking = true;
      }
    }

    window.addEventListener('scroll', requestTick, { passive: true });

    // Hide when user reaches footer (already at CTA section)
    const footer = document.querySelector('footer');
    if (footer) {
      const footerObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              stickyCTA.classList.remove('visible');
            } else if (window.scrollY > CONFIG.stickyCtaShowAt) {
              stickyCTA.classList.add('visible');
            }
          });
        },
        { threshold: 0.1 }
      );

      footerObserver.observe(footer);
    }

    // Re-check on window resize (orientation change)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth >= 1024 && stickyCTA.parentNode) {
          stickyCTA.remove();
        }
      }, 250);
    });
  }

  /**
   * Enhanced card hover effects with parallax
   */
  function initCardParallax() {
    if (CONFIG.reducedMotion) return;
    if (window.innerWidth < 768) return; // Skip on small mobile

    const cards = document.querySelectorAll('.service-card, .material-card, .testimonial-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20; // Subtle tilt
        const rotateY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // initSectionTransitions() removed: it applied inline opacity:0 to ALL sections,
  // which overrode the CSS-class .scroll-fade-in.animated (inline > class specificity),
  // causing sections to remain stuck invisible. Scroll animations are handled entirely
  // by initScrollAnimations() via CSS class toggling (.scroll-fade-in → .animated).

  /**
   * Initialize all enhancements
   */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Only run on homepage
    if (!document.body.classList.contains('page-home')) return;

    // Initialize features
    initScrollAnimations();
    initStickyCTA();
    initCardParallax();
    // initSectionTransitions() removed — conflicted with CSS animation classes

    // Expose API for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.homeEnhancements = {
        config: CONFIG,
        reinitScrollAnimations: initScrollAnimations,
        reinitStickyCTA: initStickyCTA,
      };
    }
  }

  // Start initialization
  init();
})();
