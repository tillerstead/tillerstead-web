/**
 * Mobile Web App Enhancer
 * Optimizes touch interactions and mobile UX
 */

(function () {
  'use strict';

  // Detect mobile
  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 1080;

  if (!isMobile) return;

  console.log('📱 Mobile enhancer active');

  // ========================================
  // FAST CLICK (remove 300ms delay)
  // ========================================

  document.addEventListener('touchstart', function () {}, { passive: true });

  // ========================================
  // PREVENT ZOOM ON DOUBLE TAP
  // ========================================

  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    function (e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // ========================================
  // FIX iOS BOUNCE (only on body, not scrollable areas)
  // ========================================

  let startY = 0;
  document.body.addEventListener(
    'touchstart',
    function (e) {
      startY = e.touches[0].pageY;
    },
    { passive: true }
  );

  document.body.addEventListener(
    'touchmove',
    function (e) {
      const y = e.touches[0].pageY;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // At top and scrolling up
      if (scrollTop <= 0 && y > startY) {
        e.preventDefault();
      }
      // At bottom and scrolling down
      else if (scrollTop + clientHeight >= scrollHeight && y < startY) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // ========================================
  // VIEWPORT HEIGHT FIX (address bar)
  // ========================================

  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);

  // ========================================
  // TOUCH RIPPLE EFFECT
  // ========================================

  document.addEventListener(
    'touchstart',
    function (e) {
      const target = e.target.closest('a, button, [role="button"]');
      if (!target) return;

      target.style.transform = 'scale(0.98)';
      target.style.transition = 'transform 0.1s ease';
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    function (e) {
      const target = e.target.closest('a, button, [role="button"]');
      if (!target) return;

      setTimeout(() => {
        target.style.transform = '';
      }, 100);
    },
    { passive: true }
  );

  // ========================================
  // ORIENTATION CHANGE HANDLER
  // ========================================

  window.addEventListener('orientationchange', function () {
    // Prevent zoom on orientation change
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );

    setTimeout(() => {
      document
        .querySelector('meta[name="viewport"]')
        ?.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
        );
    }, 500);
  });

  console.log('📱 Mobile enhancements loaded');
})();
