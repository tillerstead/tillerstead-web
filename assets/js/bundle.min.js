(!(function () {
  'use strict';
  var e = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function t() {
    var t, n, r;
    'undefined' != typeof AOS &&
      (AOS.init({
        duration: e ? 0 : 600,
        easing: 'ease-out-cubic',
        once: !0,
        offset: 60,
        delay: 0,
        anchorPlacement: 'top-bottom',
        disable: e,
      }),
      window.__lenis &&
        window.__lenis.on(
          'scroll',
          ((t = function () {
            AOS.refresh();
          }),
          (n = 200),
          function () {
            (clearTimeout(r), (r = setTimeout(t, n)));
          })
        ));
  }
  function n() {
    (!(function () {
      if ('undefined' != typeof AOS) {
        var e = {
          'scroll-fade-in': 'fade-up',
          'scroll-scale-in': 'zoom-in',
          'scroll-slide-left': 'fade-right',
          'scroll-slide-right': 'fade-left',
          'animate-on-scroll': 'fade-up',
        };
        Object.keys(e).forEach(function (t) {
          document.querySelectorAll('.' + t + ':not([data-aos])').forEach(function (n) {
            n.setAttribute('data-aos', e[t]);
          });
        });
      }
    })(),
      (function () {
        if (!e) {
          var t = document.querySelectorAll('[data-animate]');
          if (t.length) {
            var n = new IntersectionObserver(
              function (e) {
                e.forEach(function (e) {
                  e.isIntersecting && (e.target.classList.add('is-visible'), n.unobserve(e.target));
                });
              },
              { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
            );
            t.forEach(function (e) {
              n.observe(e);
            });
          }
        }
      })(),
      (function () {
        if ('undefined' != typeof Lenis && !e) {
          var t = {
            duration: 0.9,
            easing: function (e) {
              return Math.min(1, 1.001 - Math.pow(2, -10 * e));
            },
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: !0,
            smoothTouch: !0,
            wheelMultiplier: 1.1,
            touchMultiplier: 1.5,
            infinite: !1,
            autoResize: !0,
          };
          if (document.body.classList.contains('tools-hub-page')) {
            var n = document.getElementById('app-content');
            n && ((t.wrapper = n), (t.content = n));
          }
          var r = new Lenis(t);
          (new MutationObserver(function () {
            document.body.classList.contains('nav-open') ? r.stop() : r.start();
          }).observe(document.body, { attributes: !0, attributeFilter: ['class'] }),
            requestAnimationFrame(function e(t) {
              (r.raf(t), requestAnimationFrame(e));
            }),
            (window.__lenis = r),
            document.querySelectorAll('a[href^="#"]').forEach(function (e) {
              e.addEventListener('click', function (e) {
                var t = document.querySelector(this.getAttribute('href'));
                t && (e.preventDefault(), r.scrollTo(t, { offset: -80 }));
              });
            }));
        }
      })(),
      t());
  }
  'loading' === document.readyState ? document.addEventListener('DOMContentLoaded', n) : n();
})(),
  (function () {
    'use strict';
    var e = 769,
      t = 300,
      n = 300,
      r = 50,
      o = { navOpen: !1, scrolled: !1, activeDropdown: null, lastScrollY: 0 },
      i = {};
    function a() {
      o.navOpen ? l() : s();
    }
    function s() {
      ((o.navOpen = !0),
        i.drawer.setAttribute('aria-hidden', 'false'),
        i.toggle.setAttribute('aria-expanded', 'true'),
        i.toggle.setAttribute('aria-label', 'Close navigation menu'),
        i.toggle.classList.add('is-active'),
        document.body.classList.add('nav-open'),
        (document.body.style.overflow = 'hidden'),
        window.__lenis && window.__lenis.stop(),
        requestAnimationFrame(function () {
          i.drawer.classList.add('is-open');
        }),
        setTimeout(function () {
          var e = i.drawer.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          (e && e.focus(),
            (function () {
              var e = Array.from(
                i.drawer.querySelectorAll(
                  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
              ).filter(function (e) {
                return !e.disabled;
              });
              if (!e.length) return;
              var t = e[0],
                n = e[e.length - 1];
              ((c = function (e) {
                'Tab' === e.key &&
                  (e.shiftKey
                    ? document.activeElement === t && (e.preventDefault(), n.focus())
                    : document.activeElement === n && (e.preventDefault(), t.focus()));
              }),
                i.drawer.addEventListener('keydown', c));
            })());
        }, n));
    }
    function l() {
      o.navOpen &&
        ((o.navOpen = !1),
        i.drawer.setAttribute('aria-hidden', 'true'),
        i.toggle.setAttribute('aria-expanded', 'false'),
        i.toggle.setAttribute('aria-label', 'Open navigation menu'),
        i.toggle.classList.remove('is-active'),
        i.drawer.classList.remove('is-open'),
        document.body.classList.remove('nav-open'),
        (document.body.style.overflow = ''),
        window.__lenis && window.__lenis.start(),
        c && (i.drawer.removeEventListener('keydown', c), (c = null)),
        i.toggle.focus());
    }
    var c = null;
    function d(e, t) {
      ((t.style.cssText = ''),
        e.setAttribute('aria-expanded', 'true'),
        (o.activeDropdown = { trigger: e, menu: t }));
    }
    function u(e, t) {
      (e.setAttribute('aria-expanded', 'false'), (t.style.cssText = ''), (o.activeDropdown = null));
    }
    function m() {
      document.querySelectorAll('.ts-nav__trigger').forEach(function (e) {
        var t = e.closest('.ts-nav__item--dropdown'),
          n = t ? t.querySelector('.ts-nav__dropdown') : null;
        n && u(e, n);
      });
    }
    function f() {
      var t;
      window.addEventListener(
        'resize',
        function () {
          (clearTimeout(t),
            (t = setTimeout(function () {
              (window.innerWidth < e || l(), m());
            }, 150)));
        },
        { passive: !0 }
      );
    }
    function v() {
      var e, n, s;
      ((i.header = document.querySelector('.ts-header')),
      (i.toggle = document.querySelector('.ts-nav-toggle')),
      (i.drawer = document.querySelector('.ts-drawer')),
      (i.close = document.querySelector('.ts-drawer__close')),
      (i.overlay = document.querySelector('.ts-drawer__overlay')),
      i.header) &&
        (i.toggle &&
          i.drawer &&
          (i.toggle.addEventListener('click', a),
          i.close && i.close.addEventListener('click', l),
          i.overlay
            ? i.overlay.addEventListener('click', l)
            : i.drawer.addEventListener('click', function (e) {
                e.target === i.drawer && l();
              }),
          document.addEventListener('keydown', function (e) {
            'Escape' === e.key && o.navOpen && l();
          }),
          i.drawer.querySelectorAll('a:not([href^="#"])').forEach(function (e) {
            e.addEventListener('click', function () {
              setTimeout(l, 100);
            });
          })),
        document.querySelectorAll('.ts-nav__item--dropdown').forEach(function (e) {
          var n,
            r = e.querySelector('.ts-nav__trigger'),
            o = e.querySelector('.ts-nav__dropdown');
          r &&
            o &&
            (e.addEventListener('mouseenter', function () {
              (clearTimeout(n), d(r, o));
            }),
            e.addEventListener('mouseleave', function () {
              n = setTimeout(function () {
                u(r, o);
              }, t);
            }),
            r.addEventListener('click', function (e) {
              e.preventDefault();
              var t = 'true' === r.getAttribute('aria-expanded');
              (m(), t || d(r, o));
            }),
            r.addEventListener('keydown', function (e) {
              if ('ArrowDown' === e.key) {
                (e.preventDefault(), d(r, o));
                var t = o.querySelector('a');
                t && t.focus();
              } else 'Escape' === e.key && (u(r, o), r.focus());
            }));
        }),
        document.addEventListener('click', function (e) {
          e.target.closest('.ts-nav__item--dropdown') || m();
        }),
        (e = document.querySelectorAll('.ts-drawer__accordion-trigger')).forEach(function (t) {
          t.addEventListener('click', function () {
            var n = 'true' === t.getAttribute('aria-expanded'),
              r = t.nextElementSibling;
            r &&
              (e.forEach(function (e) {
                if (e !== t) {
                  (e.setAttribute('aria-expanded', 'false'), e.classList.remove('is-active'));
                  var n = e.nextElementSibling;
                  n && ((n.hidden = !0), (n.style.maxHeight = '0'));
                }
              }),
              t.setAttribute('aria-expanded', String(!n)),
              t.classList.toggle('is-active'),
              (r.hidden = n),
              (r.style.maxHeight = n ? '0' : r.scrollHeight + 'px'));
          });
        }),
        (function () {
          if (i.header) {
            var e = !1;
            window.addEventListener(
              'scroll',
              function () {
                e ||
                  (requestAnimationFrame(function () {
                    var t = window.pageYOffset,
                      n = t > r;
                    (n !== o.scrolled &&
                      ((o.scrolled = n),
                      i.header.classList.toggle('ts-header--scrolled', n),
                      i.header.classList.toggle('is-scrolled', n)),
                      t > o.lastScrollY && t > 200
                        ? i.header.classList.add('header-hidden')
                        : t < o.lastScrollY && i.header.classList.remove('header-hidden'));
                    var a = document.querySelector('[data-scroll-progress]');
                    if (a) {
                      var s = document.documentElement.scrollHeight - window.innerHeight,
                        l = s > 0 ? (t / s) * 100 : 0;
                      a.style.width = l + '%';
                    }
                    ((o.lastScrollY = t), (e = !1));
                  }),
                  (e = !0));
              },
              { passive: !0 }
            );
          }
        })(),
        (n = window.location.pathname),
        document
          .querySelectorAll('.ts-nav__link[href], .ts-drawer__link[href]')
          .forEach(function (e) {
            var t = e.getAttribute('href');
            ((t && '/' !== t && n.startsWith(t)) || ('/' === t && '/' === n)) &&
              (e.setAttribute('aria-current', 'page'), e.classList.add('is-active'));
          }),
        (s = document.querySelector('.ts-header__logo-link')) &&
          '/' === s.getAttribute('href') &&
          s.addEventListener('click', function (e) {
            '/' === window.location.pathname &&
              (e.preventDefault(),
              window.__lenis
                ? window.__lenis.scrollTo(0, { duration: 1.2 })
                : window.scrollTo({ top: 0, behavior: 'smooth' }));
          }),
        f());
    }
    ((window.TillersteadNav = {
      openMobile: function () {
        s();
      },
      closeMobile: function () {
        l();
      },
      closeDropdowns: m,
      state: function () {
        return Object.assign({}, o);
      },
    }),
      'loading' === document.readyState ? document.addEventListener('DOMContentLoaded', v) : v());
  })(),
  (function () {
    'use strict';
    if (
      ('loading' in HTMLImageElement.prototype &&
        document.querySelectorAll('img[loading="lazy"]').forEach(function (e) {
          e.dataset.src && (e.src = e.dataset.src);
        }),
      'undefined' == typeof AOS)
    ) {
      var e = new IntersectionObserver(
        function (t) {
          t.forEach(function (t) {
            t.isIntersecting && (t.target.classList.add('is-visible'), e.unobserve(t.target));
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );
      document
        .querySelectorAll(
          '.animate-on-scroll, .scroll-fade-in, .scroll-scale-in, .scroll-slide-left, .scroll-slide-right, [data-animate]'
        )
        .forEach(function (t) {
          e.observe(t);
        });
    }
  })(),
  (function () {
    'use strict';
    const e = {
      init() {
        (this.initBackToTop(),
          this.initFormEnhancements(),
          this.initLoadingStates(),
          this.initToastSystem(),
          this.initErrorVisibility(),
          this.initA11yEnhancements());
      },
      initBackToTop() {
        const e = document.createElement('button');
        let t;
        ((e.className = 'back-to-top'),
          e.setAttribute('aria-label', 'Back to top'),
          e.setAttribute('title', 'Back to top'),
          (e.type = 'button'),
          document.body.appendChild(e),
          window.addEventListener(
            'scroll',
            () => {
              (clearTimeout(t),
                (t = setTimeout(() => {
                  window.pageYOffset > 400
                    ? e.classList.add('visible')
                    : e.classList.remove('visible');
                }, 100)));
            },
            { passive: !0 }
          ),
          e.addEventListener('click', () => {
            (window.scrollTo({ top: 0, behavior: 'smooth' }),
              setTimeout(() => {
                const e = document.querySelector('.skip-link');
                e && e.focus();
              }, 500));
          }));
      },
      initFormEnhancements() {
        (document.querySelectorAll('form[action]').forEach(e => {
          e.addEventListener('submit', t => {
            if (!e.checkValidity()) return void this.showFormErrors(e);
            e.classList.add('form--loading');
            const n = e.querySelector('[type="submit"]');
            (n &&
              (n.classList.add('btn--loading'),
              n.setAttribute('aria-busy', 'true'),
              (n.disabled = !0)),
              sessionStorage.setItem('form-submitted', 'true'));
          });
          e.querySelectorAll('input, textarea, select').forEach(e => {
            (e.addEventListener('blur', () => {
              this.validateField(e);
            }),
              e.addEventListener('input', () => {
                e.classList.remove('error');
                const t = e.parentElement.querySelector('.error-message');
                t && t.remove();
              }));
          });
        }),
          'true' === sessionStorage.getItem('form-submitted') &&
            (sessionStorage.removeItem('form-submitted'),
            this.showSuccessToast("Thank you! We'll get back to you soon.")));
      },
      validateField(e) {
        const t = e.checkValidity();
        if (t)
          (e.classList.remove('error'),
            e.removeAttribute('aria-invalid'),
            e.removeAttribute('aria-describedby'));
        else {
          e.classList.add('error');
          const t = e.parentElement.querySelector('.error-message');
          t && t.remove();
          const n = document.createElement('span');
          ((n.className = 'error-message'),
            (n.textContent = e.validationMessage || 'This field is required'),
            (n.id = `${e.id || e.name}-error`),
            e.setAttribute('aria-invalid', 'true'),
            e.setAttribute('aria-describedby', n.id),
            e.parentElement.appendChild(n));
        }
        return t;
      },
      showFormErrors(e) {
        const t = e.querySelectorAll(':invalid');
        t.forEach(e => this.validateField(e));
        let n = e.querySelector('.error-summary');
        (n ||
          ((n = document.createElement('div')),
          (n.className = 'error-summary'),
          n.setAttribute('role', 'alert'),
          n.setAttribute('aria-live', 'assertive'),
          e.insertBefore(n, e.firstChild)),
          (n.innerHTML = `\n        <strong class="error-summary__title">Please fix the following errors:</strong>\n        <ul class="error-list">\n          ${Array.from(
            t
          )
            .map(t => {
              const n = e.querySelector(`label[for="${t.id}"]`),
                r = n ? n.textContent : t.name;
              return `<li><a href="#${t.id}">${r}: ${t.validationMessage}</a></li>`;
            })
            .join('')}\n        </ul>\n      `),
          n.classList.add('visible'),
          n.removeAttribute('hidden'),
          n.setAttribute('aria-hidden', 'false'),
          t.length > 0 && t[0].focus());
      },
      initLoadingStates() {
        document.querySelectorAll('[data-loading]').forEach(e => {
          e.addEventListener('click', function () {
            (this.classList.add('btn--loading'),
              this.setAttribute('aria-busy', 'true'),
              (this.disabled = !0),
              setTimeout(() => {
                (this.classList.remove('btn--loading'),
                  this.setAttribute('aria-busy', 'false'),
                  (this.disabled = !1));
              }, 5e3));
          });
        });
      },
      initToastSystem() {
        if (!document.getElementById('toast-container')) {
          const e = document.createElement('div');
          ((e.id = 'toast-container'),
            e.setAttribute('aria-live', 'polite'),
            e.setAttribute('aria-atomic', 'true'),
            (e.style.cssText =
              '\n          position: fixed;\n          top: 2rem;\n          right: 2rem;\n          z-index: 9999;\n          display: flex;\n          flex-direction: column;\n          gap: 1rem;\n          max-width: 400px;\n        '),
            document.body.appendChild(e));
        }
      },
      showSuccessToast(e, t = 5e3) {
        const n = document.getElementById('toast-container'),
          r = document.createElement('div');
        ((r.className = 'toast--success'), r.setAttribute('role', 'status'), (r.textContent = e));
        const o = document.createElement('button');
        return (
          (o.innerHTML = '×'),
          o.setAttribute('aria-label', 'Close notification'),
          (o.style.cssText =
            '\n        background: none;\n        border: none;\n        color: inherit;\n        font-size: 1.5rem;\n        cursor: pointer;\n        padding: 0;\n        margin-left: auto;\n        line-height: 1;\n      '),
          o.addEventListener('click', () => {
            ((r.style.opacity = '0'),
              (r.style.transform = 'translateX(100%)'),
              setTimeout(() => r.remove(), 300));
          }),
          r.appendChild(o),
          n.appendChild(r),
          t > 0 &&
            setTimeout(() => {
              ((r.style.opacity = '0'),
                (r.style.transform = 'translateX(100%)'),
                setTimeout(() => r.remove(), 300));
            }, t),
          r
        );
      },
      showErrorToast(e, t = 7e3) {
        const n = document.getElementById('toast-container'),
          r = document.createElement('div');
        return (
          (r.className = 'toast--success'),
          r.setAttribute('role', 'alert'),
          (r.style.cssText =
            '\n        background: #FEF2F2;\n        border-color: #DC2626;\n        color: #991B1B;\n      '),
          (r.textContent = e),
          n.appendChild(r),
          t > 0 && setTimeout(() => r.remove(), t),
          r
        );
      },
      initErrorVisibility() {
        const e = new URLSearchParams(window.location.search);
        (e.get('error') &&
          this.showErrorToast('There was a problem submitting your form. Please try again.'),
          e.get('success') &&
            this.showSuccessToast('Thank you! Your message has been sent successfully.'));
      },
      initA11yEnhancements() {
        const e = document.querySelector('.skip-link');
        e &&
          e.addEventListener('click', e => {
            e.preventDefault();
            const t = document.getElementById('main-content') || document.querySelector('main');
            t &&
              (t.setAttribute('tabindex', '-1'),
              t.focus(),
              setTimeout(() => t.removeAttribute('tabindex'), 1e3));
          });
        const t = document.querySelector('h1');
        if (t) {
          const e = document.createElement('div');
          (e.setAttribute('role', 'status'),
            e.setAttribute('aria-live', 'polite'),
            (e.className = 'visually-hidden'),
            (e.textContent = `Page loaded: ${t.textContent}`),
            document.body.appendChild(e),
            setTimeout(() => e.remove(), 2e3));
        }
        this.trapFocusInModals();
      },
      trapFocusInModals() {
        document.querySelectorAll('[role="dialog"], .modal, .lead-magnet').forEach(e => {
          new MutationObserver(t => {
            t.forEach(t => {
              if ('aria-hidden' === t.attributeName) {
                if (!('true' === e.getAttribute('aria-hidden'))) {
                  const t = e.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                  );
                  t.length > 0 && t[0].focus();
                }
              }
            });
          }).observe(e, { attributes: !0 });
        });
      },
    };
    ('loading' === document.readyState
      ? document.addEventListener('DOMContentLoaded', () => e.init())
      : e.init(),
      (window.tsUXEnhancements = e));
  })());
