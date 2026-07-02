/**
 * Tile Calculator Adapter
 * Wraps existing tile calculator to integrate with unified ProjectState
 * Enables cross-tool data sharing and persistent project state
 *
 * @module adapters/tile-calculator-adapter
 * @version 1.0.0
 */

(function () {
  'use strict';

  /**
   * TileCalculatorAdapter
   * Connects tile calculator UI to ProjectState
   */
  class TileCalculatorAdapter {
    constructor() {
      this.state = window.ProjectState;
      this.initialized = false;
      this.elements = {};
    }

    /**
     * Initialize adapter - bind UI elements and event listeners
     */
    init() {
      if (this.initialized) return;

      console.log('[TileAdapter] Initializing...');

      // Cache DOM elements
      this.cacheElements();

      // Restore state from ProjectState
      this.restoreFromState();

      // Bind events
      this.bindEvents();

      this.initialized = true;
      console.log('[TileAdapter] Ready');
    }

    /**
     * Cache all relevant DOM elements
     */
    cacheElements() {
      this.elements = {
        area: document.getElementById('calc-area'),
        tileSize: document.getElementById('calc-tile-size'),
        customWidth: document.getElementById('calc-custom-width'),
        customHeight: document.getElementById('calc-custom-height'),
        customFields: document.getElementById('calc-custom-tile-fields'),
        layout: document.getElementById('calc-layout'),
        waste: document.getElementById('calc-waste'),
        boxMode: document.getElementById('calc-box-mode'),
        tilesPerBox: document.getElementById('calc-tiles-per-box'),
        sqftPerBox: document.getElementById('calc-sqft-per-box'),
        tilesPerBoxField: document.getElementById('calc-tiles-per-box-field'),
        sqftPerBoxField: document.getElementById('calc-sqft-per-box-field'),
        atticStock: document.getElementById('calc-attic-stock'),
        calcButton: document.getElementById('calc-tile-btn'),
        results: document.getElementById('tile-calc-results'),
        resultAreaWaste: document.getElementById('result-area-waste'),
        resultTiles: document.getElementById('result-tiles'),
        resultBoxes: document.getElementById('result-boxes'),
        resultNote: document.getElementById('tile-calc-note'),
      };
    }

    /**
     * Restore calculator state from ProjectState
     */
    restoreFromState() {
      if (!this.state) return;

      const project = this.state.get('project');
      const tile = this.state.get('tile');

      // Restore area from room dimensions
      if (project.rooms && project.rooms.length > 0) {
        const totalArea = project.rooms.reduce((sum, room) => sum + (room.area || 0), 0);
        if (totalArea > 0 && this.elements.area) {
          this.elements.area.value = totalArea;
          console.log('[TileAdapter] Restored area:', totalArea);
        }
      }

      // Restore tile size
      if (tile.size.width && tile.size.length) {
        const sizeKey = `${tile.size.width}x${tile.size.length}`;
        if (this.elements.tileSize) {
          // Try to select matching preset
          const option = Array.from(this.elements.tileSize.options).find(
            opt => opt.value === sizeKey
          );
          if (option) {
            this.elements.tileSize.value = sizeKey;
          } else {
            // Use custom size
            this.elements.tileSize.value = 'custom';
            if (this.elements.customWidth) this.elements.customWidth.value = tile.size.width;
            if (this.elements.customHeight) this.elements.customHeight.value = tile.size.length;
            if (this.elements.customFields) this.elements.customFields.hidden = false;
          }
        }
      }

      // Restore waste factor
      if (tile.wastePercent && this.elements.waste) {
        this.elements.waste.value = tile.wastePercent;
      }

      // Restore layout/pattern
      if (tile.pattern && this.elements.layout) {
        this.elements.layout.value = tile.pattern;
      }

      // Auto-calculate if we have enough data
      if (this.elements.area?.value && this.elements.tileSize?.value) {
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

      // Tile size change
      if (this.elements.tileSize) {
        this.elements.tileSize.addEventListener('change', e => {
          const isCustom = e.target.value === 'custom';
          if (this.elements.customFields) {
            this.elements.customFields.hidden = !isCustom;
          }
        });
      }

      // Box mode toggle
      if (this.elements.boxMode) {
        this.elements.boxMode.addEventListener('change', e => {
          const isTilesPerBox = e.target.value === 'tiles-per-box';
          if (this.elements.tilesPerBoxField) {
            this.elements.tilesPerBoxField.hidden = !isTilesPerBox;
          }
          if (this.elements.sqftPerBoxField) {
            this.elements.sqftPerBoxField.hidden = isTilesPerBox;
          }
        });
      }

      // Auto-save on input changes
      const autoSaveInputs = [
        this.elements.area,
        this.elements.tileSize,
        this.elements.customWidth,
        this.elements.customHeight,
        this.elements.layout,
        this.elements.waste,
      ].filter(Boolean);

      autoSaveInputs.forEach(input => {
        input.addEventListener('change', () => this.saveToState());
      });
    }

    /**
     * Perform tile calculation
     */
    calculate() {
      console.log('[TileAdapter] Calculating...');

      // Get input values
      const area = parseFloat(this.elements.area?.value) || 0;
      const waste = parseFloat(this.elements.waste?.value) || 10;
      const atticStock = this.elements.atticStock?.checked || false;

      // Get tile dimensions
      let tileWidth, tileHeight;
      const tileSize = this.elements.tileSize?.value;

      if (tileSize === 'custom') {
        tileWidth = parseFloat(this.elements.customWidth?.value) || 0;
        tileHeight = parseFloat(this.elements.customHeight?.value) || 0;
      } else if (tileSize) {
        // Parse from size string like "12x24"
        const [w, h] = tileSize.split('x').map(Number);
        tileWidth = w || 0;
        tileHeight = h || 0;
      }

      // Validate inputs
      if (!area || !tileWidth || !tileHeight) {
        alert('Please enter area and tile size');
        return;
      }

      // Calculate tile area
      const tileAreaSqFt = (tileWidth * tileHeight) / 144; // sq inches to sq ft
      const wasteFactor = 1 + waste / 100;
      const areaWithWaste = area * wasteFactor;
      const tilesNeeded = Math.ceil(areaWithWaste / tileAreaSqFt);

      // Calculate boxes
      let boxesNeeded = 0;
      const boxMode = this.elements.boxMode?.value;

      if (boxMode === 'tiles-per-box') {
        const tilesPerBox = parseFloat(this.elements.tilesPerBox?.value) || 0;
        if (tilesPerBox > 0) {
          boxesNeeded = Math.ceil(tilesNeeded / tilesPerBox);
        }
      } else if (boxMode === 'sqft-per-box') {
        const sqftPerBox = parseFloat(this.elements.sqftPerBox?.value) || 0;
        if (sqftPerBox > 0) {
          boxesNeeded = Math.ceil(areaWithWaste / sqftPerBox);
        }
      }

      // Add attic stock
      if (atticStock && boxesNeeded > 0) {
        const atticStockBoxes = Math.max(1, Math.ceil(boxesNeeded * 0.05));
        boxesNeeded += atticStockBoxes;
      }

      // Display results
      this.displayResults({
        areaWithWaste: areaWithWaste.toFixed(1),
        tilesNeeded,
        boxesNeeded,
        waste,
      });

      // Save to ProjectState
      this.saveCalculationToState({
        tileWidth,
        tileHeight,
        tilesNeeded,
        boxesNeeded,
        areaWithWaste,
        waste,
      });

      console.log('[TileAdapter] Calculation complete');
    }

    /**
     * Display calculation results in UI
     */
    displayResults(results) {
      if (this.elements.results) {
        this.elements.results.hidden = false;
      }

      if (this.elements.resultAreaWaste) {
        this.elements.resultAreaWaste.textContent = `${results.areaWithWaste} sq ft`;
      }

      if (this.elements.resultTiles) {
        this.elements.resultTiles.textContent = results.tilesNeeded.toLocaleString();
      }

      if (this.elements.resultBoxes) {
        this.elements.resultBoxes.textContent =
          results.boxesNeeded > 0 ? `${results.boxesNeeded} boxes` : '—';
      }

      if (this.elements.resultNote) {
        this.elements.resultNote.textContent =
          `Includes ${results.waste}% waste factor. ` + `Order extra boxes for future repairs.`;
      }
    }

    /**
     * Save current inputs to ProjectState
     */
    saveToState() {
      if (!this.state) return;

      const tileSize = this.elements.tileSize?.value;
      let width, length;

      if (tileSize === 'custom') {
        width = parseFloat(this.elements.customWidth?.value) || 0;
        length = parseFloat(this.elements.customHeight?.value) || 0;
      } else if (tileSize) {
        [width, length] = tileSize.split('x').map(Number);
      }

      if (width && length) {
        this.state.set('tile.size.width', width);
        this.state.set('tile.size.length', length);
      }

      const waste = parseFloat(this.elements.waste?.value);
      if (waste) {
        this.state.set('tile.wastePercent', waste);
      }

      const pattern = this.elements.layout?.value;
      if (pattern) {
        this.state.set('tile.pattern', pattern);
      }

      console.log('[TileAdapter] State saved');
    }

    /**
     * Save calculation results to ProjectState
     */
    saveCalculationToState(results) {
      if (!this.state) return;

      this.state.set('tile.size.width', results.tileWidth);
      this.state.set('tile.size.length', results.tileHeight);
      this.state.set('tile.wastePercent', results.waste);
      this.state.set('tile.calculated.tileCount', results.tilesNeeded);
      this.state.set('tile.calculated.boxesNeeded', results.boxesNeeded);
      this.state.set('tile.calculated.areaWithWaste', results.areaWithWaste);
      this.state.set('tile.calculated.calculatedAt', new Date().toISOString());

      // Update room total area if not set
      const totalArea = parseFloat(this.elements.area?.value) || 0;
      if (totalArea > 0) {
        const rooms = this.state.get('project.rooms');
        if (!rooms || rooms.length === 0) {
          this.state.set('project.rooms', [
            {
              id: 'room-1',
              name: 'Main Area',
              area: totalArea,
              type: 'custom',
            },
          ]);
        }
      }

      console.log('[TileAdapter] Calculation saved to state');
    }

    /**
     * Clean up adapter
     */
    destroy() {
      this.initialized = false;
      this.elements = {};
      console.log('[TileAdapter] Destroyed');
    }
  }

  // Export as global
  window.TileCalculatorAdapter = TileCalculatorAdapter;

  // Auto-initialize if on tools page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('tile-calculator')) {
        const adapter = new TileCalculatorAdapter();
        adapter.init();
      }
    });
  } else {
    if (document.getElementById('tile-calculator')) {
      const adapter = new TileCalculatorAdapter();
      adapter.init();
    }
  }
})();
