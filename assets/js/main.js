(function () {
  'use strict';

  // ─── Lazy Loading (native) ───
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.dataset.src) img.src = img.dataset.src;
    });
  }

  // ─── Lightweight scroll reveal fallback (no external animation engine required) ───
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
    document
      .querySelectorAll(
        '.animate-on-scroll, .scroll-fade-in, .scroll-scale-in, .scroll-slide-left, .scroll-slide-right, [data-animate]'
      )
      .forEach(function (el) {
        observer.observe(el);
      });
  }

  // Header scroll & navigation handled by navigation-system.js
})();
