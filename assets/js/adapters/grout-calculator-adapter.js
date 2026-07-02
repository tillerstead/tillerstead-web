/**
 * Grout Calculator Adapter
 * Wraps existing grout calculator to integrate with unified ProjectState
 * Auto-populates tile dimensions from tile calculator if available
 *
 * @module adapters/grout-calculator-adapter
 * @version 1.0.0
 */

(function () {
  'use strict';

  /**
   * GroutCalculatorAdapter
   * Connects grout calculator UI to ProjectState
   */
  class GroutCalculatorAdapter {
    constructor() {
      this.state = window.ProjectState;
      this.initialized = false;
      this.elements = {};
    }

    /**
     * Initialize adapter
     */
    init() {
      if (this.initialized) return;

      console.log('[GroutAdapter] Initializing...');

      this.cacheElements();
      this.restoreFromState();
      this.bindEvents();

      this.initialized = true;
      console.log('[GroutAdapter] Ready');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
      this.elements = {
        area: document.getElementById('grout-area'),
        tileLength: document.getElementById('grout-tile-length'),
        tileWidth: document.getElementById('grout-tile-width'),
        tileThickness: document.getElementById('grout-tile-thickness'),
        jointWidth: document.getElementById('grout-joint-width'),
        customJoint: document.getElementById('grout-custom-joint'),
        customJointField: document.getElementById('grout-custom-joint-field'),
        groutType: document.getElementById('grout-type'),
        mosaic: document.getElementById('grout-mosaic'),
        calcButton: document.getElementById('calc-grout-btn'),
        results: document.getElementById('grout-calc-results'),
        resultPounds: document.getElementById('result-grout-pounds'),
        resultBags: document.getElementById('result-grout-bags'),
        groutNote: document.getElementById('grout-calc-note'),
      };
    }

    /**
     * Restore state from ProjectState (with auto-population from tile calc)
     */
    restoreFromState() {
      if (!this.state) return;

      const project = this.state.get('project');
      const tile = this.state.get('tile');
      const grout = this.state.get('grout');

      // Restore or auto-populate area
      const area = grout.area || tile.calculated?.areaWithWaste;
      if (!area && project.rooms && project.rooms.length > 0) {
        const totalArea = project.rooms.reduce((sum, room) => sum + (room.area || 0), 0);
        if (totalArea > 0 && this.elements.area) {
          this.elements.area.value = totalArea;
          console.log('[GroutAdapter] Auto-populated area from rooms:', totalArea);
        }
      } else if (area && this.elements.area) {
        this.elements.area.value = area;
        console.log('[GroutAdapter] Restored area:', area);
      }

      // Auto-populate tile dimensions from tile calculator
      if (tile.size.width && tile.size.length) {
        if (this.elements.tileWidth) {
          this.elements.tileWidth.value = tile.size.width;
          console.log('[GroutAdapter] Auto-populated tile width:', tile.size.width);
        }
        if (this.elements.tileLength) {
          this.elements.tileLength.value = tile.size.length;
          console.log('[GroutAdapter] Auto-populated tile length:', tile.size.length);
        }
      }

      // Restore joint width
      if (grout.jointWidth && this.elements.jointWidth) {
        this.elements.jointWidth.value = grout.jointWidth;
      }

      // Restore grout type
      if (grout.type && this.elements.groutType) {
        this.elements.groutType.value = grout.type;
      }

      // Auto-calculate if we have enough data
      if (
        this.elements.area?.value &&
        this.elements.tileWidth?.value &&
        this.elements.tileLength?.value
      ) {
        setTimeout(() => this.calculate(), 100);
      }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
      // Calculate button
      if (this.elements.calcButton) {
        this.elements.calcButton.addEventListener('click', () => this.calculate());
      }

      // Joint width change (show custom field)
      if (this.elements.jointWidth) {
        this.elements.jointWidth.addEventListener('change', e => {
          const isCustom = e.target.value === 'custom';
          if (this.elements.customJointField) {
            this.elements.customJointField.hidden = !isCustom;
          }
        });
      }

      // Auto-save on input changes
      const autoSaveInputs = [
        this.elements.area,
        this.elements.tileLength,
        this.elements.tileWidth,
        this.elements.jointWidth,
        this.elements.groutType,
      ].filter(Boolean);

      autoSaveInputs.forEach(input => {
        input.addEventListener('change', () => this.saveToState());
      });

      // Listen for tile calculator updates
      if (this.state) {
        this.state.on('change', data => {
          // If tile size changed, update our inputs
          if (data.path.startsWith('tile.size')) {
            this.syncTileDimensions();
          }
          // If tile area calculated, update grout area
          if (data.path === 'tile.calculated.areaWithWaste') {
            this.syncArea();
          }
        });
      }
    }

    /**
     * Sync tile dimensions from ProjectState
     */
    syncTileDimensions() {
      if (!this.state) return;

      const width = this.state.get('tile.size.width');
      const length = this.state.get('tile.size.length');

      if (width && this.elements.tileWidth && !this.elements.tileWidth.value) {
        this.elements.tileWidth.value = width;
        console.log('[GroutAdapter] Synced tile width:', width);
      }

      if (length && this.elements.tileLength && !this.elements.tileLength.value) {
        this.elements.tileLength.value = length;
        console.log('[GroutAdapter] Synced tile length:', length);
      }
    }

    /**
     * Sync area from tile calculator
     */
    syncArea() {
      if (!this.state || this.elements.area?.value) return;

      const areaWithWaste = this.state.get('tile.calculated.areaWithWaste');
      if (areaWithWaste && this.elements.area) {
        this.elements.area.value = areaWithWaste;
        console.log('[GroutAdapter] Synced area from tile calc:', areaWithWaste);
      }
    }

    /**
     * Perform grout calculation
     */
    calculate() {
      console.log('[GroutAdapter] Calculating...');

      // Get input values
      const area = parseFloat(this.elements.area?.value) || 0;
      const tileLength = parseFloat(this.elements.tileLength?.value) || 0;
      const tileWidth = parseFloat(this.elements.tileWidth?.value) || 0;
      const tileThickness = parseFloat(this.elements.tileThickness?.value) || 8; // mm
      const groutType = this.elements.groutType?.value || 'cement';
      const isMosaic = this.elements.mosaic?.checked || false;

      // Get joint width
      const jointSelect = this.elements.jointWidth?.value;
      const jointWidth = jointSelect === 'custom'
        ? parseFloat(this.elements.customJoint?.value) || 0
        : parseFloat(jointSelect) || 0;

      // Validate inputs
      if (!area || !tileLength || !tileWidth || !jointWidth) {
        alert('Please enter area, tile dimensions, and joint width');
        return;
      }

      // Grout calculation formula
      // Based on: (L + W) / (L × W) × joint_width × tile_thickness × area × density
      const tilePerimeter = tileLength + tileWidth; // inches
      const tileArea = tileLength * tileWidth; // sq inches
      const jointWidthInches = jointWidth;
      const tileThicknessInches = tileThickness / 25.4; // mm to inches

      // Calculate grout volume (cubic inches per sq ft)
      const groutVolumeCubicInches =
        (tilePerimeter / tileArea) * jointWidthInches * tileThicknessInches * area * 144;

      // Convert to pounds (density varies by grout type)
      const density = groutType === 'epoxy' ? 1.7 : 1.6; // lb per cubic inch (approximate)
      const groutPounds = groutVolumeCubicInches * density;

      // Add 10% waste for mosaic
      const wastedGrout = isMosaic ? groutPounds * 1.1 : groutPounds;

      // Convert to bags (typical bag size: 25 lbs for cement, 5.5 lbs for epoxy)
      const bagSize = groutType === 'epoxy' ? 5.5 : 25;
      const bagsNeeded = Math.ceil(wastedGrout / bagSize);

      // Display results
      this.displayResults({
        pounds: wastedGrout.toFixed(1),
        bags: bagsNeeded,
        groutType,
        isMosaic,
      });

      // Save to ProjectState
      this.saveCalculationToState({
        jointWidth,
        groutType,
        isMosaic,
        pounds: wastedGrout,
        bagsNeeded,
      });

      console.log('[GroutAdapter] Calculation complete');
    }

    /**
     * Display results in UI
     */
    displayResults(results) {
      if (this.elements.results) {
        this.elements.results.hidden = false;
      }

      // Update result elements if they exist
      const resultsGrid = this.elements.results?.querySelector('.calc-results__grid');
      if (resultsGrid) {
        resultsGrid.innerHTML = `
          <div class="calc-result">
            <span class="calc-result__label">Grout needed</span>
            <span class="calc-result__value">${results.pounds} lbs</span>
          </div>
          <div class="calc-result">
            <span class="calc-result__label">Bags needed</span>
            <span class="calc-result__value calc-result__value--highlight">${results.bags} bags</span>
          </div>
        `;
      }

      // Update note
      const noteText =
        results.groutType === 'epoxy'
          ? `Epoxy grout (~5.5 lbs per bag). ${results.isMosaic ? 'Mosaic adjustment applied (+10%).' : ''}`
          : `Cement-based grout (~25 lbs per bag). ${results.isMosaic ? 'Mosaic adjustment applied (+10%).' : ''}`;

      if (this.elements.groutNote) {
        this.elements.groutNote.textContent = noteText;
      } else {
        // Create note element if it doesn't exist
        const note = document.createElement('p');
        note.className = 'calc-results__note';
        note.id = 'grout-calc-note';
        note.textContent = noteText;
        if (this.elements.results) {
          this.elements.results.appendChild(note);
          this.elements.groutNote = note;
        }
      }
    }

    /**
     * Save inputs to ProjectState
     */
    saveToState() {
      if (!this.state) return;

      const area = parseFloat(this.elements.area?.value);
      if (area) {
        this.state.set('grout.area', area);
      }

      const jointSelect = this.elements.jointWidth?.value;
      const jointWidth = jointSelect === 'custom'
        ? parseFloat(this.elements.customJoint?.value) || 0
        : parseFloat(jointSelect) || 0;
      if (jointWidth) {
        this.state.set('grout.jointWidth', jointWidth);
      }

      const groutType = this.elements.groutType?.value;
      if (groutType) {
        this.state.set('grout.type', groutType);
      }

      console.log('[GroutAdapter] State saved');
    }

    /**
     * Save calculation results to ProjectState
     */
    saveCalculationToState(results) {
      if (!this.state) return;

      this.state.set('grout.jointWidth', results.jointWidth);
      this.state.set('grout.type', results.groutType);
      this.state.set('grout.calculated.pounds', results.pounds);
      this.state.set('grout.calculated.bagsNeeded', results.bagsNeeded);
      this.state.set('grout.calculated.isMosaic', results.isMosaic);
      this.state.set('grout.calculated.calculatedAt', new Date().toISOString());

      console.log('[GroutAdapter] Calculation saved to state');
    }

    /**
     * Clean up adapter
     */
    destroy() {
      this.initialized = false;
      this.elements = {};
      console.log('[GroutAdapter] Destroyed');
    }
  }

  // Export as global
  window.GroutCalculatorAdapter = GroutCalculatorAdapter;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('grout-calculator')) {
        const adapter = new GroutCalculatorAdapter();
        adapter.init();
      }
    });
  } else {
    if (document.getElementById('grout-calculator')) {
      const adapter = new GroutCalculatorAdapter();
      adapter.init();
    }
  }
})();
