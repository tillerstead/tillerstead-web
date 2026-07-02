/**
 * Shower Slope Calculator Adapter
 * Integrates shower slope calculator with ProjectState
 * Auto-detects shower dimensions from waterproofing calculator
 *
 * @module adapters/slope-calculator-adapter
 * @version 1.0.0
 */

(function () {
  'use strict';

  class SlopeCalculatorAdapter {
    constructor() {
      this.state = window.ProjectState;
      this.initialized = false;
      this.elements = {};
    }

    init() {
      if (this.initialized) return;

      console.log('[SlopeAdapter] Initializing...');

      this.cacheElements();
      this.restoreFromState();
      this.bindEvents();

      this.initialized = true;
      console.log('[SlopeAdapter] Ready');
    }

    cacheElements() {
      this.elements = {
        length: document.getElementById('slope-length'),
        drainType: document.getElementById('slope-drain-type'),
        method: document.getElementById('slope-method'),
        calcButton: document.getElementById('calc-slope-btn'),
        results: document.getElementById('slope-calc-results'),
      };
    }

    restoreFromState() {
      if (!this.state) return;

      const slope = this.state.get('slope');
      const waterproofing = this.state.get('waterproofing');

      // Auto-estimate distance based on shower floor area
      if (!slope.distance && waterproofing.floorArea) {
        const estimatedDistance = Math.sqrt(waterproofing.floorArea) / 2;
        if (this.elements.length) {
          this.elements.length.value = Math.max(2, Math.round(estimatedDistance * 2) / 2);
          console.log('[SlopeAdapter] Auto-estimated distance:', estimatedDistance);
        }
      } else if (slope.distance && this.elements.length) {
        this.elements.length.value = slope.distance;
      }

      // Restore drain type
      if (slope.drainType && this.elements.drainType) {
        this.elements.drainType.value = slope.drainType;
      }

      // Restore method
      if (slope.method && this.elements.method) {
        this.elements.method.value = slope.method;
      }

      // Auto-calculate
      if (this.elements.length?.value) {
        setTimeout(() => this.calculate(), 100);
      }
    }

    bindEvents() {
      if (this.elements.calcButton) {
        this.elements.calcButton.addEventListener('click', () => this.calculate());
      }

      // Auto-save
      const autoSaveInputs = [
        this.elements.length,
        this.elements.drainType,
        this.elements.method,
      ].filter(Boolean);

      autoSaveInputs.forEach(input => {
        input.addEventListener('change', () => this.saveToState());
      });

      // Listen for waterproofing updates
      if (this.state) {
        this.state.on('change', data => {
          if (data.path === 'waterproofing.floorArea' && !this.elements.length?.value) {
            this.syncDistance();
          }
        });
      }
    }

    syncDistance() {
      if (!this.state) return;

      const floorArea = this.state.get('waterproofing.floorArea');
      if (floorArea && this.elements.length && !this.elements.length.value) {
        const estimatedDistance = Math.sqrt(floorArea) / 2;
        this.elements.length.value = Math.max(2, Math.round(estimatedDistance * 2) / 2);
        console.log('[SlopeAdapter] Synced distance from waterproofing:', estimatedDistance);
      }
    }

    calculate() {
      console.log('[SlopeAdapter] Calculating...');

      const distance = parseFloat(this.elements.length?.value) || 0;
      const drainType = this.elements.drainType?.value || 'center';
      const method = this.elements.method?.value || 'mud-bed';

      if (!distance) {
        alert('Please enter distance to drain');
        return;
      }

      // Code requirement: 1/4" per foot slope
      const slopeInches = distance * 0.25;

      // Calculate materials based on method
      let result;
      if (method === 'mud-bed') {
        result = this.calculateMudBed(distance, slopeInches, drainType);
      } else if (method === 'foam-pan') {
        result = this.calculateFoamPan(distance);
      } else {
        result = this.calculateBondedSystem(distance, slopeInches);
      }

      this.displayResults(result);
      this.saveCalculationToState({
        distance,
        drainType,
        method,
        ...result,
      });

      console.log('[SlopeAdapter] Calculation complete');
    }

    calculateMudBed(distance, slopeInches, _drainType) {
      // Traditional mud bed (deck mud/sand mix)
      // Formula: volume = area × average height × density
      // Assume square pan for simplicity: (distance × 2)²
      const panDimension = distance * 2; // ft
      const areaSqFt = panDimension * panDimension;

      // Average height = slope/2 (triangle volume)
      const avgHeightInches = slopeInches / 2;
      const avgHeightFeet = avgHeightInches / 12;

      // Volume in cubic feet
      const volumeCuFt = areaSqFt * avgHeightFeet;

      // Deck mud bags (80 lbs covers ~2 cu ft)
      const bagsNeeded = Math.ceil(volumeCuFt / 2);

      return {
        type: 'mud-bed',
        slope: slopeInches,
        bags: bagsNeeded,
        unit: 'bags',
        note: `Deck mud (${bagsNeeded} × 80lb bags). ¼" per ft slope = ${slopeInches.toFixed(2)}" drop.`,
      };
    }

    calculateFoamPan(distance) {
      // Pre-sloped foam pans come in standard sizes
      const panSize = distance * 2;
      let standardSize;

      if (panSize <= 4) standardSize = '36" × 48"';
      else if (panSize <= 5) standardSize = '48" × 60"';
      else standardSize = '60" × 72"';

      return {
        type: 'foam-pan',
        panSize: standardSize,
        unit: 'panel',
        note: `Pre-sloped foam pan (${standardSize}). No slope materials needed.`,
      };
    }

    calculateBondedSystem(distance, slopeInches) {
      // Bonded systems (Kerdi, etc.) use thin-set to create slope
      // Similar to mud bed but lighter coverage
      const panDimension = distance * 2;
      const areaSqFt = panDimension * panDimension;

      // Thin-set for slope: ~40-50 lbs per cubic foot
      const avgHeightFeet = slopeInches / 2 / 12;
      const volumeCuFt = areaSqFt * avgHeightFeet;

      // Thin-set bags (50 lbs)
      const bagsNeeded = Math.ceil(volumeCuFt * 1.2); // 20% extra for bonded system

      return {
        type: 'bonded',
        slope: slopeInches,
        bags: bagsNeeded,
        unit: 'bags',
        note: `Modified thin-set (${bagsNeeded} × 50lb bags). Bonded to membrane.`,
      };
    }

    displayResults(result) {
      if (!this.elements.results) return;

      this.elements.results.hidden = false;

      const resultsGrid = this.elements.results.querySelector('.calc-results__grid');
      if (resultsGrid) {
        if (result.type === 'foam-pan') {
          resultsGrid.innerHTML = `
            <div class="calc-result">
              <span class="calc-result__label">Recommended pan</span>
              <span class="calc-result__value calc-result__value--highlight">${result.panSize}</span>
            </div>
          `;
        } else {
          resultsGrid.innerHTML = `
            <div class="calc-result">
              <span class="calc-result__label">Slope drop</span>
              <span class="calc-result__value">${result.slope.toFixed(2)} inches</span>
            </div>
            <div class="calc-result">
              <span class="calc-result__label">Material needed</span>
              <span class="calc-result__value calc-result__value--highlight">${result.bags} bags</span>
            </div>
          `;
        }
      }

      const noteEl =
        this.elements.results.querySelector('.calc-results__note') ||
        this.elements.results.querySelector('#slope-calc-note');
      if (noteEl) {
        noteEl.textContent = result.note;
      } else {
        const note = document.createElement('p');
        note.className = 'calc-results__note';
        note.id = 'slope-calc-note';
        note.textContent = result.note;
        this.elements.results.appendChild(note);
      }
    }

    saveToState() {
      if (!this.state) return;

      const distance = parseFloat(this.elements.length?.value);
      if (distance) this.state.set('slope.distance', distance);

      const drainType = this.elements.drainType?.value;
      if (drainType) this.state.set('slope.drainType', drainType);

      const method = this.elements.method?.value;
      if (method) this.state.set('slope.method', method);

      console.log('[SlopeAdapter] State saved');
    }

    saveCalculationToState(data) {
      if (!this.state) return;

      this.state.set('slope.distance', data.distance);
      this.state.set('slope.drainType', data.drainType);
      this.state.set('slope.method', data.method);

      if (data.type === 'foam-pan') {
        this.state.set('slope.calculated.panSize', data.panSize);
      } else {
        this.state.set('slope.calculated.slopeInches', data.slope);
        this.state.set('slope.calculated.bagsNeeded', data.bags);
      }

      this.state.set('slope.calculated.calculatedAt', new Date().toISOString());

      console.log('[SlopeAdapter] Calculation saved to state');
    }

    destroy() {
      this.initialized = false;
      this.elements = {};
      console.log('[SlopeAdapter] Destroyed');
    }
  }

  window.SlopeCalculatorAdapter = SlopeCalculatorAdapter;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('slope-calculator')) {
        const adapter = new SlopeCalculatorAdapter();
        adapter.init();
      }
    });
  } else {
    if (document.getElementById('slope-calculator')) {
      const adapter = new SlopeCalculatorAdapter();
      adapter.init();
    }
  }
})();
