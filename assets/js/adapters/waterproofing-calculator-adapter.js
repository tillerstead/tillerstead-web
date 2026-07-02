/**
 * Waterproofing Calculator Adapter
 * Integrates waterproofing calculator with ProjectState
 * Auto-syncs area from tile calculator for wet areas
 *
 * @module adapters/waterproofing-calculator-adapter
 * @version 1.0.0
 */

(function () {
  'use strict';

  class WaterproofingCalculatorAdapter {
    constructor() {
      this.state = window.ProjectState;
      this.initialized = false;
      this.elements = {};
    }

    init() {
      if (this.initialized) return;

      console.log('[WaterproofAdapter] Initializing...');

      this.cacheElements();
      this.restoreFromState();
      this.bindEvents();

      this.initialized = true;
      console.log('[WaterproofAdapter] Ready');
    }

    cacheElements() {
      this.elements = {
        system: document.getElementById('wp-system'),
        location: document.getElementById('wp-location'),
        floorArea: document.getElementById('wp-floor-area'),
        wallArea: document.getElementById('wp-wall-area'),
        corners: document.getElementById('wp-corners'),
        niches: document.getElementById('wp-niches'),
        calcButton: document.getElementById('calc-waterproof-btn'),
        results: document.getElementById('waterproof-calc-results'),
      };
    }

    restoreFromState() {
      if (!this.state) return;

      const waterproofing = this.state.get('waterproofing');
      const tile = this.state.get('tile');

      // Auto-populate floor area from tile calculator (if shower/wet area)
      const tileArea = tile.calculated?.areaWithWaste;
      if (tileArea && !waterproofing.floorArea) {
        if (this.elements.floorArea) {
          this.elements.floorArea.value = Math.round(tileArea);
          console.log('[WaterproofAdapter] Auto-populated floor area:', tileArea);
        }
      } else if (waterproofing.floorArea && this.elements.floorArea) {
        this.elements.floorArea.value = waterproofing.floorArea;
      }

      // Restore system
      if (waterproofing.membraneType && this.elements.system) {
        this.elements.system.value = waterproofing.membraneType;
      }

      // Restore location
      if (waterproofing.location && this.elements.location) {
        this.elements.location.value = waterproofing.location;
      }

      // Restore wall area
      if (waterproofing.wallArea && this.elements.wallArea) {
        this.elements.wallArea.value = waterproofing.wallArea;
      }

      // Restore corners
      if (waterproofing.corners && this.elements.corners) {
        this.elements.corners.value = waterproofing.corners;
      }

      // Auto-calculate if enough data
      if (this.elements.floorArea?.value || this.elements.wallArea?.value) {
        setTimeout(() => this.calculate(), 100);
      }
    }

    bindEvents() {
      if (this.elements.calcButton) {
        this.elements.calcButton.addEventListener('click', () => this.calculate());
      }

      // Auto-save on change
      const autoSaveInputs = [
        this.elements.system,
        this.elements.location,
        this.elements.floorArea,
        this.elements.wallArea,
        this.elements.corners,
        this.elements.niches,
      ].filter(Boolean);

      autoSaveInputs.forEach(input => {
        input.addEventListener('change', () => this.saveToState());
      });

      // Listen for tile area updates
      if (this.state) {
        this.state.on('change', data => {
          if (data.path === 'tile.calculated.areaWithWaste' && !this.elements.floorArea?.value) {
            this.syncFloorArea();
          }
        });
      }
    }

    syncFloorArea() {
      if (!this.state) return;

      const tileArea = this.state.get('tile.calculated.areaWithWaste');
      if (tileArea && this.elements.floorArea && !this.elements.floorArea.value) {
        this.elements.floorArea.value = Math.round(tileArea);
        console.log('[WaterproofAdapter] Synced floor area from tile calc:', tileArea);
      }
    }

    calculate() {
      console.log('[WaterproofAdapter] Calculating...');

      const system = this.elements.system?.value || 'schluter-kerdi';
      const location = this.elements.location?.value || 'shower';
      const floorArea = parseFloat(this.elements.floorArea?.value) || 0;
      const wallArea = parseFloat(this.elements.wallArea?.value) || 0;
      const corners = parseInt(this.elements.corners?.value) || 0;
      const niches = parseInt(this.elements.niches?.value) || 0;

      const totalArea = floorArea + wallArea;

      if (totalArea === 0) {
        alert('Please enter floor and/or wall area');
        return;
      }

      // Calculate based on system type
      let result;
      if (
        system.includes('liquid') ||
        system === 'custom-redgard' ||
        system === 'mapei-aquadefense'
      ) {
        result = this.calculateLiquidSystem(totalArea, system);
      } else if (system === 'go-board') {
        result = this.calculateBoardSystem(floorArea, wallArea);
      } else {
        result = this.calculateMembraneSystem(totalArea, corners, niches, system);
      }

      this.displayResults(result);
      this.saveCalculationToState({
        system,
        location,
        floorArea,
        wallArea,
        corners,
        niches,
        ...result,
      });

      console.log('[WaterproofAdapter] Calculation complete');
    }

    calculateLiquidSystem(totalArea, system) {
      // Liquid membrane: coverage ~50-70 sq ft per gallon (2 coats)
      const coveragePerGallon = system === 'mapei-aquadefense' ? 70 : 60;
      const gallonsNeeded = Math.ceil(totalArea / coveragePerGallon);

      return {
        type: 'liquid',
        gallons: gallonsNeeded,
        unit: 'gallons',
        note: 'Apply 2 coats. Fabric corners/joints sold separately.',
      };
    }

    calculateBoardSystem(floorArea, wallArea) {
      // Board panels: 32" x 48" = 10.67 sq ft per panel
      const panelSqFt = 10.67;
      const totalBoards = Math.ceil((floorArea + wallArea) / panelSqFt);

      return {
        type: 'board',
        boards: totalBoards,
        unit: 'panels',
        note: 'Includes 10% waste. Adhesive/tape sold separately.',
      };
    }

    calculateMembraneSystem(totalArea, corners, niches, system) {
      // Sheet membrane: 54" or 108" wide rolls
      // Add 15% waste for sheet goods
      const areaWithWaste = totalArea * 1.15;

      // Determine roll size based on system
      let rollSqFt;
      if (system === 'schluter-kerdi') {
        rollSqFt = 323; // 200 sq ft typical roll
      } else if (system === 'laticrete') {
        rollSqFt = 150;
      } else {
        rollSqFt = 200;
      }

      const rolls = Math.ceil(areaWithWaste / rollSqFt);

      // Inside corners: KERDI-KERS (12" x 12")
      const cornerPieces = corners;

      // Niches: assume 16" x 20" each
      const nichePieces = niches;

      return {
        type: 'membrane',
        rolls,
        unit: 'rolls',
        corners: cornerPieces,
        niches: nichePieces,
        note: `${rolls} roll(s), ${cornerPieces} corners, ${nichePieces} niche kit(s). Adhesive required.`,
      };
    }

    displayResults(result) {
      if (!this.elements.results) return;

      this.elements.results.hidden = false;

      const resultsGrid = this.elements.results.querySelector('.calc-results__grid');
      if (resultsGrid) {
        if (result.type === 'liquid') {
          resultsGrid.innerHTML = `
            <div class="calc-result">
              <span class="calc-result__label">Liquid membrane</span>
              <span class="calc-result__value calc-result__value--highlight">${result.gallons} gallons</span>
            </div>
          `;
        } else if (result.type === 'board') {
          resultsGrid.innerHTML = `
            <div class="calc-result">
              <span class="calc-result__label">Board panels</span>
              <span class="calc-result__value calc-result__value--highlight">${result.boards} panels</span>
            </div>
          `;
        } else {
          resultsGrid.innerHTML = `
            <div class="calc-result">
              <span class="calc-result__label">Membrane rolls</span>
              <span class="calc-result__value calc-result__value--highlight">${result.rolls} rolls</span>
            </div>
            <div class="calc-result">
              <span class="calc-result__label">Inside corners</span>
              <span class="calc-result__value">${result.corners}</span>
            </div>
            ${
  result.niches > 0
    ? `
            <div class="calc-result">
              <span class="calc-result__label">Niche kits</span>
              <span class="calc-result__value">${result.niches}</span>
            </div>
            `
    : ''
  }
          `;
        }
      }

      const noteEl =
        this.elements.results.querySelector('.calc-results__note') ||
        this.elements.results.querySelector('#waterproof-calc-note');
      if (noteEl) {
        noteEl.textContent = result.note;
      } else {
        const note = document.createElement('p');
        note.className = 'calc-results__note';
        note.id = 'waterproof-calc-note';
        note.textContent = result.note;
        this.elements.results.appendChild(note);
      }
    }

    saveToState() {
      if (!this.state) return;

      const system = this.elements.system?.value;
      if (system) this.state.set('waterproofing.membraneType', system);

      const location = this.elements.location?.value;
      if (location) this.state.set('waterproofing.location', location);

      const floorArea = parseFloat(this.elements.floorArea?.value);
      if (floorArea) this.state.set('waterproofing.floorArea', floorArea);

      const wallArea = parseFloat(this.elements.wallArea?.value);
      if (wallArea) this.state.set('waterproofing.wallArea', wallArea);

      const corners = parseInt(this.elements.corners?.value);
      if (corners) this.state.set('waterproofing.corners', corners);

      console.log('[WaterproofAdapter] State saved');
    }

    saveCalculationToState(data) {
      if (!this.state) return;

      this.state.set('waterproofing.membraneType', data.system);
      this.state.set('waterproofing.location', data.location);
      this.state.set('waterproofing.floorArea', data.floorArea);
      this.state.set('waterproofing.wallArea', data.wallArea);
      this.state.set('waterproofing.corners', data.corners);

      if (data.type === 'liquid') {
        this.state.set('waterproofing.calculated.gallons', data.gallons);
      } else if (data.type === 'board') {
        this.state.set('waterproofing.calculated.boards', data.boards);
      } else {
        this.state.set('waterproofing.calculated.rolls', data.rolls);
        this.state.set('waterproofing.calculated.corners', data.corners);
        this.state.set('waterproofing.calculated.niches', data.niches);
      }

      this.state.set('waterproofing.calculated.calculatedAt', new Date().toISOString());

      console.log('[WaterproofAdapter] Calculation saved to state');
    }

    destroy() {
      this.initialized = false;
      this.elements = {};
      console.log('[WaterproofAdapter] Destroyed');
    }
  }

  window.WaterproofingCalculatorAdapter = WaterproofingCalculatorAdapter;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('waterproof-calculator')) {
        const adapter = new WaterproofingCalculatorAdapter();
        adapter.init();
      }
    });
  } else {
    if (document.getElementById('waterproof-calculator')) {
      const adapter = new WaterproofingCalculatorAdapter();
      adapter.init();
    }
  }
})();
