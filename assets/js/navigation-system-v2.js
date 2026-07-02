/**
 * Tillerstead Navigation System v4.0.0
 * Header · Mobile Drawer · Desktop Dropdowns · Search Overlay · Bottom Bar
 */
(function () {
  'use strict';

  /* ── Config ── */
  const CFG = {
    MOBILE_BP: 769,
    DROPDOWN_DELAY: 300,
    ANIM_MS: 300,
    SCROLL_SHOW: 80, // px before bottom bar shows
    SCROLL_HIDE_DELTA: 60, // px of fast-scroll-down to hide header
  };

  /* ── State ── */
  const state = {
    drawerOpen: false,
    searchOpen: false,
    scrolled: false,
    headerHidden: false,
    lastScrollY: 0,
    activeDropdown: null,
    dropdownTimer: null,
    activeSearchIdx: -1,
    searchResults: [],
    lenis: null,
  };

  /* ── DOM refs ── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  const header = $('#site-header');
  const drawer = $('#ts-mobile-nav');
  const toggle = $('.ts-nav-toggle');
  const searchOverlay = $('#search-overlay');
  const searchInput = $('#search-input');
  const mobileSearchInput = $('#mobile-search-input');
  const searchResults = $('#search-results');
  const searchTrigger = $('#search-trigger');
  const quickSearchTriggers = $$('[data-open-search]');
  const bottomBar = $('#bottom-bar');
  const backToTopBtn = $('#back-to-top-btn');
  const dismissBtn = $('#bottom-bar-dismiss');

  if (!header) return;

  function syncBodyScrollLock() {
    document.body.classList.toggle('ts-scroll-lock', state.drawerOpen || state.searchOpen);
  }

  /* ===================================================
     MOBILE DRAWER
     =================================================== */

  function openDrawer() {
    if (state.drawerOpen) return;
    state.drawerOpen = true;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.removeAttribute('inert');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    syncBodyScrollLock();
    if (state.lenis) state.lenis.stop();
    requestAnimationFrame(() => {
      const firstLink = drawer.querySelector('a, button:not(.ts-drawer__close)');
      if (firstLink) firstLink.focus();
    });
  }

  function closeDrawer() {
    if (!state.drawerOpen) return;
    state.drawerOpen = false;
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    syncBodyScrollLock();
    if (state.lenis) state.lenis.start();
    toggle.focus();
    // Collapse all mobile accordions
    $$('.ts-drawer__accordion-trigger', drawer).forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.hidden = true;
    });
  }

  if (toggle && drawer) {
    toggle.addEventListener('click', () => (state.drawerOpen ? closeDrawer() : openDrawer()));

    const closeBtn = $('.ts-drawer__close', drawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    const overlay = $('.ts-drawer__overlay', drawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Focus trap
    drawer.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = $$('a[href], button:not([disabled]), input', drawer);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Mobile accordions
    $$('.ts-drawer__accordion-trigger', drawer).forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        // Collapse siblings
        $$('.ts-drawer__accordion-trigger', drawer).forEach(other => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            const p = document.getElementById(other.getAttribute('aria-controls'));
            if (p) p.hidden = true;
          }
        });
        btn.setAttribute('aria-expanded', String(!expanded));
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.hidden = expanded;
      });
    });
  }

  /* ===================================================
     DESKTOP DROPDOWNS
     =================================================== */

  function openDropdown(item) {
    if (state.activeDropdown === item) return;
    closeDropdown();
    state.activeDropdown = item;
    const trigger = $('[aria-expanded]', item);
    const panel = $('.ts-nav__dropdown', item);
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    if (panel) panel.classList.add('ts-nav__dropdown--open');
  }

  function closeDropdown() {
    if (!state.activeDropdown) return;
    const trigger = $('[aria-expanded]', state.activeDropdown);
    const panel = $('.ts-nav__dropdown', state.activeDropdown);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (panel) panel.classList.remove('ts-nav__dropdown--open');
    state.activeDropdown = null;
  }

  $$('.ts-nav__item--dropdown').forEach(item => {
    item.addEventListener('mouseenter', () => {
      clearTimeout(state.dropdownTimer);
      openDropdown(item);
    });
    item.addEventListener('mouseleave', () => {
      state.dropdownTimer = setTimeout(closeDropdown, CFG.DROPDOWN_DELAY);
    });

    const trigger = $('[aria-expanded]', item);
    if (trigger) {
      trigger.addEventListener('click', e => {
        e.preventDefault();
        state.activeDropdown === item ? closeDropdown() : openDropdown(item);
      });
      trigger.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          openDropdown(item);
          const first = $('.ts-nav__dropdown a', item);
          if (first) first.focus();
        }
        if (e.key === 'Escape') closeDropdown();
      });
    }
  });

  document.addEventListener('click', e => {
    if (state.activeDropdown && !state.activeDropdown.contains(e.target)) closeDropdown();
  });

  /* ===================================================
     SEARCH OVERLAY
     =================================================== */

  /* ── Search index (built from data attribute or static) ── */
  let searchIndex = [];

  function buildSearchIndex() {
    // Try to load from a global if the Eleventy build injected one
    if (window.__TILLERSTEAD_SEARCH_INDEX) {
      searchIndex = window.__TILLERSTEAD_SEARCH_INDEX;
      return;
    }
    // Fallback: build from all <a> in nav + any data-search-index script
    const indexScript = document.getElementById('search-index-data');
    if (indexScript) {
      try {
        searchIndex = JSON.parse(indexScript.textContent);
      } catch (_) {
        /* skip */
      }
      return;
    }
    // Minimal: scrape nav links
    searchIndex = $$('.ts-nav a, .ts-drawer a').map(a => ({
      title: a.textContent.trim(),
      url: a.href || a.closest('a')?.href || '#',
      type: 'page',
    }));
  }

  function performSearch(query) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return searchIndex
      .filter(
        item =>
          item.title.toLowerCase().includes(q) || (item.snippet || '').toLowerCase().includes(q)
      )
      .slice(0, 12);
  }

  function renderResults(results, query) {
    if (!searchResults) return;
    if (!query || query.length < 2) {
      searchResults.innerHTML = `
        <div class="ts-search__empty" aria-live="polite">
          <div class="ts-search__empty-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <p class="ts-search__empty-title">Search Tillerstead</p>
          <p class="ts-search__empty-hint">Find build guides, services, contractor resources &amp; more</p>
        </div>`;
      state.searchResults = [];
      state.activeSearchIdx = -1;
      return;
    }
    if (!results.length) {
      searchResults.innerHTML = `<div class="ts-search__no-results"><p>No results for "<strong>${escapeHtml(query)}</strong>"</p></div>`;
      state.searchResults = [];
      state.activeSearchIdx = -1;
      return;
    }
    state.searchResults = results;
    state.activeSearchIdx = -1;
    searchResults.innerHTML = results
      .map(
        (r, i) => `
      <a href="${escapeAttr(r.url)}" class="ts-search__result" role="option" id="search-result-${i}" data-idx="${i}">
        <div>
          <div class="ts-search__result-title">${highlightMatch(r.title, query)}</div>
          ${r.snippet ? `<div class="ts-search__result-snippet">${highlightMatch(r.snippet, query)}</div>` : ''}
        </div>
        ${r.type ? `<span class="ts-search__result-type">${escapeHtml(r.type)}</span>` : ''}
      </a>`
      )
      .join('');
  }

  function openSearch() {
    if (state.searchOpen) return;
    if (!searchOverlay) return;
    state.searchOpen = true;
    buildSearchIndex();
    searchOverlay.setAttribute('aria-hidden', 'false');
    searchOverlay.removeAttribute('inert');
    if (searchTrigger) searchTrigger.setAttribute('aria-expanded', 'true');
    syncBodyScrollLock();
    if (state.lenis) state.lenis.stop();
    requestAnimationFrame(() => searchInput && searchInput.focus());
  }

  function closeSearch() {
    if (!state.searchOpen) return;
    state.searchOpen = false;
    searchOverlay.setAttribute('aria-hidden', 'true');
    searchOverlay.setAttribute('inert', '');
    if (searchTrigger) searchTrigger.setAttribute('aria-expanded', 'false');
    syncBodyScrollLock();
    if (state.lenis) state.lenis.start();
    if (searchInput) searchInput.value = '';
    renderResults([], '');
    if (searchTrigger) searchTrigger.focus();
  }

  function navigateSearchResults(dir) {
    if (!state.searchResults.length) return;
    state.activeSearchIdx += dir;
    if (state.activeSearchIdx < 0) state.activeSearchIdx = state.searchResults.length - 1;
    if (state.activeSearchIdx >= state.searchResults.length) state.activeSearchIdx = 0;
    $$('.ts-search__result', searchResults).forEach((el, i) => {
      el.classList.toggle('ts-search__result--active', i === state.activeSearchIdx);
    });
    const active = $(`#search-result-${state.activeSearchIdx}`);
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  if (searchOverlay && searchInput) {
    if (searchTrigger) searchTrigger.addEventListener('click', openSearch);
    quickSearchTriggers.forEach(trigger => {
      trigger.addEventListener('click', openSearch);
    });

    const closeBtn = $('.ts-search__close', searchOverlay);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    const backdrop = $('.ts-search__backdrop', searchOverlay);
    if (backdrop) backdrop.addEventListener('click', closeSearch);

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      renderResults(performSearch(q), q);
    });

    searchOverlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeSearch();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSearchResults(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSearchResults(-1);
      }
      if (e.key === 'Enter' && state.activeSearchIdx >= 0) {
        e.preventDefault();
        const active = $(`#search-result-${state.activeSearchIdx}`);
        if (active) window.location.href = active.href;
      }
    });

    // Cmd/Ctrl+K shortcut
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        state.searchOpen ? closeSearch() : openSearch();
      }
    });
  }

  // Mobile search in drawer
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', () => {
      const q = mobileSearchInput.value.trim();
      if (q.length >= 2) {
        closeDrawer();
        openSearch();
        if (searchInput) {
          searchInput.value = q;
          searchInput.dispatchEvent(new Event('input'));
        }
      }
    });
  }

  /* ===================================================
     SCROLL BEHAVIOR
     =================================================== */

  function onScroll() {
    const y = window.scrollY;
    const delta = y - state.lastScrollY;

    // Header scrolled class
    if (y > 20 && !state.scrolled) {
      state.scrolled = true;
      header.classList.add('ts-header--scrolled');
    } else if (y <= 20 && state.scrolled) {
      state.scrolled = false;
      header.classList.remove('ts-header--scrolled');
    }

    // Auto-hide header on scroll down (skip if drawer/search open)
    if (!state.drawerOpen && !state.searchOpen) {
      if (delta > CFG.SCROLL_HIDE_DELTA && y > 200 && !state.headerHidden) {
        state.headerHidden = true;
        header.classList.add('ts-header--hidden');
      } else if (delta < -10 && state.headerHidden) {
        state.headerHidden = false;
        header.classList.remove('ts-header--hidden');
      }
    }

    // Bottom bar visibility
    if (bottomBar) {
      if (y > CFG.SCROLL_SHOW) {
        bottomBar.hidden = false;
        bottomBar.classList.remove('ts-bottom-bar--hidden');
      } else {
        bottomBar.classList.add('ts-bottom-bar--hidden');
      }
    }

    // Scroll progress
    const progress = $('.scroll-progress');
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${(y / max) * 100}%` : '0%';
    }

    state.lastScrollY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial state

  /* ===================================================
     BOTTOM BAR ACTIONS
     =================================================== */

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      if (state.lenis) {
        state.lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      if (bottomBar) bottomBar.hidden = true;
    });
  }

  /* ===================================================
     ACTIVE PAGE HIGHLIGHTING
     =================================================== */

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  $$('.ts-nav__link, .ts-nav__dropdown-link').forEach(link => {
    const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, '') || '/';
    if (linkPath === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ===================================================
     RESPONSIVE RESET
     =================================================== */

  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    if (
      (lastWidth < CFG.MOBILE_BP && w >= CFG.MOBILE_BP) ||
      (lastWidth >= CFG.MOBILE_BP && w < CFG.MOBILE_BP)
    ) {
      closeDrawer();
      closeDropdown();
    }
    lastWidth = w;
  });

  /* ===================================================
     LENIS INTEGRATION
     =================================================== */

  const enableLenis = document.documentElement.dataset.enableLenis === 'true';
  if (enableLenis && window.Lenis) {
    state.lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    function raf(time) {
      state.lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ===================================================
     PUBLIC API
     =================================================== */

  window.TillersteadNav = {
    openDrawer,
    closeDrawer,
    openSearch,
    closeSearch,
    version: '4.0.0',
  };

  /* ── Helpers ── */
  function escapeHtml(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }
  function escapeAttr(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function highlightMatch(text, query) {
    const safe = escapeHtml(text);
    const q = escapeHtml(query);
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }
})();
