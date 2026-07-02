/**
 * Quote Form Adapter
 * Pre-fills contact/quote form with ProjectState data
 *
 * @module adapters/quote-form-adapter
 * @version 1.0.0
 */

(function () {
  'use strict';

  class QuoteFormAdapter {
    constructor() {
      this.state = window.ProjectState;
      this.initialized = false;
      this.formContainer = null;
    }

    init() {
      if (this.initialized) return;

      console.log('[QuoteAdapter] Initializing...');

      this.formContainer = document.getElementById('quote-form-container');
      if (!this.formContainer) {
        console.warn('[QuoteAdapter] Container not found');
        return;
      }

      this.renderForm();
      this.prefillFromState();
      this.bindEvents();

      this.initialized = true;
      console.log('[QuoteAdapter] Ready');
    }

    renderForm() {
      const summary = this.state ? this.state.getSummary() : {};

      this.formContainer.innerHTML = `
        <form id="tools-hub-quote-form" class="quote-form" method="POST" name="tools-hub-quote">

          
          <!-- Project Summary (Hidden Fields) -->
          <input type="hidden" name="project-area" id="quote-project-area" value="${summary.totalArea || ''}">
          <input type="hidden" name="project-budget" id="quote-project-budget" value="${summary.budgetEstimate || ''}">
          <input type="hidden" name="project-materials" id="quote-project-materials" value="">
          
          <!-- Personal Info -->
          <div class="form-section">
            <h3>Contact Information</h3>
            
            <div class="field">
              <label for="quote-name">
                Full Name <span class="required">*</span>
              </label>
              <input 
                type="text" 
                id="quote-name" 
                name="name" 
                required 
                autocomplete="name"
                placeholder="John Smith"
              >
            </div>
            
            <div class="field">
              <label for="quote-email">
                Email <span class="required">*</span>
              </label>
              <input 
                type="email" 
                id="quote-email" 
                name="email" 
                required 
                autocomplete="email"
                placeholder="john@example.com"
              >
            </div>
            
            <div class="field">
              <label for="quote-phone">
                Phone <span class="required">*</span>
              </label>
              <input 
                type="tel" 
                id="quote-phone" 
                name="phone" 
                required 
                autocomplete="tel"
                placeholder="(609) 555-1234"
              >
            </div>
            
            <div class="field">
              <label for="quote-address">
                Project Address
              </label>
              <input 
                type="text" 
                id="quote-address" 
                name="address" 
                autocomplete="street-address"
                placeholder="123 Main St, Cherry Hill, NJ"
              >
            </div>
          </div>
          
          <!-- Project Details -->
          <div class="form-section">
            <h3>Project Details</h3>
            
            <div class="field">
              <label for="quote-project-type">
                Project Type <span class="required">*</span>
              </label>
              <select id="quote-project-type" name="project-type" required>
                <option value="">Select type...</option>
                <option value="bathroom">Bathroom</option>
                <option value="kitchen">Kitchen</option>
                <option value="shower">Shower</option>
                <option value="floor">Floor</option>
                <option value="backsplash">Backsplash</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="field">
              <label for="quote-timeline">
                Desired Timeline
              </label>
              <select id="quote-timeline" name="timeline">
                <option value="">Select timeline...</option>
                <option value="asap">As soon as possible</option>
                <option value="1-month">Within 1 month</option>
                <option value="2-3-months">2-3 months</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            
            <div class="field">
              <label for="quote-notes">
                Project Notes
              </label>
              <textarea 
                id="quote-notes" 
                name="notes" 
                rows="4"
                placeholder="Additional details about your project..."
              ></textarea>
            </div>
          </div>
          
          <!-- Auto-filled Project Summary -->
          <div class="form-section project-summary-section">
            <h3>Your Project Summary</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Total Area:</span>
                <span class="summary-value" id="summary-area">${summary.totalArea || 0} sq ft</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Estimated Budget:</span>
                <span class="summary-value" id="summary-budget">$${summary.budgetEstimate?.toLocaleString() || 0}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Estimated Timeline:</span>
                <span class="summary-value" id="summary-days">${summary.estimatedDays || 0} days</span>
              </div>
            </div>
            
            <details class="materials-details">
              <summary>Material List</summary>
              <ul id="materials-list" class="materials-list">
                <li>Complete calculations to see materials</li>
              </ul>
            </details>
          </div>
          
          <!-- Submit -->
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              📧 Request Free Quote
            </button>
            <p class="form-note">We'll respond within 24 hours</p>
          </div>
        </form>
      `;
    }

    prefillFromState() {
      if (!this.state) return;

      const contact = this.state.get('contact') || {};
      const project = this.state.get('project') || {};

      // Prefill contact info if previously entered
      if (contact.name) {
        const nameField = document.getElementById('quote-name');
        if (nameField) nameField.value = contact.name;
      }

      if (contact.email) {
        const emailField = document.getElementById('quote-email');
        if (emailField) emailField.value = contact.email;
      }

      if (contact.phone) {
        const phoneField = document.getElementById('quote-phone');
        if (phoneField) phoneField.value = contact.phone;
      }

      if (contact.address) {
        const addressField = document.getElementById('quote-address');
        if (addressField) addressField.value = contact.address;
      }

      // Prefill project type
      if (project.type) {
        const typeField = document.getElementById('quote-project-type');
        if (typeField) typeField.value = project.type;
      }

      // Update materials list
      this.updateMaterialsList();

      console.log('[QuoteAdapter] Pre-filled from state');
    }

    updateMaterialsList() {
      if (!this.state) return;

      const materialsList = document.getElementById('materials-list');
      if (!materialsList) return;

      const materials = [];

      // Tile
      const tileBoxes = this.state.get('tile.calculated.boxesNeeded');
      if (tileBoxes) materials.push(`Tile: ${tileBoxes} boxes`);

      // Grout
      const groutBags = this.state.get('grout.calculated.bagsNeeded');
      if (groutBags) materials.push(`Grout: ${groutBags} bags`);

      // Mortar
      const mortarBags = this.state.get('mortar.calculated.bagsNeeded');
      if (mortarBags) materials.push(`Mortar: ${mortarBags} bags`);

      // Waterproofing
      const waterproofGallons = this.state.get('waterproofing.calculated.gallons');
      const waterproofRolls = this.state.get('waterproofing.calculated.rolls');
      if (waterproofGallons) materials.push(`Waterproofing: ${waterproofGallons} gallons`);
      if (waterproofRolls) materials.push(`Waterproofing: ${waterproofRolls} rolls`);

      // Leveling
      const levelingBags = this.state.get('leveling.calculated.bagsNeeded');
      if (levelingBags) materials.push(`Self-Leveling: ${levelingBags} bags`);

      // Slope
      const slopeBags = this.state.get('slope.calculated.bagsNeeded');
      if (slopeBags) materials.push(`Deck Mud: ${slopeBags} bags`);

      if (materials.length > 0) {
        materialsList.innerHTML = materials.map(m => `<li>${m}</li>`).join('');

        // Update hidden field
        const materialsField = document.getElementById('quote-project-materials');
        if (materialsField) {
          materialsField.value = materials.join('; ');
        }
      }
    }

    bindEvents() {
      const form = document.getElementById('tools-hub-quote-form');
      if (!form) return;

      // Save contact info to state on change
      const nameField = document.getElementById('quote-name');
      const emailField = document.getElementById('quote-email');
      const phoneField = document.getElementById('quote-phone');
      const addressField = document.getElementById('quote-address');

      if (nameField) {
        nameField.addEventListener('blur', e => {
          if (this.state) this.state.set('contact.name', e.target.value);
        });
      }

      if (emailField) {
        emailField.addEventListener('blur', e => {
          if (this.state) this.state.set('contact.email', e.target.value);
        });
      }

      if (phoneField) {
        phoneField.addEventListener('blur', e => {
          if (this.state) this.state.set('contact.phone', e.target.value);
        });
      }

      if (addressField) {
        addressField.addEventListener('blur', e => {
          if (this.state) this.state.set('contact.address', e.target.value);
        });
      }

      // Form submission
      form.addEventListener('submit', _e => {
        console.log('[QuoteAdapter] Form submitted');
        // Form handler processes submission
      });

      // Listen for state changes to update summary
      if (this.state) {
        this.state.on('change', () => {
          this.updateSummaryDisplay();
          this.updateMaterialsList();
        });
      }
    }

    updateSummaryDisplay() {
      const summary = this.state ? this.state.getSummary() : {};

      const areaEl = document.getElementById('summary-area');
      if (areaEl) areaEl.textContent = `${summary.totalArea || 0} sq ft`;

      const budgetEl = document.getElementById('summary-budget');
      if (budgetEl) budgetEl.textContent = `$${summary.budgetEstimate?.toLocaleString() || 0}`;

      const daysEl = document.getElementById('summary-days');
      if (daysEl) daysEl.textContent = `${summary.estimatedDays || 0} days`;

      // Update hidden fields
      const areaField = document.getElementById('quote-project-area');
      if (areaField) areaField.value = summary.totalArea || '';

      const budgetField = document.getElementById('quote-project-budget');
      if (budgetField) budgetField.value = summary.budgetEstimate || '';
    }

    destroy() {
      this.initialized = false;
      this.formContainer = null;
      console.log('[QuoteAdapter] Destroyed');
    }
  }

  window.QuoteFormAdapter = QuoteFormAdapter;

  // Auto-initialize if container exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('quote-form-container');
      if (container) {
        const adapter = new QuoteFormAdapter();
        adapter.init();
      }
    });
  } else {
    const container = document.getElementById('quote-form-container');
    if (container) {
      const adapter = new QuoteFormAdapter();
      adapter.init();
    }
  }
})();
