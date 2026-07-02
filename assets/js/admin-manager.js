/**
 * TillerPro™ Admin Manager
 *
 * Enterprise admin panel for system configuration
 * - Company information editing
 * - Legal text management
 * - Pricing configuration
 * - Branding customization
 * - Feature toggles
 * - Settings import/export
 *
 * Value Add: +$30K-$50K per license
 *
 * @requires TillerProConfig
 */

(function () {
  'use strict';

  /**
   * Admin Manager
   */
  class AdminManager {
    constructor() {
      this.config = window.TillerProConfig || {};
      this.settings = this.loadSettings();

      this.init();
    }

    /**
     * Initialize admin panel
     */
    init() {
      // Populate all form fields
      this.populateCompanyInfo();
      this.populateDisclaimers();
      this.populateTerms();
      this.populatePricing();
      this.populateBranding();
      this.populateFeatures();

      console.log('[Admin] Initialized');
    }

    /**
     * Tab Switching
     */
    switchTab(tabName) {
      // Update tab buttons
      document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      event.target.classList.add('active');

      // Update tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    /**
     * Company Info
     */
    populateCompanyInfo() {
      const company = this.config.company || {};

      document.getElementById('company-name').value = company.name || '';
      document.getElementById('company-license').value = company.license || '';
      document.getElementById('company-owner').value = company.owner || '';
      document.getElementById('company-email').value = company.email || '';
      document.getElementById('company-phone').value = company.phone || '';
      document.getElementById('company-address').value = company.address?.street || '';
      document.getElementById('company-city').value = company.address?.city || '';
      document.getElementById('company-state').value = company.address?.state || '';
      document.getElementById('company-zip').value = company.address?.zip || '';
    }

    saveCompanyInfo() {
      const company = {
        name: document.getElementById('company-name').value,
        license: document.getElementById('company-license').value,
        owner: document.getElementById('company-owner').value,
        email: document.getElementById('company-email').value,
        phone: document.getElementById('company-phone').value,
        address: {
          street: document.getElementById('company-address').value,
          city: document.getElementById('company-city').value,
          state: document.getElementById('company-state').value,
          zip: document.getElementById('company-zip').value,
        },
      };

      // Validate required fields
      if (!company.name || !company.email || !company.phone) {
        alert('Please fill in all required fields (marked with *)');
        return;
      }

      // Save to settings
      this.settings.company = company;
      this.saveSettings();
      this.showSuccess();

      console.log('[Admin] Company info saved:', company);
    }

    /**
     * Legal Disclaimers
     */
    populateDisclaimers() {
      const disclaimers = this.config.legal?.disclaimers || [];
      const container = document.getElementById('disclaimers-container');

      container.innerHTML = disclaimers
        .map(
          (disclaimer, index) => `
        <div class="legal-editor" style="margin-bottom: 1rem;">
          <div class="legal-editor-header">
            <span class="legal-editor-title">${index + 1}. ${disclaimer.title}</span>
            <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.8125rem;" onclick="window.adminManager.removeDisclaimer(${index})">
              🗑️ Remove
            </button>
          </div>
          <div class="legal-editor-body">
            <div class="form-field">
              <label>Title</label>
              <input type="text" value="${disclaimer.title}" data-disclaimer-index="${index}" data-field="title">
            </div>
            <div class="form-field" style="margin-top: 1rem;">
              <label>Content</label>
              <textarea data-disclaimer-index="${index}" data-field="content">${disclaimer.content}</textarea>
            </div>
          </div>
        </div>
      `
        )
        .join('');
    }

    saveDisclaimers() {
      const disclaimers = [];
      const editors = document.querySelectorAll('[data-disclaimer-index]');

      // Group by index
      const byIndex = {};
      editors.forEach(el => {
        const index = el.getAttribute('data-disclaimer-index');
        const field = el.getAttribute('data-field');

        if (!byIndex[index]) byIndex[index] = {};
        byIndex[index][field] = el.value;
      });

      // Build array
      Object.keys(byIndex).forEach(index => {
        disclaimers.push({
          title: byIndex[index].title || '',
          content: byIndex[index].content || '',
        });
      });

      this.settings.legal = this.settings.legal || {};
      this.settings.legal.disclaimers = disclaimers;
      this.saveSettings();
      this.showSuccess();

      console.log('[Admin] Disclaimers saved:', disclaimers.length);
    }

    addDisclaimer() {
      if (!this.settings.legal) this.settings.legal = {};
      if (!this.settings.legal.disclaimers) this.settings.legal.disclaimers = [];

      this.settings.legal.disclaimers.push({
        title: 'New Disclaimer',
        content: 'Enter disclaimer text here...',
      });

      this.saveSettings();
      this.populateDisclaimers();
    }

    removeDisclaimer(index) {
      if (!confirm('Remove this disclaimer?')) return;

      this.settings.legal.disclaimers.splice(index, 1);
      this.saveSettings();
      this.populateDisclaimers();
    }

    /**
     * Contract Terms
     */
    populateTerms() {
      const terms = this.config.legal?.terms || [];
      const container = document.getElementById('terms-container');

      container.innerHTML = terms
        .map(
          (term, index) => `
        <div class="legal-editor" style="margin-bottom: 1rem;">
          <div class="legal-editor-header">
            <span class="legal-editor-title">${index + 1}. ${term.title}</span>
            <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.8125rem;" onclick="window.adminManager.removeTerm(${index})">
              🗑️ Remove
            </button>
          </div>
          <div class="legal-editor-body">
            <div class="form-field">
              <label>Title</label>
              <input type="text" value="${term.title}" data-term-index="${index}" data-field="title">
            </div>
            <div class="form-field" style="margin-top: 1rem;">
              <label>Content</label>
              <textarea data-term-index="${index}" data-field="content">${term.content}</textarea>
            </div>
          </div>
        </div>
      `
        )
        .join('');
    }

    saveTerms() {
      const terms = [];
      const editors = document.querySelectorAll('[data-term-index]');

      // Group by index
      const byIndex = {};
      editors.forEach(el => {
        const index = el.getAttribute('data-term-index');
        const field = el.getAttribute('data-field');

        if (!byIndex[index]) byIndex[index] = {};
        byIndex[index][field] = el.value;
      });

      // Build array
      Object.keys(byIndex).forEach(index => {
        terms.push({
          title: byIndex[index].title || '',
          content: byIndex[index].content || '',
        });
      });

      this.settings.legal = this.settings.legal || {};
      this.settings.legal.terms = terms;
      this.saveSettings();
      this.showSuccess();

      console.log('[Admin] Terms saved:', terms.length);
    }

    addTerm() {
      if (!this.settings.legal) this.settings.legal = {};
      if (!this.settings.legal.terms) this.settings.legal.terms = [];

      this.settings.legal.terms.push({
        title: 'New Term',
        content: 'Enter term text here...',
      });

      this.saveSettings();
      this.populateTerms();
    }

    removeTerm(index) {
      if (!confirm('Remove this term?')) return;

      this.settings.legal.terms.splice(index, 1);
      this.saveSettings();
      this.populateTerms();
    }

    /**
     * Pricing Configuration
     */
    populatePricing() {
      const pricing = this.config.pricing || {};

      document.getElementById('pricing-labor-rate').value = pricing.laborRate || 70;
      document.getElementById('pricing-tile-markup').value = pricing.tileMarkup || 35;
      document.getElementById('pricing-grout-markup').value = pricing.groutMarkup || 40;
      document.getElementById('pricing-mortar-markup').value = pricing.mortarMarkup || 45;
      document.getElementById('pricing-tax-rate').value = pricing.taxRate || 6.625;
      document.getElementById('pricing-deposit').value = pricing.depositPercent || 30;
    }

    savePricing() {
      const pricing = {
        laborRate: parseFloat(document.getElementById('pricing-labor-rate').value) || 70,
        tileMarkup: parseFloat(document.getElementById('pricing-tile-markup').value) || 35,
        groutMarkup: parseFloat(document.getElementById('pricing-grout-markup').value) || 40,
        mortarMarkup: parseFloat(document.getElementById('pricing-mortar-markup').value) || 45,
        taxRate: parseFloat(document.getElementById('pricing-tax-rate').value) || 6.625,
        depositPercent: parseFloat(document.getElementById('pricing-deposit').value) || 30,
      };

      this.settings.pricing = pricing;
      this.saveSettings();
      this.showSuccess();

      console.log('[Admin] Pricing saved:', pricing);
    }

    /**
     * Branding
     */
    populateBranding() {
      const colors = [
        { key: 'primary', label: 'Primary Color', default: '#8b5cf6' },
        { key: 'secondary', label: 'Secondary Color', default: '#6366f1' },
        { key: 'success', label: 'Success Color', default: '#10b981' },
        { key: 'warning', label: 'Warning Color', default: '#f59e0b' },
        { key: 'danger', label: 'Danger Color', default: '#ef4444' },
      ];

      const branding = this.settings.branding || {};
      const container = document.getElementById('color-grid');

      container.innerHTML = colors
        .map(color => {
          const value = branding[color.key] || color.default;

          return `
          <div class="color-field">
            <label>${color.label}</label>
            <div class="color-input-wrapper">
              <input type="color" value="${value}" data-color-key="${color.key}" onchange="window.adminManager.updateColorHex('${color.key}', this.value)">
              <input type="text" value="${value}" data-color-hex="${color.key}" onchange="window.adminManager.updateColorPicker('${color.key}', this.value)">
            </div>
          </div>
        `;
        })
        .join('');
    }

    updateColorHex(key, value) {
      document.querySelector(`[data-color-hex="${key}"]`).value = value;
    }

    updateColorPicker(key, value) {
      if (/^#[0-9A-F]{6}$/i.test(value)) {
        document.querySelector(`[data-color-key="${key}"]`).value = value;
      }
    }

    saveBranding() {
      const branding = {};

      document.querySelectorAll('[data-color-key]').forEach(input => {
        const key = input.getAttribute('data-color-key');
        branding[key] = input.value;
      });

      this.settings.branding = branding;
      this.saveSettings();
      this.showSuccess();

      console.log('[Admin] Branding saved:', branding);
    }

    /**
     * Feature Toggles
     */
    populateFeatures() {
      const features = [
        {
          key: 'financing',
          label: 'Financing Calculator',
          desc: 'Show financing options on quotes',
        },
        {
          key: 'eSignature',
          label: 'E-Signature Integration',
          desc: 'Enable electronic signature requests',
        },
        {
          key: 'dashboard',
          label: 'Multi-Location Dashboard',
          desc: 'Enterprise dashboard for multiple locations',
        },
        {
          key: 'emailDelivery',
          label: 'Email Delivery',
          desc: 'Automatically email quotes to customers',
        },
        {
          key: 'pdfGeneration',
          label: 'PDF Quote Generation',
          desc: 'Generate professional PDF quotes',
        },
        {
          key: 'visualizer',
          label: 'Tile Pattern Visualizer',
          desc: 'Interactive tile pattern preview tool',
        },
      ];

      const settings = this.settings.features || {};
      const container = document.getElementById('features-container');

      container.innerHTML = features
        .map(feature => {
          const enabled = settings[feature.key] !== false; // Default to true

          return `
          <div class="toggle-field">
            <div class="toggle-field-content">
              <div class="toggle-field-title">${feature.label}</div>
              <div class="toggle-field-desc">${feature.desc}</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${enabled ? 'checked' : ''} data-feature-key="${feature.key}">
              <span class="slider"></span>
            </label>
          </div>
        `;
        })
        .join('');
    }

    saveFeatures() {
      const features = {};

      document.querySelectorAll('[data-feature-key]').forEach(input => {
        const key = input.getAttribute('data-feature-key');
        features[key] = input.checked;
      });

      this.settings.features = features;
      this.saveSettings();
      this.showSuccess();

      console.log('[Admin] Features saved:', features);
    }

    /**
     * Save All Settings
     */
    saveAllSettings() {
      this.saveCompanyInfo();
      this.saveDisclaimers();
      this.saveTerms();
      this.savePricing();
      this.saveBranding();
      this.saveFeatures();

      this.showSuccess();
      alert('✅ All settings saved successfully!');
    }

    /**
     * Reset to Defaults
     */
    resetToDefaults() {
      if (!confirm('This will reset ALL settings to defaults. Are you sure?')) {
        return;
      }

      if (!confirm('This action cannot be undone. Continue?')) {
        return;
      }

      // Clear saved settings
      localStorage.removeItem('tillerpro_admin_settings');
      this.settings = {};

      // Reload from config
      this.config = window.TillerProConfig || {};
      this.init();

      alert('✅ Settings reset to defaults. Refresh the page to see changes.');
    }

    /**
     * Import/Export
     */
    exportSettings() {
      const data = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings: this.settings,
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `tillerpro-settings-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('[Admin] Settings exported');
    }

    importSettings() {
      const file = document.getElementById('import-file').files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);

          if (!data.settings) {
            alert('Invalid settings file format.');
            return;
          }

          if (!confirm('This will overwrite your current settings. Continue?')) {
            return;
          }

          this.settings = data.settings;
          this.saveSettings();
          this.init();

          alert('✅ Settings imported successfully!');
          console.log('[Admin] Settings imported:', data);
        } catch (error) {
          console.error('[Admin] Import failed:', error);
          alert('Failed to import settings. Invalid file format.');
        }
      };

      reader.readAsText(file);
    }

    /**
     * UI Helpers
     */
    showSuccess() {
      const msg = document.getElementById('success-message');
      msg.classList.add('show');

      setTimeout(() => {
        msg.classList.remove('show');
      }, 3000);
    }

    /**
     * Persistence
     */
    loadSettings() {
      try {
        const data = localStorage.getItem('tillerpro_admin_settings');
        return data ? JSON.parse(data) : {};
      } catch (e) {
        console.error('[Admin] Failed to load settings:', e);
        return {};
      }
    }

    saveSettings() {
      try {
        localStorage.setItem('tillerpro_admin_settings', JSON.stringify(this.settings));

        // Update TillerProConfig with new settings
        this.applySettingsToConfig();
      } catch (e) {
        console.error('[Admin] Failed to save settings:', e);
      }
    }

    /**
     * Apply saved settings to TillerProConfig
     */
    applySettingsToConfig() {
      // Merge settings into config
      if (this.settings.company) {
        Object.assign(window.TillerProConfig.company, this.settings.company);
      }

      if (this.settings.legal) {
        Object.assign(window.TillerProConfig.legal, this.settings.legal);
      }

      if (this.settings.pricing) {
        Object.assign(window.TillerProConfig.pricing, this.settings.pricing);
      }

      if (this.settings.branding) {
        // Apply branding to CSS variables
        Object.keys(this.settings.branding).forEach(key => {
          document.documentElement.style.setProperty(`--color-${key}`, this.settings.branding[key]);
        });
      }

      if (this.settings.features) {
        window.TillerProConfig.features = this.settings.features;
      }

      console.log('[Admin] Settings applied to config');
    }
  }

  /**
   * Global Functions (for inline onclick handlers)
   */
  window.switchTab = function (tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
  };

  window.saveCompanyInfo = function () {
    window.adminManager.saveCompanyInfo();
  };

  window.saveDisclaimers = function () {
    window.adminManager.saveDisclaimers();
  };

  window.addDisclaimer = function () {
    window.adminManager.addDisclaimer();
  };

  window.saveTerms = function () {
    window.adminManager.saveTerms();
  };

  window.addTerm = function () {
    window.adminManager.addTerm();
  };

  window.savePricing = function () {
    window.adminManager.savePricing();
  };

  window.saveBranding = function () {
    window.adminManager.saveBranding();
  };

  window.saveFeatures = function () {
    window.adminManager.saveFeatures();
  };

  window.saveAllSettings = function () {
    window.adminManager.saveAllSettings();
  };

  window.resetToDefaults = function () {
    window.adminManager.resetToDefaults();
  };

  window.exportSettings = function () {
    window.adminManager.exportSettings();
  };

  window.importSettings = function () {
    window.adminManager.importSettings();
  };

  // Initialize
  window.adminManager = new AdminManager();

  console.log('[Admin Manager] Loaded and initialized');
})();
