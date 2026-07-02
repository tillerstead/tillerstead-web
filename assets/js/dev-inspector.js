/**
 * Tillerstead Dev Inspector
 * Auto-injected by devserver.js on localhost only.
 *
 * Features:
 *  - Hover to inspect any element (box model, selector, overflow)
 *  - Click to freeze selection
 *  - Live CSS editor → changes preview instantly
 *  - Overflow scanner → highlights every element wider than the viewport
 *  - Export changes as a CSS patch snippet
 *  - Draggable, collapsible panel
 *  - Escape to deselect
 */
(function () {
  'use strict';

  // Only run on localhost / dev server
  if (
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.startsWith('192.168.')
  )
    return;

  // Prevent double-init
  if (window.__devInspector) return;
  window.__devInspector = true;

  // ─── State ──────────────────────────────────────────────────────────────────
  const state = {
    enabled: false, // inspector mode on/off
    frozen: false, // click locked to element
    target: null, // currently inspected element
    edits: {}, // { 'selector': { 'property': 'value' } }
    overflowScan: false,
  };

  // ─── Style tag for live edits ────────────────────────────────────────────────
  const editStyleEl = document.createElement('style');
  editStyleEl.id = '__dev-edits';
  document.head.appendChild(editStyleEl);

  // ─── Highlight overlay ────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = '__dev-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483640',
    boxSizing: 'border-box',
    outline: '2px solid #00e184',
    background: 'rgba(0,225,132,0.08)',
    transition: 'all 0.08s ease',
    display: 'none',
  });
  document.body.appendChild(overlay);

  // ─── Overlay: highlight overflowing elements ─────────────────────────────────
  const overflowMarkers = [];

  function clearOverflowMarkers() {
    overflowMarkers.forEach(m => m.remove());
    overflowMarkers.length = 0;
    state.overflowScan = false;
  }

  function scanOverflow() {
    clearOverflowMarkers();
    state.overflowScan = true;
    const vw = window.innerWidth;
    const elements = document.querySelectorAll('*');
    let count = 0;

    elements.forEach(el => {
      if (el.id === '__dev-panel' || el.id === '__dev-overlay' || el.closest('#__dev-panel'))
        return;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        count++;
        const marker = document.createElement('div');
        Object.assign(marker.style, {
          position: 'fixed',
          left: r.left + 'px',
          top: Math.max(0, r.top) + 'px',
          width: r.width + 'px',
          height: Math.min(r.height, window.innerHeight - Math.max(0, r.top)) + 'px',
          outline: '2px solid #ef4444',
          background: 'rgba(239,68,68,0.1)',
          pointerEvents: 'none',
          zIndex: '2147483638',
          boxSizing: 'border-box',
        });
        marker.setAttribute('data-overflow-marker', el.tagName + '.' + [...el.classList].join('.'));
        marker.title = `OVERFLOW: ${el.tagName} ${[...el.classList].slice(0, 3).join('.')} | right=${Math.round(r.right)} vw=${vw}`;
        document.body.appendChild(marker);
        overflowMarkers.push(marker);
      }
    });

    return count;
  }

  // ─── CSS selector generator ───────────────────────────────────────────────────
  function getSelector(el) {
    if (!el || el === document.body) return 'body';
    const parts = [];
    let cur = el;
    while (cur && cur !== document.documentElement) {
      let part = cur.tagName.toLowerCase();
      if (cur.id) {
        part = '#' + cur.id;
        parts.unshift(part);
        break;
      }
      const cls = [...cur.classList]
        .filter(c => !c.startsWith('__dev'))
        .slice(0, 2)
        .map(c => '.' + c)
        .join('');
      if (cls) part += cls;

      // Add :nth-child if needed to disambiguate
      const siblings = cur.parentElement
        ? [...cur.parentElement.children].filter(s => s.tagName === cur.tagName)
        : [];
      if (siblings.length > 1)
        part += `:nth-child(${[...cur.parentElement.children].indexOf(cur) + 1})`;

      parts.unshift(part);
      cur = cur.parentElement;
      if (parts.length >= 4) break;
    }
    return parts.join(' > ');
  }

  // ─── Property display list ────────────────────────────────────────────────────
  const DISPLAY_PROPS = [
    'display',
    'position',
    'overflow',
    'overflow-x',
    'overflow-y',
    'width',
    'max-width',
    'min-width',
    'height',
    'margin',
    'padding',
    'flex-wrap',
    'flex-direction',
    'transform',
    'translate',
    'box-sizing',
    'z-index',
  ];

  // ─── Panel HTML ───────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = '__dev-panel';
  panel.setAttribute('role', 'complementary');
  panel.setAttribute('aria-label', 'Dev Inspector');

  const PANEL_CSS = `
    #__dev-panel {
      position: fixed;
      bottom: 80px;
      right: 16px;
      width: 340px;
      background: #0f1117;
      color: #e2e8f0;
      border: 1px solid #1e2535;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      font-family: 'Consolas','Fira Mono',monospace;
      font-size: 12px;
      z-index: 2147483646;
      user-select: none;
      transition: opacity 0.15s;
    }
    #__dev-panel.collapsed #__di-body { display: none; }
    #__di-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      background: #161b27;
      border-radius: 10px 10px 0 0;
      cursor: move;
      border-bottom: 1px solid #1e2535;
    }
    #__di-title { flex: 1; font-weight: 700; font-size: 11px; color: #00e184; letter-spacing: .05em; }
    #__di-toggle-inspect {
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #00e184;
      background: transparent;
      color: #00e184;
      cursor: pointer;
      font-size: 11px;
      font-family: inherit;
      transition: background .15s;
    }
    #__di-toggle-inspect.active { background: #00e184; color: #0f1117; }
    #__di-collapse {
      background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 0 4px;
    }
    #__di-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; max-height: 70vh; overflow-y: auto; }
    #__di-selector {
      font-size: 10px; color: #64748b; word-break: break-all;
      background: #161b27; padding: 4px 6px; border-radius: 4px;
    }
    #__di-selector b { color: #7dd3fc; }
    .di-section-title {
      font-size: 10px; text-transform: uppercase; letter-spacing: .08em;
      color: #475569; margin: 4px 0 2px;
    }
    #__di-boxmodel {
      display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 4px; font-size: 11px;
    }
    .di-box { background: #161b27; border-radius: 4px; padding: 4px 6px; text-align: center; }
    .di-box span { display: block; font-size: 9px; color: #475569; }
    #__di-props { display: flex; flex-direction: column; gap: 2px; }
    .di-prop-row {
      display: grid; grid-template-columns: 120px 1fr;
      gap: 4px; align-items: center;
    }
    .di-prop-key { color: #7dd3fc; font-size: 11px; }
    .di-prop-val {
      background: #161b27; border: 1px solid #1e2535;
      border-radius: 3px; padding: 2px 6px;
      color: #a3e635; font-size: 11px;
      width: 100%; box-sizing: border-box;
      font-family: inherit;
    }
    .di-prop-val:focus { outline: 1px solid #00e184; border-color: #00e184; }
    .di-prop-val.edited { color: #f59e0b; border-color: #f59e0b; }
    #__di-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .di-btn {
      flex: 1; padding: 5px 8px; border-radius: 5px; border: 1px solid #1e2535;
      background: #161b27; color: #e2e8f0; cursor: pointer; font-size: 11px;
      font-family: inherit; transition: background .15s, border-color .15s;
    }
    .di-btn:hover { background: #1e2d3d; border-color: #00e184; }
    .di-btn.danger:hover { border-color: #ef4444; color: #ef4444; }
    #__di-patch {
      background: #0a0d14; border: 1px solid #1e2535; border-radius: 5px;
      padding: 8px; font-size: 10px; color: #a3e635;
      white-space: pre-wrap; word-break: break-all; max-height: 150px; overflow-y: auto;
      display: none;
    }
    #__di-overflow-count {
      font-size: 11px; background: #161b27; padding: 4px 8px; border-radius: 4px;
      display: none;
    }
    #__di-overflow-count.has-overflow { color: #ef4444; }
    #__di-overflow-count.no-overflow { color: #00e184; }
    /* toggle button when panel is hidden */
    #__dev-fab {
      position: fixed; bottom: 20px; right: 16px;
      width: 42px; height: 42px; border-radius: 50%;
      background: #00e184; border: none; cursor: pointer;
      font-size: 18px; z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0,225,132,0.4);
      display: flex; align-items: center; justify-content: center;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = PANEL_CSS;
  document.head.appendChild(styleEl);

  panel.innerHTML = `
    <div id="__di-header">
      <span id="__di-title">⚡ DEV INSPECTOR</span>
      <button id="__di-toggle-inspect" title="Toggle inspect mode (Alt+I)">Inspect</button>
      <button id="__di-collapse" title="Collapse">−</button>
    </div>
    <div id="__di-body">
      <div id="__di-selector"><b>Hover an element to inspect</b></div>

      <div class="di-section-title">Box Model</div>
      <div id="__di-boxmodel">
        <div class="di-box"><span>W</span><span id="__di-w">—</span></div>
        <div class="di-box"><span>H</span><span id="__di-h">—</span></div>
        <div class="di-box"><span>scrollW</span><span id="__di-sw">—</span></div>
        <div class="di-box"><span>overflowX</span><span id="__di-ox">—</span></div>
      </div>

      <div class="di-section-title">CSS Properties</div>
      <div id="__di-props"></div>

      <div class="di-section-title">Actions</div>
      <div id="__di-actions">
        <button class="di-btn" id="__di-scan">🔍 Scan Overflow</button>
        <button class="di-btn" id="__di-clear-scan" style="display:none">✕ Clear</button>
        <button class="di-btn" id="__di-export">📋 Copy Patch</button>
        <button class="di-btn danger" id="__di-reset">Reset Edits</button>
      </div>

      <div id="__di-overflow-count"></div>
      <pre id="__di-patch"></pre>
    </div>
  `;

  document.body.appendChild(panel);

  // FAB (shows when panel is collapsed/hidden)
  const fab = document.createElement('button');
  fab.id = '__dev-fab';
  fab.title = 'Open Dev Inspector';
  fab.innerHTML = '⚡';
  fab.style.display = 'none';
  document.body.appendChild(fab);

  // ─── DOM refs ─────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const diSelector = $('__di-selector');
  const diW = $('__di-w');
  const diH = $('__di-h');
  const diSW = $('__di-sw');
  const diOX = $('__di-ox');
  const diProps = $('__di-props');
  const diPatch = $('__di-patch');
  const diOverflowCount = $('__di-overflow-count');
  const btnInspect = $('__di-toggle-inspect');
  const btnCollapse = $('__di-collapse');
  const btnScan = $('__di-scan');
  const btnClearScan = $('__di-clear-scan');
  const btnExport = $('__di-export');
  const btnReset = $('__di-reset');

  // ─── Toggle inspect mode ──────────────────────────────────────────────────────
  function setInspectMode(on) {
    state.enabled = on;
    state.frozen = false;
    btnInspect.textContent = on ? 'Stop' : 'Inspect';
    btnInspect.classList.toggle('active', on);
    document.body.style.cursor = on ? 'crosshair' : '';
    if (!on) {
      overlay.style.display = 'none';
      state.target = null;
    }
  }

  btnInspect.addEventListener('click', () => setInspectMode(!state.enabled));

  // Alt+I shortcut
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'i') setInspectMode(!state.enabled);
    if (e.key === 'Escape' && state.enabled) {
      state.frozen = false;
      setInspectMode(false);
    }
  });

  // ─── Hover highlight ──────────────────────────────────────────────────────────
  function positionOverlay(el) {
    const r = el.getBoundingClientRect();
    Object.assign(overlay.style, {
      left: r.left + 'px',
      top: r.top + 'px',
      width: r.width + 'px',
      height: r.height + 'px',
      display: 'block',
    });
  }

  function updatePanel(el) {
    if (!el) return;
    state.target = el;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const sel = getSelector(el);

    diSelector.innerHTML = `<b>${el.tagName.toLowerCase()}</b> ${sel}`;
    diW.textContent = Math.round(r.width) + 'px';
    diH.textContent = Math.round(r.height) + 'px';
    diSW.textContent = el.scrollWidth + 'px';
    const ox = cs.getPropertyValue('overflow-x');
    diOX.textContent = ox;
    diOX.style.color = ox === 'auto' ? '#f59e0b' : ox === 'hidden' ? '#00e184' : '#e2e8f0';

    // Build editable props
    diProps.innerHTML = '';
    const currentEdits = state.edits[sel] || {};

    DISPLAY_PROPS.forEach(prop => {
      const val = cs.getPropertyValue(prop).trim();
      if (!val) return;

      const row = document.createElement('div');
      row.className = 'di-prop-row';

      const key = document.createElement('div');
      key.className = 'di-prop-key';
      key.textContent = prop;

      const input = document.createElement('input');
      input.className = 'di-prop-val';
      input.type = 'text';
      input.value = currentEdits[prop] !== undefined ? currentEdits[prop] : val;
      if (currentEdits[prop] !== undefined) input.classList.add('edited');

      input.addEventListener('change', () => {
        applyEdit(sel, el, prop, input.value);
        input.classList.add('edited');
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur();
      });

      // Stop inspector hijacking clicks inside this input
      input.addEventListener('click', e => e.stopPropagation());
      input.addEventListener('mousedown', e => e.stopPropagation());

      row.appendChild(key);
      row.appendChild(input);
      diProps.appendChild(row);
    });
  }

  // ─── Apply live CSS edit ──────────────────────────────────────────────────────
  function applyEdit(selector, _el, prop, value) {
    if (!state.edits[selector]) state.edits[selector] = {};
    state.edits[selector][prop] = value;
    rebuildEditCSS();
  }

  function rebuildEditCSS() {
    const lines = [];
    Object.entries(state.edits).forEach(([sel, props]) => {
      const decls = Object.entries(props)
        .map(([p, v]) => `  ${p}: ${v} !important;`)
        .join('\n');
      if (decls) lines.push(`${sel} {\n${decls}\n}`);
    });
    editStyleEl.textContent = lines.join('\n\n');
  }

  // ─── Mouse events ─────────────────────────────────────────────────────────────
  document.addEventListener(
    'mousemove',
    e => {
      if (!state.enabled || state.frozen) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el === panel || panel.contains(el) || el === overlay) return;
      positionOverlay(el);
      updatePanel(el);
    },
    { passive: true }
  );

  document.addEventListener(
    'click',
    e => {
      if (!state.enabled) return;
      if (panel.contains(e.target) || e.target === fab) return;
      e.preventDefault();
      e.stopPropagation();
      state.frozen = !state.frozen;
      overlay.style.outline = state.frozen ? '2px solid #f59e0b' : '2px solid #00e184';
      overlay.style.background = state.frozen ? 'rgba(245,158,11,0.1)' : 'rgba(0,225,132,0.08)';
    },
    true
  );

  // ─── Overflow scanner ─────────────────────────────────────────────────────────
  btnScan.addEventListener('click', () => {
    const count = scanOverflow();
    diOverflowCount.style.display = 'block';
    btnClearScan.style.display = '';
    if (count === 0) {
      diOverflowCount.textContent = '✓ No overflowing elements found!';
      diOverflowCount.className = 'no-overflow';
    } else {
      diOverflowCount.textContent = `⚠ ${count} overflowing element${count > 1 ? 's' : ''} (red outlines)`;
      diOverflowCount.className = 'has-overflow';
    }
  });

  btnClearScan.addEventListener('click', () => {
    clearOverflowMarkers();
    diOverflowCount.style.display = 'none';
    btnClearScan.style.display = 'none';
  });

  // ─── Export patch ────────────────────────────────────────────────────────────
  btnExport.addEventListener('click', () => {
    const lines = ['/* Tillerstead Dev Inspector — CSS Patch */'];
    lines.push(`/* Generated: ${new Date().toISOString()} */\n`);
    Object.entries(state.edits).forEach(([sel, props]) => {
      const decls = Object.entries(props)
        .map(([p, v]) => `  ${p}: ${v}; /* was: ... */`)
        .join('\n');
      if (decls) lines.push(`${sel} {\n${decls}\n}`);
    });

    const patch = lines.join('\n');

    if (Object.keys(state.edits).length === 0) {
      diPatch.textContent = '/* No edits recorded yet. */';
    } else {
      diPatch.textContent = patch;
      navigator.clipboard
        .writeText(patch)
        .then(() => {
          btnExport.textContent = '✓ Copied!';
          setTimeout(() => (btnExport.textContent = '📋 Copy Patch'), 1500);
        })
        .catch(() => {});
    }

    diPatch.style.display = 'block';
  });

  // ─── Reset edits ─────────────────────────────────────────────────────────────
  btnReset.addEventListener('click', () => {
    state.edits = {};
    editStyleEl.textContent = '';
    diPatch.style.display = 'none';
    if (state.target) updatePanel(state.target);
  });

  // ─── Collapse / FAB ──────────────────────────────────────────────────────────
  btnCollapse.addEventListener('click', () => {
    panel.style.display = 'none';
    fab.style.display = 'flex';
  });

  fab.addEventListener('click', () => {
    panel.style.display = '';
    fab.style.display = 'none';
  });

  // ─── Drag panel ───────────────────────────────────────────────────────────────
  let dragging = false;
  let dragStartX, dragStartY, panelStartX, panelStartY;

  const header = $('__di-header');
  header.addEventListener('mousedown', e => {
    if (e.target.tagName === 'BUTTON') return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.left = panelStartX + 'px';
    panel.style.top = panelStartY + 'px';
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    panel.style.left = panelStartX + (e.clientX - dragStartX) + 'px';
    panel.style.top = panelStartY + (e.clientY - dragStartY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
  });

  // ─── Reposition overflow markers on scroll/resize ─────────────────────────────
  window.addEventListener(
    'scroll',
    () => {
      if (!state.overflowScan) return;
      // Rerun scan to update positions (markers are fixed so they auto-update with scroll)
      const count = scanOverflow();
      diOverflowCount.textContent =
        count === 0
          ? '✓ No overflowing elements found!'
          : `⚠ ${count} overflowing element${count > 1 ? 's' : ''} (red outlines)`;
    },
    { passive: true }
  );

  // ─── Ready ────────────────────────────────────────────────────────────────────
  console.log(
    '%c⚡ Dev Inspector ready — Alt+I to toggle | click to freeze selection',
    'color:#00e184;font-weight:bold;font-size:13px;background:#0f1117;padding:4px 8px;border-radius:4px'
  );
})();
