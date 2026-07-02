/**
 * Lead Magnet Popup System
 * Manages popup lead magnets (downloads, quizzes)
 * Version: 1.0.0
 */

(function () {
  'use strict';

  const LeadMagnet = {
    config: {
      showDelay: 30000, // Show after 30 seconds
      exitIntentEnabled: true,
      scrollTriggerPercent: 50, // Show after scrolling 50% of page
      cookieName: 'ts_lead_magnet_shown',
      cookieDays: 30, // Don't show again for 30 days
      subscribeEndpoint: '/api/subscribe',
    },

    elements: {
      popup: null,
      overlay: null,
      closeBtn: null,
      form: null,
    },

    state: {
      shown: false,
      submitted: false,
      triggered: false,
      initialized: false,
    },

    /**
     * Initialize lead magnet system
     */
    init: function () {
      // Prevent double initialization
      if (this.state.initialized) {
        console.log('[Lead Magnet] Already initialized, skipping');
        return;
      }

      this.elements.popup = document.querySelector('.lead-magnet-popup');

      if (!this.elements.popup) {
        return; // No lead magnet on this page
      }

      // Check if already shown
      if (this.getCookie(this.config.cookieName) === 'true') {
        this.elements.popup.remove();
        return;
      }

      this.elements.overlay = this.elements.popup.querySelector('.lead-magnet-popup__overlay');
      this.elements.closeBtn = this.elements.popup.querySelector('.lead-magnet-popup__close');
      this.elements.form = this.elements.popup.querySelector('.lead-magnet-popup__form');

      // Get config from data attributes
      const showDelay = this.elements.popup.dataset.showDelay;
      if (showDelay) {
        this.config.showDelay = parseInt(showDelay) * 1000;
      }

      this.attachEvents();
      this.startTriggers();

      // Mark as initialized
      this.state.initialized = true;
      console.log('[Lead Magnet] Initialized successfully');
    },

    /**
     * Attach event listeners
     */
    attachEvents: function () {
      // Close button
      if (this.elements.closeBtn) {
        this.elements.closeBtn.addEventListener('click', () => {
          this.close();
        });
      }

      // Overlay click
      if (this.elements.overlay) {
        this.elements.overlay.addEventListener('click', () => {
          this.close();
        });
      }

      // ESC key
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.state.shown) {
          this.close();
        }
      });

      // Form submission
      if (this.elements.form) {
        this.elements.form.addEventListener('submit', e => {
          this.handleSubmit(e);
        });
      }
    },

    /**
     * Start all triggers
     */
    startTriggers: function () {
      // Time trigger
      setTimeout(() => {
        if (!this.state.triggered) {
          this.show('time');
        }
      }, this.config.showDelay);

      // Scroll trigger
      this.setupScrollTrigger();

      // Exit intent trigger
      if (this.config.exitIntentEnabled) {
        this.setupExitIntent();
      }
    },

    /**
     * Setup scroll trigger
     */
    setupScrollTrigger: function () {
      let ticking = false;
      window.addEventListener(
        'scroll',
        () => {
          if (!ticking && !this.state.triggered) {
            window.requestAnimationFrame(() => {
              const scrollPercent =
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) *
                100;

              if (scrollPercent >= this.config.scrollTriggerPercent) {
                this.show('scroll');
              }

              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true }
      );
    },

    /**
     * Setup exit intent trigger
     */
    setupExitIntent: function () {
      document.addEventListener('mouseleave', e => {
        if (e.clientY < 10 && !this.state.triggered && !this.isMobile()) {
          this.show('exit-intent');
        }
      });
    },

    /**
     * Show popup
     */
    show: function (trigger = 'manual') {
      if (this.state.shown || this.state.triggered) {
        return;
      }

      this.elements.popup.classList.add('active');
      this.state.shown = true;
      this.state.triggered = true;

      // MOBILE FIX: Never lock scroll - modal is non-blocking overlay design
      // No scroll locking needed - popup doesn't require full-screen takeover

      // Focus first input
      const firstInput = this.elements.form?.querySelector(
        'input[type="email"], input[type="text"]'
      );
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }

      // Announce to screen readers
      this.elements.popup.setAttribute('aria-hidden', 'false');

      this.trackEvent('Popup Shown', trigger);
    },

    /**
     * Close popup
     */
    close: function () {
      this.elements.popup.classList.remove('active');
      this.state.shown = false;

      // No scroll unlocking needed - we don't lock scroll anymore

      this.elements.popup.setAttribute('aria-hidden', 'true');

      // Set cookie
      this.setCookie(this.config.cookieName, 'true', this.config.cookieDays);

      this.trackEvent('Popup Closed', this.state.submitted ? 'after-submit' : 'manual');
    },

    /**
     * Handle form submission
     */
    handleSubmit: function (e) {
      e.preventDefault();

      const formData = new FormData(this.elements.form);
      const email = formData.get('email');
      const name = formData.get('name') || '';

      if (!email) {
        return;
      }

      // Show loading state
      const submitBtn = this.elements.form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      // Get download URL or quiz URL
      const downloadUrl = this.elements.popup.dataset.downloadUrl;
      const redirectUrl = this.elements.popup.dataset.redirectUrl;

      const endpoint = this.elements.form.getAttribute('action') || this.config.subscribeEndpoint;
      const payload = Object.fromEntries(formData.entries());

      fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
        .then(response => {
          if (response.ok) {
            this.handleSuccess(email, name, downloadUrl, redirectUrl);
            return;
          }

          if (response.status >= 500 || response.status === 429) {
            const queue = JSON.parse(localStorage.getItem('tillerstead-lead-magnet-queue-v1') || '[]');
            queue.push({ payload, queuedAt: new Date().toISOString() });
            localStorage.setItem('tillerstead-lead-magnet-queue-v1', JSON.stringify(queue.slice(-20)));
          }

          this.handleError(
            'We could not confirm delivery yet. Your request has been saved for retry in this browser.'
          );
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        })
        .catch(() => {
          const queue = JSON.parse(localStorage.getItem('tillerstead-lead-magnet-queue-v1') || '[]');
          queue.push({ payload, queuedAt: new Date().toISOString() });
          localStorage.setItem('tillerstead-lead-magnet-queue-v1', JSON.stringify(queue.slice(-20)));

          this.handleError(
            'We could not confirm delivery yet. Your request has been saved for retry in this browser.'
          );
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    },

    /**
     * Handle successful submission
     */
    handleSuccess: function (email, name, downloadUrl, redirectUrl) {
      this.state.submitted = true;

      // Show success message
      const contentEl = this.elements.popup.querySelector('.lead-magnet-popup__content');
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="lead-magnet-popup__success">
            <svg class="lead-magnet-popup__success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3>Success!</h3>
            <p>Check your email for your download link.</p>
            ${downloadUrl ? `<p>Or <a href="${downloadUrl}" download class="btn btn--primary">Download Now</a></p>` : ''}
          </div>
        `;
      }

      this.trackEvent('Form Submitted', email);

      // Auto-close and redirect
      setTimeout(() => {
        this.close();

        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (downloadUrl) {
          // Trigger download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = '';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, 2000);
    },

    /**
     * Handle submission error
     */
    handleError: function (message) {
      const contentEl = this.elements.popup.querySelector('.lead-magnet-popup__content');
      if (contentEl) {
        contentEl.insertAdjacentHTML(
          'beforeend',
          `<p class="lead-magnet-popup__error" role="status" aria-live="polite">${message}</p>`
        );
      }
      this.trackEvent('Form Error', message || 'delivery-not-confirmed');
    },

    /**
     * Check if mobile
     */
    isMobile: function () {
      return window.innerWidth < 768;
    },

    /**
     * Track events
     */
    trackEvent: function (action, label) {
      if (typeof gtag !== 'undefined') {
        gtag('event', action, {
          event_category: 'Lead Magnet',
          event_label: label,
        });
      }

      if (typeof ga !== 'undefined') {
        ga('send', 'event', 'Lead Magnet', action, label);
      }
    },

    /**
     * Cookie helpers
     */
    setCookie: function (name, value, days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    },

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
      LeadMagnet.init();
    });
  } else {
    LeadMagnet.init();
  }

  // Expose globally
  window.tsLeadMagnet = LeadMagnet;
})();
