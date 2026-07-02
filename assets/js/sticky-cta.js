/**
 * Sticky CTA Bar JavaScript
 * Manages visibility and user interactions
 * Version: 1.0.0
 */

(function () {
  'use strict';

  const StickyCTA = {
    config: {
      scrollThreshold: 500, // Show after scrolling 500px
      hideOnPages: [], // Pages where CTA should never show
      cookieName: 'ts_sticky_cta_dismissed',
      cookieDays: 7, // Remember dismissal for 7 days
    },

    elements: {
      cta: null,
      closeBtn: null,
    },

    state: {
      isVisible: false,
      isDismissed: false,
      scrollY: 0,
    },

    /**
     * Initialize sticky CTA
     */
    init: function () {
      this.elements.cta = document.querySelector('.sticky-cta');

      if (!this.elements.cta) {
        return; // CTA not on this page
      }

      this.elements.closeBtn = this.elements.cta.querySelector('.sticky-cta__close');

      // Check if user previously dismissed
      this.state.isDismissed = this.getCookie(this.config.cookieName) === 'true';

      if (this.state.isDismissed) {
        this.elements.cta.remove();
        return;
      }

      // Attach event listeners
      this.attachEvents();

      // Initial check
      this.checkScroll();
    },

    /**
     * Attach event listeners
     */
    attachEvents: function () {
      // Scroll listener with throttle
      let ticking = false;
      window.addEventListener(
        'scroll',
        () => {
          this.state.scrollY = window.scrollY;

          if (!ticking) {
            window.requestAnimationFrame(() => {
              this.checkScroll();
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true }
      );

      // Close button
      if (this.elements.closeBtn) {
        this.elements.closeBtn.addEventListener('click', () => {
          this.dismiss();
        });
      }

      // Track button clicks
      const buttons = this.elements.cta.querySelectorAll('.sticky-cta__btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.trackClick(btn.textContent.trim());
        });
      });
    },

    /**
     * Check scroll position and show/hide CTA
     */
    checkScroll: function () {
      const shouldShow = this.state.scrollY >= this.config.scrollThreshold;

      // Check if we're near footer (hide CTA)
      const footer = document.querySelector('footer');
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      const isNearFooter = footerRect ? footerRect.top < window.innerHeight + 100 : false;

      if (shouldShow && !isNearFooter && !this.state.isVisible) {
        this.show();
      } else if ((!shouldShow || isNearFooter) && this.state.isVisible) {
        this.hide();
      }
    },

    /**
     * Show CTA
     */
    show: function () {
      this.elements.cta.classList.add('visible');
      this.elements.cta.classList.remove('hidden');
      this.state.isVisible = true;

      // Announce to screen readers
      this.elements.cta.setAttribute('aria-hidden', 'false');

      this.trackEvent('Sticky CTA Shown');
    },

    /**
     * Hide CTA (temporarily)
     */
    hide: function () {
      this.elements.cta.classList.remove('visible');
      this.elements.cta.classList.add('hidden');
      this.state.isVisible = false;

      this.elements.cta.setAttribute('aria-hidden', 'true');
    },

    /**
     * Dismiss CTA (permanently for session/cookie duration)
     */
    dismiss: function () {
      this.hide();
      this.state.isDismissed = true;

      // Set cookie
      this.setCookie(this.config.cookieName, 'true', this.config.cookieDays);

      // Remove from DOM after animation
      setTimeout(() => {
        this.elements.cta.remove();
      }, 300);

      this.trackEvent('Sticky CTA Dismissed');
    },

    /**
     * Track events
     */
    trackEvent: function (action, label = '') {
      if (typeof gtag !== 'undefined') {
        gtag('event', action, {
          event_category: 'Sticky CTA',
          event_label: label,
        });
      }

      if (typeof ga !== 'undefined') {
        ga('send', 'event', 'Sticky CTA', action, label);
      }
    },

    /**
     * Track button clicks
     */
    trackClick: function (buttonText) {
      this.trackEvent('CTA Click', buttonText);
    },

    /**
     * Set cookie
     */
    setCookie: function (name, value, days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    },

    /**
     * Get cookie
     */
    getCookie: function (name) {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    },
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      StickyCTA.init();
    });
  } else {
    StickyCTA.init();
  }

  // Expose globally
  window.tsStickyCTA = StickyCTA;
})();
