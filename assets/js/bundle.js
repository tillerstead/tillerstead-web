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

    var lenis = new Lenis({
      duration: 1.1,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
      autoResize: true,
    });

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
    initLenis();
    initAOS();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

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

(function () {
  'use strict';

  // ─── Lazy Loading (native) ───
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.dataset.src) img.src = img.dataset.src;
    });
  }

  // ─── Scroll animations for .animate-on-scroll (fallback if AOS not loaded) ───
  if (typeof AOS === 'undefined') {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
      observer.observe(el);
    });
  }

  // Header scroll & navigation handled by navigation-system.js
})();

/**
 * UX Enhancements JavaScript
 * Handles: Form feedback, back-to-top, loading states, error visibility
 */

(function () {
  'use strict';

  const UXEnhancements = {
    /**
     * Initialize all UX enhancements
     */
    init() {
      this.initBackToTop();
      this.initFormEnhancements();
      this.initLoadingStates();
      this.initToastSystem();
      this.initErrorVisibility();
      this.initA11yEnhancements();
    },

    /**
     * Back to Top Button
     */
    initBackToTop() {
      // Create button
      const btn = document.createElement('button');
      btn.className = 'back-to-top';
      btn.setAttribute('aria-label', 'Back to top');
      btn.setAttribute('title', 'Back to top');
      btn.type = 'button';

      document.body.appendChild(btn);

      // Show/hide based on scroll
      let scrollTimeout;
      window.addEventListener(
        'scroll',
        () => {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            if (window.pageYOffset > 400) {
              btn.classList.add('visible');
            } else {
              btn.classList.remove('visible');
            }
          }, 100);
        },
        { passive: true }
      );

      // Scroll to top on click
      btn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });

        // Focus skip link after scrolling
        setTimeout(() => {
          const skipLink = document.querySelector('.skip-link');
          if (skipLink) skipLink.focus();
        }, 500);
      });
    },

    /**
     * Form Enhancement - Loading states and success feedback
     */
    initFormEnhancements() {
      const forms = document.querySelectorAll('form[action]');

      forms.forEach(form => {
        form.addEventListener('submit', _e => {
          // Skip if form is invalid
          if (!form.checkValidity()) {
            this.showFormErrors(form);
            return;
          }

          // Add loading state
          form.classList.add('form--loading');

          const submitBtn = form.querySelector('[type="submit"]');
          if (submitBtn) {
            submitBtn.classList.add('btn--loading');
            submitBtn.setAttribute('aria-busy', 'true');
            submitBtn.disabled = true;
          }

          // Show success toast after redirect
          sessionStorage.setItem('form-submitted', 'true');
        });

        // Real-time validation on blur
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          input.addEventListener('blur', () => {
            this.validateField(input);
          });

          // Clear error on input
          input.addEventListener('input', () => {
            input.classList.remove('error');
            const errorMsg = input.parentElement.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
          });
        });
      });

      // Check for success message on load
      if (sessionStorage.getItem('form-submitted') === 'true') {
        sessionStorage.removeItem('form-submitted');
        this.showSuccessToast("Thank you! We'll get back to you soon.");
      }
    },

    /**
     * Validate individual field
     */
    validateField(field) {
      const isValid = field.checkValidity();

      if (!isValid) {
        field.classList.add('error');

        // Remove existing error message
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) existingError.remove();

        // Add error message
        const errorMsg = document.createElement('span');
        errorMsg.className = 'error-message';
        errorMsg.textContent = field.validationMessage || 'This field is required';
        errorMsg.id = `${field.id || field.name}-error`;

        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', errorMsg.id);

        field.parentElement.appendChild(errorMsg);
      } else {
        field.classList.remove('error');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
      }

      return isValid;
    },

    /**
     * Show form errors summary
     */
    showFormErrors(form) {
      const invalidFields = form.querySelectorAll(':invalid');

      // Validate all invalid fields
      invalidFields.forEach(field => this.validateField(field));

      // Create or update error summary
      let errorSummary = form.querySelector('.error-summary');
      if (!errorSummary) {
        errorSummary = document.createElement('div');
        errorSummary.className = 'error-summary';
        errorSummary.setAttribute('role', 'alert');
        errorSummary.setAttribute('aria-live', 'assertive');
        form.insertBefore(errorSummary, form.firstChild);
      }

      errorSummary.innerHTML = `
        <strong class="error-summary__title">Please fix the following errors:</strong>
        <ul class="error-list">
          ${Array.from(invalidFields)
            .map(field => {
              const label = form.querySelector(`label[for="${field.id}"]`);
              const fieldName = label ? label.textContent : field.name;
              return `<li><a href="#${field.id}">${fieldName}: ${field.validationMessage}</a></li>`;
            })
            .join('')}
        </ul>
      `;

      errorSummary.classList.add('visible');
      errorSummary.removeAttribute('hidden');
      errorSummary.setAttribute('aria-hidden', 'false');

      // Focus first invalid field
      if (invalidFields.length > 0) {
        invalidFields[0].focus();
      }
    },

    /**
     * Loading states for async operations
     */
    initLoadingStates() {
      // Add loading state to buttons with data-loading attribute
      const loadingButtons = document.querySelectorAll('[data-loading]');

      loadingButtons.forEach(btn => {
        btn.addEventListener('click', function () {
          this.classList.add('btn--loading');
          this.setAttribute('aria-busy', 'true');
          this.disabled = true;

          // Auto-remove after 5 seconds (safety)
          setTimeout(() => {
            this.classList.remove('btn--loading');
            this.setAttribute('aria-busy', 'false');
            this.disabled = false;
          }, 5000);
        });
      });
    },

    /**
     * Toast notification system
     */
    initToastSystem() {
      // Create toast container if it doesn't exist
      if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        container.style.cssText = `
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 400px;
        `;
        document.body.appendChild(container);
      }
    },

    /**
     * Show success toast
     */
    showSuccessToast(message, duration = 5000) {
      const container = document.getElementById('toast-container');

      const toast = document.createElement('div');
      toast.className = 'toast--success';
      toast.setAttribute('role', 'status');
      toast.textContent = message;

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close notification');
      closeBtn.style.cssText = `
        background: none;
        border: none;
        color: inherit;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
        line-height: 1;
      `;
      closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      });

      toast.appendChild(closeBtn);
      container.appendChild(toast);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => toast.remove(), 300);
        }, duration);
      }

      return toast;
    },

    /**
     * Show error toast
     */
    showErrorToast(message, duration = 7000) {
      const container = document.getElementById('toast-container');

      const toast = document.createElement('div');
      toast.className = 'toast--success'; // Reuse styles
      toast.setAttribute('role', 'alert');
      toast.style.cssText = `
        background: #FEF2F2;
        border-color: #DC2626;
        color: #991B1B;
      `;
      toast.textContent = message;

      container.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => toast.remove(), duration);
      }

      return toast;
    },

    /**
     * Enhanced error visibility
     */
    initErrorVisibility() {
      // Check URL for error/success parameters
      const params = new URLSearchParams(window.location.search);
      if (params.get('error')) {
        this.showErrorToast('There was a problem submitting your form. Please try again.');
      }
      if (params.get('success')) {
        this.showSuccessToast('Thank you! Your message has been sent successfully.');
      }
    },

    /**
     * Accessibility enhancements
     */
    initA11yEnhancements() {
      // Add skip to main content functionality
      const skipLink = document.querySelector('.skip-link');
      if (skipLink) {
        skipLink.addEventListener('click', e => {
          e.preventDefault();
          const mainContent =
            document.getElementById('main-content') || document.querySelector('main');
          if (mainContent) {
            mainContent.setAttribute('tabindex', '-1');
            mainContent.focus();
            setTimeout(() => mainContent.removeAttribute('tabindex'), 1000);
          }
        });
      }

      // Announce page title to screen readers on route change (for SPAs)
      const pageTitle = document.querySelector('h1');
      if (pageTitle) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = `Page loaded: ${pageTitle.textContent}`;
        document.body.appendChild(announcement);

        setTimeout(() => announcement.remove(), 2000);
      }

      // Enhance focus management for modals/dialogs
      this.trapFocusInModals();
    },

    /**
     * Trap focus in modals
     */
    trapFocusInModals() {
      const modals = document.querySelectorAll('[role="dialog"], .modal, .lead-magnet');

      modals.forEach(modal => {
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.attributeName === 'aria-hidden') {
              const isHidden = modal.getAttribute('aria-hidden') === 'true';

              if (!isHidden) {
                // Modal opened - trap focus
                const focusableElements = modal.querySelectorAll(
                  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (focusableElements.length > 0) {
                  focusableElements[0].focus();
                }
              }
            }
          });
        });

        observer.observe(modal, { attributes: true });
      });
    },
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UXEnhancements.init());
  } else {
    UXEnhancements.init();
  }

  // Expose global API
  window.tsUXEnhancements = UXEnhancements;
})();
