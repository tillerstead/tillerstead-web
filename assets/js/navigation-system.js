/**
 * Tillerstead Navigation System — v3.0.0
 *
 * Single-module navigation handling all:
 *  - Mobile drawer (smooth animations, focus trap, keyboard)
 *  - Desktop dropdowns (hover + keyboard + touch)
 *  - Mobile accordions
 *  - Scroll-aware header (hide/show, scrolled state)
 *  - Active page highlighting
 *  - Body scroll lock (mobile nav open)
 *  - Responsive breakpoint handling
 *  - Lenis smooth-scroll integration
 *
 * Replaces: unified-navigation.js, navigation.js, scroll-fix.js
 */

(function () {
  'use strict';

  // ─── Configuration ───────────────────────────────────────
  var CONFIG = {
    MOBILE_BREAKPOINT: 769,
    DROPDOWN_DELAY: 300,
    ANIMATION_DURATION: 300,
    SCROLL_THRESHOLD: 50,
  };

  // ─── State ───────────────────────────────────────────────
  var state = {
    navOpen: false,
    scrolled: false,
    activeDropdown: null,
    lastScrollY: 0,
  };

  // ─── DOM References ──────────────────────────────────────
  var el = {};

  function cacheDOM() {
    el.header = document.querySelector('.ts-header');
    el.toggle = document.querySelector('.ts-nav-toggle');
    el.drawer = document.querySelector('.ts-drawer');
    el.close = document.querySelector('.ts-drawer__close');
    el.overlay = document.querySelector('.ts-drawer__overlay');
  }

  // ─── Utilities ───────────────────────────────────────────
  function isMobile() {
    return window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
  }

  // ─── Mobile Navigation ──────────────────────────────────
  function setupMobileNav() {
    if (!el.toggle || !el.drawer) return;

    el.toggle.addEventListener('click', toggleMobileNav);
    if (el.close) el.close.addEventListener('click', closeMobileNav);

    // Close on overlay click
    if (el.overlay) {
      el.overlay.addEventListener('click', closeMobileNav);
    } else {
      el.drawer.addEventListener('click', function (e) {
        if (e.target === el.drawer) closeMobileNav();
      });
    }

    // Escape to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.navOpen) closeMobileNav();
    });

    // Close on link navigation
    var links = el.drawer.querySelectorAll('a:not([href^="#"])');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        setTimeout(closeMobileNav, 100);
      });
    });
  }

  function toggleMobileNav() {
    state.navOpen ? closeMobileNav() : openMobileNav();
  }

  function openMobileNav() {
    state.navOpen = true;

    el.drawer.setAttribute('aria-hidden', 'false');
    el.toggle.setAttribute('aria-expanded', 'true');
    el.toggle.setAttribute('aria-label', 'Close navigation menu');
    el.toggle.classList.add('is-active');

    // Body scroll lock
    document.body.classList.add('nav-open');
    document.body.style.overflow = 'hidden';

    // Pause Lenis if active
    if (window.__lenis) window.__lenis.stop();

    requestAnimationFrame(function () {
      el.drawer.classList.add('is-open');
    });

    // Focus trap
    setTimeout(function () {
      var first = el.drawer.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (first) first.focus();
      trapFocus();
    }, CONFIG.ANIMATION_DURATION);
  }

  function closeMobileNav() {
    if (!state.navOpen) return;
    state.navOpen = false;

    el.drawer.setAttribute('aria-hidden', 'true');
    el.toggle.setAttribute('aria-expanded', 'false');
    el.toggle.setAttribute('aria-label', 'Open navigation menu');
    el.toggle.classList.remove('is-active');
    el.drawer.classList.remove('is-open');

    // Release scroll lock
    document.body.classList.remove('nav-open');
    document.body.style.overflow = '';

    // Resume Lenis
    if (window.__lenis) window.__lenis.start();

    releaseFocusTrap();
    el.toggle.focus();
  }

  // ─── Focus Trap ──────────────────────────────────────────
  var _trapHandler = null;

  function trapFocus() {
    var focusable = Array.from(
      el.drawer.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (node) {
      return !node.disabled;
    });

    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    _trapHandler = function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.drawer.addEventListener('keydown', _trapHandler);
  }

  function releaseFocusTrap() {
    if (_trapHandler) {
      el.drawer.removeEventListener('keydown', _trapHandler);
      _trapHandler = null;
    }
  }

  // ─── Desktop Dropdowns ──────────────────────────────────
  function setupDesktopDropdowns() {
    var items = document.querySelectorAll('.ts-nav__item--dropdown');

    items.forEach(function (item) {
      var trigger = item.querySelector('.ts-nav__trigger');
      var menu = item.querySelector('.ts-nav__dropdown');
      if (!trigger || !menu) return;

      var hoverTimeout;

      item.addEventListener('mouseenter', function () {
        clearTimeout(hoverTimeout);
        openDropdown(trigger, menu);
      });

      item.addEventListener('mouseleave', function () {
        hoverTimeout = setTimeout(function () {
          closeDropdown(trigger, menu);
        }, CONFIG.DROPDOWN_DELAY);
      });

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';
        closeAllDropdowns();
        if (!isOpen) openDropdown(trigger, menu);
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          openDropdown(trigger, menu);
          var firstLink = menu.querySelector('a');
          if (firstLink) firstLink.focus();
        } else if (e.key === 'Escape') {
          closeDropdown(trigger, menu);
          trigger.focus();
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.ts-nav__item--dropdown')) closeAllDropdowns();
    });
  }

  function openDropdown(trigger, menu) {
    menu.style.cssText = '';
    trigger.setAttribute('aria-expanded', 'true');
    state.activeDropdown = { trigger: trigger, menu: menu };
  }

  function closeDropdown(trigger, menu) {
    trigger.setAttribute('aria-expanded', 'false');
    menu.style.cssText = '';
    state.activeDropdown = null;
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.ts-nav__trigger').forEach(function (trigger) {
      var item = trigger.closest('.ts-nav__item--dropdown');
      var menu = item ? item.querySelector('.ts-nav__dropdown') : null;
      if (menu) closeDropdown(trigger, menu);
    });
  }

  // ─── Mobile Accordions ──────────────────────────────────
  function setupMobileAccordions() {
    var triggers = document.querySelectorAll('.ts-drawer__accordion-trigger');

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        var submenu = trigger.nextElementSibling;
        if (!submenu) return;

        // Close others
        triggers.forEach(function (other) {
          if (other !== trigger) {
            other.setAttribute('aria-expanded', 'false');
            other.classList.remove('is-active');
            var otherMenu = other.nextElementSibling;
            if (otherMenu) {
              otherMenu.hidden = true;
              otherMenu.style.maxHeight = '0';
            }
          }
        });

        // Toggle current
        trigger.setAttribute('aria-expanded', String(!isExpanded));
        trigger.classList.toggle('is-active');
        submenu.hidden = isExpanded;
        submenu.style.maxHeight = isExpanded ? '0' : submenu.scrollHeight + 'px';
      });
    });
  }

  // ─── Scroll Behavior ────────────────────────────────────
  function setupScrollBehavior() {
    if (!el.header) return;

    var ticking = false;

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            var y = window.pageYOffset;
            var scrolled = y > CONFIG.SCROLL_THRESHOLD;

            // Scrolled state (shrink logo, shadow)
            if (scrolled !== state.scrolled) {
              state.scrolled = scrolled;
              el.header.classList.toggle('ts-header--scrolled', scrolled);
              el.header.classList.toggle('is-scrolled', scrolled);
            }

            // Hide on scroll down, show on scroll up
            if (y > state.lastScrollY && y > 200) {
              el.header.classList.add('header-hidden');
            } else if (y < state.lastScrollY) {
              el.header.classList.remove('header-hidden');
            }

            // Scroll progress bar
            var progressBar = document.querySelector('[data-scroll-progress]');
            if (progressBar) {
              var docHeight = document.documentElement.scrollHeight - window.innerHeight;
              var pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
              progressBar.style.width = pct + '%';
            }

            state.lastScrollY = y;
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  // ─── Active Page Highlighting ───────────────────────────
  function setupActiveLinks() {
    var currentPath = window.location.pathname;
    var links = document.querySelectorAll('.ts-nav__link[href], .ts-drawer__link[href]');

    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href !== '/' && currentPath.startsWith(href)) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      } else if (href === '/' && currentPath === '/') {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      }
    });
  }

  // ─── Logo Smooth Scroll ─────────────────────────────────
  function setupLogoScroll() {
    var logoLink = document.querySelector('.ts-header__logo-link');
    if (!logoLink || logoLink.getAttribute('href') !== '/') return;

    logoLink.addEventListener('click', function (e) {
      if (window.location.pathname === '/') {
        e.preventDefault();
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }

  // ─── Responsive Resize ──────────────────────────────────
  function setupResponsive() {
    var resizeTimer;

    window.addEventListener(
      'resize',
      function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          if (!isMobile()) closeMobileNav();
          closeAllDropdowns();
        }, 150);
      },
      { passive: true }
    );
  }

  // ─── Init ───────────────────────────────────────────────
  function init() {
    cacheDOM();
    if (!el.header) return;

    setupMobileNav();
    setupDesktopDropdowns();
    setupMobileAccordions();
    setupScrollBehavior();
    setupActiveLinks();
    setupLogoScroll();
    setupResponsive();
  }

  // ─── Public API ─────────────────────────────────────────
  window.TillersteadNav = {
    openMobile: function () {
      openMobileNav();
    },
    closeMobile: function () {
      closeMobileNav();
    },
    closeDropdowns: closeAllDropdowns,
    state: function () {
      return Object.assign({}, state);
    },
  };

  // ─── Boot ───────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
