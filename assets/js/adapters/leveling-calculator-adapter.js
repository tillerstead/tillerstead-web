/**
 * Self-Leveling Calculator Adapter
 * Integrates leveling calculator with ProjectState
 * Auto-syncs area from tile calculator
 *
 * @module adapters/leveling-calculator-adapter
 * @version 1.0.0
 */

(function () {
  'use strict';

  class LevelingCalculatorAdapter {
    constructor() {
      this.state = window.ProjectState;
      this.initialized = false;
      this.elements = {};
    }

    init() {
      if (this.initialized) return;

      console.log('[LevelingAdapter] Initializing...');

      this.cacheElements();
      this.restoreFromState();
      this.bindEvents();

      this.initialized = true;
      console.log('[LevelingAdapter] Ready');
    }

    cacheElements() {
      this.elements = {
        area: document.getElementById('level-area'),
        depthAvg: document.getElementById('level-depth-avg'),
        depthMax: document.getElementById('level-depth-max'),
        calcButton: document.getElementById('calc-level-btn'),
        results: document.getElementById('level-calc-results'),
      };
    }

    restoreFromState() {
      if (!this.state) return;

      const leveling = this.state.get('leveling');
      const tile = this.state.get('tile');
      const project = this.state.get('project');

      // Auto-populate area from tile calculator or project rooms
      const tileArea = tile.calculated?.areaWithWaste;
      const roomArea = project.rooms?.reduce((sum, room) => sum + (room.area || 0), 0);
      const area = leveling.area || tileArea || roomArea;

      if (area && this.elements.area) {
        this.elements.area.value = Math.round(area);
        console.log('[LevelingAdapter] Auto-populated area:', area);
      }

      // Restore depths
      if (leveling.pourDepth && this.elements.depthAvg) {
        this.elements.depthAvg.value = leveling.pourDepth;
      }

      if (leveling.maxDepth && this.elements.depthMax) {
        this.elements.depthMax.value = leveling.maxDepth;
      }

      // Auto-calculate
      if (this.elements.area?.value && this.elements.depthAvg?.value) {
        setTimeout(() => this.calculate(), 100);
      }
    }

    bindEvents() {
      if (this.elements.calcButton) {
        this.elements.calcButton.addEventListener('click', () => this.calculate());
      }

      // Auto-save
      const autoSaveInputs = [
        this.elements.area,
        this.elements.depthAvg,
        this.elements.depthMax,
      ].filter(Boolean);

      autoSaveInputs.forEach(input => {
        input.addEventListener('change', () => this.saveToState());
      });

      // Listen for area updates
      if (this.state) {
        this.state.on('change', data => {
          if (
            (data.path === 'tile.calculated.areaWithWaste' ||
              data.path.startsWith('project.rooms')) &&
            !this.elements.area?.value
          ) {
            this.syncArea();
          }
        });
      }
    }

    syncArea() {
      if (!this.state) return;

      const tileArea = this.state.get('tile.calculated.areaWithWaste');
      const roomArea = this.state
        .get('project.rooms')
        ?.reduce((sum, room) => sum + (room.area || 0), 0);
      const area = tileArea || roomArea;

      if (area && this.elements.area && !this.elements.area.value) {
        this.elements.area.value = Math.round(area);
        console.log('[LevelingAdapter] Synced area:', area);
      }
    }

    calculate() {
      console.log('[LevelingAdapter] Calculating...');

      const area = parseFloat(this.elements.area?.value) || 0;
      const depthAvg = parseFloat(this.elements.depthAvg?.value) || 0;
      const depthMax = parseFloat(this.elements.depthMax?.value) || depthAvg;

      if (!area || !depthAvg) {
        alert('Please enter area and average depth');
        return;
      }

      // Calculate volume in cubic feet
      // Volume = area (sq ft) × depth (inches) / 12
      const volumeCuFt = (area * depthAvg) / 12;

      // Self-leveling compound coverage
      // Typical: 50 lb bag covers ~50 sq ft at 1/8" depth
      // Or: 50 lb bag = ~0.5 cu ft
      const cuFtPerBag = 0.5;
      const bagsNeeded = Math.ceil(volumeCuFt / cuFtPerBag);

      // Add 10% waste for self-leveler
      const bagsWithWaste = Math.ceil(bagsNeeded * 1.1);

      // Check if depth exceeds product limits
      let warning = '';
      if (depthMax > 1.5) {
        warning = 'Warning: Depths over 1.5" may require multiple pours or extended-depth formula.';
      }

      const result = {
        volume: volumeCuFt.toFixed(2),
        bags: bagsWithWaste,
        depthAvg,
        depthMax,
        warning,
        note: `Self-leveling compound (~50 lbs per bag). ${bagsWithWaste} bags includes 10% waste.`,
      };

      this.displayResults(result);
      this.saveCalculationToState(result);

      console.log('[LevelingAdapter] Calculation complete');
    }

    displayResults(result) {
      if (!this.elements.results) return;

      this.elements.results.hidden = false;

      const resultsGrid = this.elements.results.querySelector('.calc-results__grid');
      if (resultsGrid) {
        let html = `
          <div class="calc-result">
            <span class="calc-result__label">Volume</span>
            <span class="calc-result__value">${result.volume} cu ft</span>
          </div>
          <div class="calc-result">
            <span class="calc-result__label">Bags needed</span>
            <span class="calc-result__value calc-result__value--highlight">${result.bags} bags</span>
          </div>
          <div class="calc-result">
            <span class="calc-result__label">Avg depth</span>
            <span class="calc-result__value">${result.depthAvg}" thick</span>
          </div>
        `;

        resultsGrid.innerHTML = html;
      }

      // Add warning if needed
      let noteText = result.note;
      if (result.warning) {
        noteText += ' ' + result.warning;
      }

      const noteEl =
        this.elements.results.querySelector('.calc-results__note') ||
        this.elements.results.querySelector('#level-calc-note');
      if (noteEl) {
        noteEl.textContent = noteText;
        if (result.warning) {
          noteEl.style.color = '#f59e0b'; // Warning color
        }
      } else {
        const note = document.createElement('p');
        note.className = 'calc-results__note';
        note.id = 'level-calc-note';
        note.textContent = noteText;
        if (result.warning) {
          note.style.color = '#f59e0b';
        }
        this.elements.results.appendChild(note);
      }
    }

    saveToState() {
      if (!this.state) return;

      const area = parseFloat(this.elements.area?.value);
      if (area) this.state.set('leveling.area', area);

      const depthAvg = parseFloat(this.elements.depthAvg?.value);
      if (depthAvg) this.state.set('leveling.pourDepth', depthAvg);

      const depthMax = parseFloat(this.elements.depthMax?.value);
      if (depthMax) this.state.set('leveling.maxDepth', depthMax);

      console.log('[LevelingAdapter] State saved');
    }

    saveCalculationToState(result) {
      if (!this.state) return;

      this.state.set('leveling.pourDepth', result.depthAvg);
      this.state.set('leveling.maxDepth', result.depthMax);
      this.state.set('leveling.calculated.volumeCuFt', parseFloat(result.volume));
      this.state.set('leveling.calculated.bagsNeeded', result.bags);
      this.state.set('leveling.calculated.calculatedAt', new Date().toISOString());

      console.log('[LevelingAdapter] Calculation saved to state');
    }

    destroy() {
      this.initialized = false;
      this.elements = {};
      console.log('[LevelingAdapter] Destroyed');
    }
  }

  window.LevelingCalculatorAdapter = LevelingCalculatorAdapter;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('leveling-calculator')) {
        const adapter = new LevelingCalculatorAdapter();
        adapter.init();
      }
    });
  } else {
    if (document.getElementById('leveling-calculator')) {
      const adapter = new LevelingCalculatorAdapter();
      adapter.init();
    }
  }
})();
