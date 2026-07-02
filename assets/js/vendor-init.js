/**
 * Vendor Library Initialization
 * Initializes: Lenis (smooth scroll), AOS (scroll animations)
 * Loaded after CDN scripts in scripts.html
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Lenis: Smooth Scroll Engine ───
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    if (reducedMotion) return; // respect user preference

    // Detect nested scroll containers (tools-hub uses .app-content)
    var lenisOptions = {
      duration: 0.9,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      smoothTouch: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      infinite: false,
      autoResize: true,
    };

    // Pages with nested scroll containers (layout: null pages with overflow-y panels)
    if (document.body.classList.contains('tools-hub-page')) {
      var appContent = document.getElementById('app-content');
      if (appContent) {
        lenisOptions.wrapper = appContent;
        lenisOptions.content = appContent;
      }
    }

    var lenis = new Lenis(lenisOptions);

    // Pause Lenis when mobile nav is open (scroll-fix.js compat)
    var observer = new MutationObserver(function () {
      if (document.body.classList.contains('nav-open')) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Connect to rAF loop
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Expose for other scripts
    window.__lenis = lenis;

    // Wire anchor links for smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80 });
        }
      });
    });
  }

  // ─── AOS: Animate On Scroll ───
  function initAOS() {
    if (typeof AOS === 'undefined') return;

    AOS.init({
      duration: reducedMotion ? 0 : 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      delay: 0,
      anchorPlacement: 'top-bottom',
      disable: reducedMotion,
    });

    // Refresh AOS after dynamic content loads
    if (window.__lenis) {
      window.__lenis.on(
        'scroll',
        debounce(function () {
          AOS.refresh();
        }, 200)
      );
    }
  }

  // ─── Upgrade existing scroll-fade-in elements to AOS ───
  function upgradeScrollAnimations() {
    if (typeof AOS === 'undefined') return;

    var mapping = {
      'scroll-fade-in': 'fade-up',
      'scroll-scale-in': 'zoom-in',
      'scroll-slide-left': 'fade-right',
      'scroll-slide-right': 'fade-left',
      'animate-on-scroll': 'fade-up',
    };

    Object.keys(mapping).forEach(function (cls) {
      document.querySelectorAll('.' + cls + ':not([data-aos])').forEach(function (el) {
        el.setAttribute('data-aos', mapping[cls]);
      });
    });
  }

  // ─── data-animate / is-visible scroll-reveal (Evident pattern) ───
  function initScrollReveal() {
    if (reducedMotion) return;
    var elements = document.querySelectorAll('[data-animate]');
    if (!elements.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ─── Utility ───
  function debounce(fn, wait) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  // ─── Boot ───
  function boot() {
    upgradeScrollAnimations();
    initScrollReveal();
    initLenis();
    initAOS();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
