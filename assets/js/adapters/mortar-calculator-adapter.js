/**
 * Mortar Calculator Adapter
 * Wraps existing mortar calculator to integrate with unified ProjectState
 * Auto-recommends trowel size based on tile dimensions from state
 *
 * @module adapters/mortar-calculator-adapter
 * @version 1.0.0
 */

(function () {
  'use strict';

  class MortarCalculatorAdapter {
    constructor() {
      this.state = window.ProjectState;
      this.initialized = false;
      this.elements = {};
    }

    init() {
      if (this.initialized) return;

      console.log('[MortarAdapter] Initializing...');

      this.cacheElements();
      this.restoreFromState();
      this.bindEvents();

      this.initialized = true;
      console.log('[MortarAdapter] Ready');
    }

    cacheElements() {
      this.elements = {
        area: document.getElementById('mortar-area'),
        tileSize: document.getElementById('mortar-tile-size'),
        customWidth: document.getElementById('mortar-custom-width'),
        customHeight: document.getElementById('mortar-custom-height'),
        customFields: document.getElementById('mortar-custom-tile-fields'),
        substrate: document.getElementById('mortar-substrate'),
        coverageGoal: document.getElementById('mortar-coverage-goal'),
        trowel: document.getElementById('mortar-trowel'),
        trowelHint: document.getElementById('trowel-hint'),
        backButter: document.getElementById('mortar-back-butter'),
        calcButton: document.getElementById('calc-mortar-btn'),
        results: document.getElementById('mortar-calc-results'),
        resultBags: document.getElementById('result-mortar-bags'),
        mortarNote: document.getElementById('mortar-calc-note'),
      };
    }

    restoreFromState() {
      if (!this.state) return;

      const tile = this.state.get('tile');
      const mortar = this.state.get('mortar');

      // Auto-populate area
      const area = mortar.area || tile.calculated?.areaWithWaste;
      if (area && this.elements.area) {
        this.elements.area.value = area;
        console.log('[MortarAdapter] Auto-populated area:', area);
      }

      // Auto-populate tile size
      if (tile.size.width && tile.size.length) {
        const sizeKey = `${tile.size.width}x${tile.size.length}`;
        if (this.elements.tileSize) {
          const option = Array.from(this.elements.tileSize.options).find(
            opt => opt.value === sizeKey
          );
          if (option) {
            this.elements.tileSize.value = sizeKey;
          } else {
            this.elements.tileSize.value = 'custom';
            if (this.elements.customWidth) this.elements.customWidth.value = tile.size.width;
            if (this.elements.customHeight) this.elements.customHeight.value = tile.size.length;
            if (this.elements.customFields) this.elements.customFields.hidden = false;
          }
        }

        // Auto-recommend trowel
        this.autoRecommendTrowel(tile.size.width, tile.size.length);
      }

      // Restore substrate
      if (mortar.substrate && this.elements.substrate) {
        this.elements.substrate.value = mortar.substrate;
      }

      // Restore trowel if saved
      if (mortar.trowelSize && this.elements.trowel) {
        this.elements.trowel.value = mortar.trowelSize;
      }

      // Auto-calculate
      if (this.elements.area?.value && this.elements.trowel?.value) {
        setTimeout(() => this.calculate(), 100);
      }
    }

    bindEvents() {
      if (this.elements.calcButton) {
        this.elements.calcButton.addEventListener('click', () => this.calculate());
      }

      // Tile size change
      if (this.elements.tileSize) {
        this.elements.tileSize.addEventListener('change', e => {
          const isCustom = e.target.value === 'custom';
          if (this.elements.customFields) {
            this.elements.customFields.hidden = !isCustom;
          }

          // Auto-recommend trowel
          if (!isCustom) {
            const [w, h] = e.target.value.split('x').map(Number);
            if (w && h) this.autoRecommendTrowel(w, h);
          }
        });
      }

      // Custom size change
      [this.elements.customWidth, this.elements.customHeight].forEach(el => {
        if (el) {
          el.addEventListener('change', () => {
            const w = parseFloat(this.elements.customWidth?.value) || 0;
            const h = parseFloat(this.elements.customHeight?.value) || 0;
            if (w && h) this.autoRecommendTrowel(w, h);
          });
        }
      });

      // Listen for tile size changes from other calculators
      if (this.state) {
        this.state.on('change', data => {
          if (data.path.startsWith('tile.size')) {
            this.syncTileSize();
          }
          if (data.path === 'tile.calculated.areaWithWaste') {
            this.syncArea();
          }
        });
      }
    }

    autoRecommendTrowel(width, length) {
      if (!this.elements.trowel) return;

      const maxSide = Math.max(width, length);

      // Trowel recommendations based on tile size
      let recommendedTrowel;
      if (maxSide < 6) {
        recommendedTrowel = '1/4x1/4x1/4';
        this.setTrowelHint('Small tile: 1/4" square notch');
      } else if (maxSide < 8) {
        recommendedTrowel = '1/4x3/8x1/4';
        this.setTrowelHint('Medium tile: 1/4"x3/8" notch');
      } else if (maxSide < 12) {
        recommendedTrowel = '1/4x1/2x1/4';
        this.setTrowelHint('Standard tile: 1/4"x1/2" notch');
      } else if (maxSide < 18) {
        recommendedTrowel = '3/8x1/2x3/8';
        this.setTrowelHint('Large tile: 3/8"x1/2" notch + back-butter');
      } else {
        recommendedTrowel = '1/2x1/2x1/2';
        this.setTrowelHint('Large format: 1/2" square notch + back-butter');
      }

      this.elements.trowel.value = recommendedTrowel;
      console.log(
        `[MortarAdapter] Auto-recommended trowel: ${recommendedTrowel} for ${width}x${length}"`
      );
    }

    setTrowelHint(text) {
      if (this.elements.trowelHint) {
        this.elements.trowelHint.textContent = text;
      }
    }

    syncTileSize() {
      if (!this.state) return;

      const width = this.state.get('tile.size.width');
      const length = this.state.get('tile.size.length');

      if (width && length) {
        const sizeKey = `${width}x${length}`;
        if (this.elements.tileSize && !this.elements.tileSize.value) {
          const option = Array.from(this.elements.tileSize.options).find(
            opt => opt.value === sizeKey
          );
          if (option) {
            this.elements.tileSize.value = sizeKey;
          } else {
            this.elements.tileSize.value = 'custom';
            if (this.elements.customWidth) this.elements.customWidth.value = width;
            if (this.elements.customHeight) this.elements.customHeight.value = length;
            if (this.elements.customFields) this.elements.customFields.hidden = false;
          }
        }

        this.autoRecommendTrowel(width, length);
      }
    }

    syncArea() {
      if (!this.state || this.elements.area?.value) return;

      const area = this.state.get('tile.calculated.areaWithWaste');
      if (area && this.elements.area) {
        this.elements.area.value = area;
        console.log('[MortarAdapter] Synced area:', area);
      }
    }

    calculate() {
      console.log('[MortarAdapter] Calculating...');

      const area = parseFloat(this.elements.area?.value) || 0;
      const trowelSize = this.elements.trowel?.value;
      const backButter = this.elements.backButter?.checked || false;
      const substrate = this.elements.substrate?.value || 'typical';

      if (!area || !trowelSize) {
        alert('Please enter area and select trowel size');
        return;
      }

      // Mortar coverage rates (sq ft per 50 lb bag) vary by trowel size
      const coverageRates = {
        '1/4x1/4x1/4': 90, // Square notch small
        '1/4x3/8x1/4': 75,
        '1/4x1/2x1/4': 60,
        '3/8x1/2x3/8': 50,
        '1/2x1/2x1/2': 40, // Square notch large format
      };

      const coveragePerBag = coverageRates[trowelSize] || 60;

      // Adjust for substrate condition
      let adjustedCoverage = coveragePerBag;
      if (substrate === 'needs-flattening') {
        adjustedCoverage *= 0.75; // 25% more mortar needed
      } else if (substrate === 'smooth') {
        adjustedCoverage *= 1.1; // 10% less mortar
      }

      // Adjust for back-buttering (adds 20-30% more mortar)
      if (backButter) {
        adjustedCoverage *= 0.75;
      }

      const bagsNeeded = Math.ceil(area / adjustedCoverage);

      this.displayResults({
        bags: bagsNeeded,
        trowelSize,
        backButter,
        substrate,
      });

      this.saveCalculationToState({
        trowelSize,
        backButter,
        substrate,
        bagsNeeded,
      });

      console.log('[MortarAdapter] Calculation complete');
    }

    displayResults(results) {
      if (this.elements.results) {
        this.elements.results.hidden = false;
      }

      const resultsGrid = this.elements.results?.querySelector('.calc-results__grid');
      if (resultsGrid) {
        resultsGrid.innerHTML = `
          <div class="calc-result">
            <span class="calc-result__label">Trowel size</span>
            <span class="calc-result__value">${results.trowelSize}"</span>
          </div>
          <div class="calc-result">
            <span class="calc-result__label">Bags needed</span>
            <span class="calc-result__value calc-result__value--highlight">${results.bags} bags</span>
          </div>
        `;
      }

      const noteText =
        `Thin-set mortar (~50 lbs per bag). ` +
        `${results.backButter ? 'Back-buttering recommended for large tiles. ' : ''}` +
        `${results.substrate === 'needs-flattening' ? 'Additional mortar for flattening included.' : ''}`;

      if (this.elements.mortarNote) {
        this.elements.mortarNote.textContent = noteText;
      }
    }

    saveCalculationToState(results) {
      if (!this.state) return;

      this.state.set('mortar.trowelSize', results.trowelSize);
      this.state.set('mortar.backButter', results.backButter);
      this.state.set('mortar.substrate', results.substrate);
      this.state.set('mortar.calculated.bagsNeeded', results.bagsNeeded);
      this.state.set('mortar.calculated.calculatedAt', new Date().toISOString());

      console.log('[MortarAdapter] Calculation saved to state');
    }

    destroy() {
      this.initialized = false;
      this.elements = {};
      console.log('[MortarAdapter] Destroyed');
    }
  }

  window.MortarCalculatorAdapter = MortarCalculatorAdapter;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('mortar-calculator')) {
        const adapter = new MortarCalculatorAdapter();
        adapter.init();
      }
    });
  } else {
    if (document.getElementById('mortar-calculator')) {
      const adapter = new MortarCalculatorAdapter();
      adapter.init();
    }
  }
})();
