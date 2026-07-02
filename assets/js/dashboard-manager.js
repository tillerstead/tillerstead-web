/**
 * TillerPro™ Dashboard Manager
 *
 * Multi-location performance tracking and management system
 * - Location management
 * - Quote analytics per location
 * - Win rate tracking
 * - Regional pricing configuration
 * - Performance benchmarking
 *
 * Value Add: +$50K-$100K per Enterprise license
 *
 * @requires TillerProConfig
 * @requires ProjectState
 * @requires QuoteGenerator
 * @requires ESignatureManager
 */

(function () {
  'use strict';

  /**
   * Dashboard Manager
   * Handles multi-location analytics and management
   */
  class DashboardManager {
    constructor() {
      this.locations = this.loadLocations();
      this.activeLocationId = this.loadActiveLocation();
      this.quotes = this.loadQuotes();
      this.pricingOverrides = this.loadPricingOverrides();

      this.init();
    }

    /**
     * Initialize dashboard
     */
    init() {
      // Ensure at least one location exists
      if (this.locations.length === 0) {
        this.addDefaultLocation();
      }

      // Render all components
      this.renderLocationSelector();
      this.renderMetrics();
      this.renderQuotesTable();
      this.renderPricingEditor();

      console.log('[Dashboard] Initialized', {
        locations: this.locations.length,
        activeLocation: this.getActiveLocation()?.name,
        totalQuotes: this.quotes.length,
      });
    }

    /**
     * Add default location
     */
    addDefaultLocation() {
      const config = window.TillerProConfig?.company || {};

      this.locations.push({
        id: 'main',
        name: config.name || 'Main Office',
        address: config.address
          ? `${config.address.street}, ${config.address.city}, ${config.address.state}`
          : '',
        manager: config.owner || '',
        phone: config.phone || '',
        createdAt: new Date().toISOString(),
        active: true,
      });

      this.activeLocationId = 'main';
      this.saveLocations();
    }

    /**
     * Location Management
     */
    getActiveLocation() {
      return this.locations.find(loc => loc.id === this.activeLocationId);
    }

    selectLocation(locationId) {
      this.activeLocationId = locationId;
      this.saveActiveLocation();
      this.renderMetrics();
      this.renderQuotesTable();
      this.renderPricingEditor();
      this.renderLocationSelector(); // Update active state
    }

    addLocation(data) {
      const location = {
        id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        address: data.address || '',
        manager: data.manager || '',
        phone: data.phone || '',
        createdAt: new Date().toISOString(),
        active: true,
      };

      this.locations.push(location);
      this.saveLocations();
      this.renderLocationSelector();

      return location;
    }

    removeLocation(locationId) {
      if (this.locations.length <= 1) {
        alert('Cannot remove the last location.');
        return false;
      }

      const confirmed = confirm(
        'Are you sure you want to remove this location? This cannot be undone.'
      );
      if (!confirmed) return false;

      this.locations = this.locations.filter(loc => loc.id !== locationId);

      // If active location was removed, switch to first available
      if (this.activeLocationId === locationId) {
        this.activeLocationId = this.locations[0].id;
        this.saveActiveLocation();
      }

      this.saveLocations();
      this.renderLocationSelector();
      this.renderMetrics();
      this.renderQuotesTable();

      return true;
    }

    /**
     * Quote Analytics
     */
    getQuotesForLocation(locationId) {
      return this.quotes.filter(q => q.locationId === locationId);
    }

    getMetricsForLocation(locationId) {
      const quotes = this.getQuotesForLocation(locationId);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Filter last 30 days
      const recentQuotes = quotes.filter(q => {
        const quoteDate = new Date(q.createdAt);
        return quoteDate >= thirtyDaysAgo;
      });

      // Calculate metrics
      const totalQuotes = recentQuotes.length;
      const totalValue = recentQuotes.reduce((sum, q) => sum + (q.totals?.grandTotal || 0), 0);
      const signedQuotes = recentQuotes.filter(q => q.status === 'signed').length;
      const winRate = totalQuotes > 0 ? (signedQuotes / totalQuotes) * 100 : 0;
      const avgQuoteValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

      // Calculate trends (compare to previous 30 days)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const previousPeriod = quotes.filter(q => {
        const quoteDate = new Date(q.createdAt);
        return quoteDate >= sixtyDaysAgo && quoteDate < thirtyDaysAgo;
      });

      const prevTotal = previousPeriod.length;
      const quoteTrend = prevTotal > 0 ? ((totalQuotes - prevTotal) / prevTotal) * 100 : 0;

      return {
        totalQuotes,
        totalValue,
        signedQuotes,
        winRate,
        avgQuoteValue,
        quoteTrend,
        period: 'Last 30 days',
      };
    }

    /**
     * Regional Pricing
     */
    getPricingForLocation(locationId) {
      const override = this.pricingOverrides[locationId];
      const basePricing = window.TillerProConfig?.pricing || {};

      if (!override) {
        return basePricing;
      }

      // Merge override with base pricing
      return {
        ...basePricing,
        ...override,
      };
    }

    setPricingForLocation(locationId, pricing) {
      this.pricingOverrides[locationId] = pricing;
      this.savePricingOverrides();
    }

    /**
     * Rendering Methods
     */
    renderLocationSelector() {
      const container = document.getElementById('location-grid');
      if (!container) return;

      container.innerHTML = this.locations
        .map(location => {
          const metrics = this.getMetricsForLocation(location.id);
          const isActive = location.id === this.activeLocationId;

          return `
          <div class="location-card ${isActive ? 'active' : ''}" onclick="window.dashboard.selectLocation('${location.id}')">
            <div class="location-name">${location.name}</div>
            <div class="location-stats">
              <span>${metrics.totalQuotes} quotes</span>
              <span>${Math.round(metrics.winRate)}% win rate</span>
            </div>
          </div>
        `;
        })
        .join('');
    }

    renderMetrics() {
      const container = document.getElementById('metrics-grid');
      if (!container) return;

      const location = this.getActiveLocation();
      if (!location) return;

      const metrics = this.getMetricsForLocation(location.id);

      const cards = [
        {
          label: 'Total Quotes',
          value: metrics.totalQuotes,
          icon: '📊',
          change: metrics.quoteTrend,
          prefix: '',
        },
        {
          label: 'Quote Value',
          value: metrics.totalValue,
          icon: '💰',
          change: null,
          prefix: '$',
          format: true,
        },
        {
          label: 'Win Rate',
          value: metrics.winRate,
          icon: '🎯',
          change: null,
          suffix: '%',
          decimals: 1,
        },
        {
          label: 'Avg Quote',
          value: metrics.avgQuoteValue,
          icon: '📈',
          change: null,
          prefix: '$',
          format: true,
        },
      ];

      container.innerHTML = cards
        .map(card => {
          let displayValue = card.value;

          if (card.decimals !== undefined) {
            displayValue = displayValue.toFixed(card.decimals);
          } else if (card.format) {
            displayValue = this.formatCurrency(displayValue, false);
          }

          const changeHtml =
            card.change !== null && card.change !== undefined
              ? `<div class="metric-change ${card.change >= 0 ? 'positive' : 'negative'}">
              ${card.change >= 0 ? '↑' : '↓'} ${Math.abs(card.change).toFixed(1)}%
            </div>`
              : '';

          return `
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">${card.label}</span>
              <span class="metric-icon">${card.icon}</span>
            </div>
            <div class="metric-value">
              ${card.prefix || ''}${displayValue}${card.suffix || ''}
            </div>
            ${changeHtml}
          </div>
        `;
        })
        .join('');
    }

    renderQuotesTable() {
      const tbody = document.querySelector('#quotes-table tbody');
      if (!tbody) return;

      const location = this.getActiveLocation();
      if (!location) return;

      const quotes = this.getQuotesForLocation(location.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10); // Show last 10

      if (quotes.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">
              No quotes yet for this location. Generate your first quote to get started!
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = quotes
        .map(
          quote => `
        <tr>
          <td><strong>${quote.quoteNumber}</strong></td>
          <td>${quote.customer?.name || 'N/A'}</td>
          <td>${this.getLocationName(quote.locationId)}</td>
          <td>${this.formatCurrency(quote.totals?.grandTotal || 0)}</td>
          <td><span class="status-badge ${quote.status || 'pending'}">${quote.status || 'pending'}</span></td>
          <td>${this.formatDate(quote.createdAt)}</td>
        </tr>
      `
        )
        .join('');
    }

    renderPricingEditor() {
      const container = document.getElementById('pricing-grid');
      if (!container) return;

      const location = this.getActiveLocation();
      if (!location) return;

      const pricing = this.getPricingForLocation(location.id);

      const fields = [
        { key: 'laborRate', label: 'Labor Rate (per hour)', prefix: '$', step: '5' },
        { key: 'tileMarkup', label: 'Tile Markup', prefix: '', suffix: '%', step: '5' },
        { key: 'groutMarkup', label: 'Grout Markup', prefix: '', suffix: '%', step: '5' },
        { key: 'mortarMarkup', label: 'Mortar Markup', prefix: '', suffix: '%', step: '5' },
        { key: 'taxRate', label: 'Sales Tax Rate', prefix: '', suffix: '%', step: '0.1' },
      ];

      container.innerHTML = fields
        .map(field => {
          const value = pricing[field.key] || 0;
          const inputId = `pricing-${field.key}`;

          return `
          <div class="pricing-row">
            <label for="${inputId}">${field.label}</label>
            <div class="input-group">
              ${field.prefix ? `<span class="input-prefix">${field.prefix}</span>` : ''}
              <input 
                type="number" 
                id="${inputId}" 
                data-key="${field.key}"
                value="${value}" 
                step="${field.step}"
                min="0"
              >
            </div>
            <span style="color: var(--color-text-secondary); font-size: 0.875rem;">
              ${field.suffix || ''}
            </span>
            <button class="btn btn-secondary" onclick="window.dashboard.resetPricing('${field.key}')" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;">
              Reset
            </button>
          </div>
        `;
        })
        .join('');
    }

    /**
     * Pricing Actions
     */
    savePricing() {
      const location = this.getActiveLocation();
      if (!location) return;

      const inputs = document.querySelectorAll('#pricing-grid input[data-key]');
      const pricing = {};

      inputs.forEach(input => {
        const key = input.getAttribute('data-key');
        const value = parseFloat(input.value) || 0;
        pricing[key] = value;
      });

      this.setPricingForLocation(location.id, pricing);

      alert(`Pricing updated for ${location.name}!`);
    }

    resetPricing(key) {
      const basePricing = window.TillerProConfig?.pricing || {};
      const input = document.querySelector(`#pricing-${key}`);

      if (input) {
        input.value = basePricing[key] || 0;
      }
    }

    /**
     * Helper Methods
     */
    formatCurrency(amount, showCents = true) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0,
      }).format(amount);

      return formatted;
    }

    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }

    getLocationName(locationId) {
      const location = this.locations.find(loc => loc.id === locationId);
      return location ? location.name : 'Unknown';
    }

    /**
     * Persistence
     */
    loadLocations() {
      try {
        const data = localStorage.getItem('tillerpro_locations');
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error('Failed to load locations:', e);
        return [];
      }
    }

    saveLocations() {
      try {
        localStorage.setItem('tillerpro_locations', JSON.stringify(this.locations));
      } catch (e) {
        console.error('Failed to save locations:', e);
      }
    }

    loadActiveLocation() {
      return localStorage.getItem('tillerpro_active_location') || null;
    }

    saveActiveLocation() {
      localStorage.setItem('tillerpro_active_location', this.activeLocationId);
    }

    loadQuotes() {
      try {
        // Load quotes from QuoteGenerator storage
        const data = localStorage.getItem('tillerpro_quotes');
        const quotes = data ? JSON.parse(data) : [];

        // Ensure each quote has a locationId (default to active location)
        return quotes.map(q => ({
          ...q,
          locationId: q.locationId || this.activeLocationId || 'main',
        }));
      } catch (e) {
        console.error('Failed to load quotes:', e);
        return [];
      }
    }

    loadPricingOverrides() {
      try {
        const data = localStorage.getItem('tillerpro_pricing_overrides');
        return data ? JSON.parse(data) : {};
      } catch (e) {
        console.error('Failed to load pricing overrides:', e);
        return {};
      }
    }

    savePricingOverrides() {
      try {
        localStorage.setItem('tillerpro_pricing_overrides', JSON.stringify(this.pricingOverrides));
      } catch (e) {
        console.error('Failed to save pricing overrides:', e);
      }
    }

    /**
     * Refresh data from other systems
     */
    refresh() {
      this.quotes = this.loadQuotes();
      this.renderMetrics();
      this.renderQuotesTable();
      console.log('[Dashboard] Refreshed');
    }
  }

  /**
   * Modal Functions (global scope for inline onclick handlers)
   */
  window.openAddLocationModal = function () {
    const modal = document.getElementById('add-location-modal');
    modal.classList.add('active');
  };

  window.closeAddLocationModal = function () {
    const modal = document.getElementById('add-location-modal');
    modal.classList.remove('active');

    // Clear form
    document.getElementById('location-name').value = '';
    document.getElementById('location-address').value = '';
    document.getElementById('location-manager').value = '';
    document.getElementById('location-phone').value = '';
  };

  window.addLocation = function () {
    const name = document.getElementById('location-name').value.trim();

    if (!name) {
      alert('Location name is required.');
      return;
    }

    const data = {
      name,
      address: document.getElementById('location-address').value.trim(),
      manager: document.getElementById('location-manager').value.trim(),
      phone: document.getElementById('location-phone').value.trim(),
    };

    window.dashboard.addLocation(data);
    window.closeAddLocationModal();
  };

  window.savePricing = function () {
    window.dashboard.savePricing();
  };

  // Initialize dashboard
  window.dashboard = new DashboardManager();

  console.log('[Dashboard Manager] Loaded and initialized');
})();
