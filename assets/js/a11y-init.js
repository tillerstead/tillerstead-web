/**
 * ACCESSIBILITY INITIALIZATION
 * Simple, fast initialization for a11y features
 * Runs immediately to avoid FOUC
 */

(function () {
  'use strict';

  // Get stored preferences
  const prefs = getPrefs();

  // Apply preferences immediately (before render)
  applyPreferences(prefs);

  // Initialize features when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initA11yFeatures);
  } else {
    initA11yFeatures();
  }

  /**
   * Get user accessibility preferences from storage
   */
  function getPrefs() {
    try {
      return JSON.parse(localStorage.getItem('tillerstead-a11y-prefs') || '{}');
    } catch (_e) {
      return {};
    }
  }

  /**
   * Save preferences to storage
   */
  function savePrefs(prefs) {
    try {
      localStorage.setItem('tillerstead-a11y-prefs', JSON.stringify(prefs));
    } catch (_e) {
      console.warn('[A11Y] Could not save preferences');
    }
  }

  /**
   * Apply preferences to document
   */
  function applyPreferences(prefs) {
    const html = document.documentElement;

    // High contrast mode
    if (prefs.highContrast) {
      html.setAttribute('data-high-contrast', 'true');
    }

    // Text size
    if (prefs.textSize) {
      html.setAttribute('data-text-size', prefs.textSize);
    }

    // Custom cursor
    if (prefs.customCursor) {
      html.setAttribute('data-custom-cursor', 'true');
    }

    // Dyslexia font
    if (prefs.dyslexiaFont) {
      html.setAttribute('data-dyslexia-font', 'true');
    }

    // Reading guide
    if (prefs.readingGuide) {
      html.setAttribute('data-reading-guide', 'true');
    }
  }

  /**
   * Initialize accessibility features
   */
  function initA11yFeatures() {
    // Expose global toggle functions
    window.a11yToggleHighContrast = toggleHighContrast;
    window.a11yToggleTextSize = toggleTextSize;
    window.a11yToggleCustomCursor = toggleCustomCursor;
    window.a11yToggleDyslexiaFont = toggleDyslexiaFont;
    window.a11yToggleReadingGuide = toggleReadingGuide;
    window.a11yToggleTextToSpeech = toggleTextToSpeech;
    window.a11yStopReading = stopReading;

    // Add keyboard shortcuts
    initKeyboardShortcuts();

    // Enhance form accessibility
    enhanceForms();

    // Add ARIA live regions
    addLiveRegions();

    console.log('[A11Y] Accessibility features initialized');
  }

  /**
   * Toggle high contrast mode
   */
  function toggleHighContrast() {
    const prefs = getPrefs();
    prefs.highContrast = !prefs.highContrast;
    savePrefs(prefs);

    if (prefs.highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
      announce('High contrast mode enabled');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
      announce('High contrast mode disabled');
    }

    updateButtonState('a11y-contrast', prefs.highContrast);
  }

  /**
   * Toggle text size
   */
  function toggleTextSize() {
    const prefs = getPrefs();
    const sizes = ['normal', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(prefs.textSize || 'normal');
    const nextIndex = (currentIndex + 1) % sizes.length;
    prefs.textSize = sizes[nextIndex];
    savePrefs(prefs);

    document.documentElement.setAttribute('data-text-size', prefs.textSize);
    announce(`Text size: ${prefs.textSize}`);
    updateButtonState('a11y-textsize', prefs.textSize !== 'normal');
  }

  /**
   * Toggle custom cursor
   */
  function toggleCustomCursor() {
    const prefs = getPrefs();
    prefs.customCursor = !prefs.customCursor;
    savePrefs(prefs);

    if (prefs.customCursor) {
      document.documentElement.setAttribute('data-custom-cursor', 'true');
      announce('Large cursor enabled');
    } else {
      document.documentElement.removeAttribute('data-custom-cursor');
      announce('Large cursor disabled');
    }

    updateButtonState('a11y-cursor', prefs.customCursor);
  }

  /**
   * Toggle dyslexia-friendly font
   */
  function toggleDyslexiaFont() {
    const prefs = getPrefs();
    prefs.dyslexiaFont = !prefs.dyslexiaFont;
    savePrefs(prefs);

    if (prefs.dyslexiaFont) {
      document.documentElement.setAttribute('data-dyslexia-font', 'true');
      announce('Dyslexia-friendly font enabled');
    } else {
      document.documentElement.removeAttribute('data-dyslexia-font');
      announce('Dyslexia-friendly font disabled');
    }
  }

  /**
   * Toggle reading guide
   */
  function toggleReadingGuide() {
    const prefs = getPrefs();
    prefs.readingGuide = !prefs.readingGuide;
    savePrefs(prefs);

    if (prefs.readingGuide) {
      document.documentElement.setAttribute('data-reading-guide', 'true');
      initReadingGuide();
      announce('Reading guide enabled');
    } else {
      document.documentElement.removeAttribute('data-reading-guide');
      removeReadingGuide();
      announce('Reading guide disabled');
    }
  }

  /**
   * Toggle text-to-speech
   */
  function toggleTextToSpeech() {
    if (window.speechSynthesis.speaking) {
      stopReading();
    } else {
      startReading();
    }
  }

  /**
   * Start reading content aloud
   */
  function startReading() {
    if (!window.speechSynthesis) {
      announce('Text-to-speech not available');
      return;
    }

    // Get main content
    const main = document.querySelector('.ts-main-content, main, [role="main"]');
    if (!main) return;

    const text = main.textContent.trim();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
    document.documentElement.setAttribute('data-tts-active', 'true');
    announce('Reading content');
  }

  /**
   * Stop reading
   */
  function stopReading() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      document.documentElement.removeAttribute('data-tts-active');
      announce('Stopped reading');
    }
  }

  /**
   * Initialize reading guide
   */
  function initReadingGuide() {
    const guide = document.createElement('div');
    guide.id = 'reading-guide';
    guide.className = 'reading-guide';
    guide.setAttribute('aria-hidden', 'true');
    document.body.appendChild(guide);

    document.addEventListener('mousemove', updateReadingGuide);
  }

  /**
   * Update reading guide position
   */
  function updateReadingGuide(e) {
    const guide = document.getElementById('reading-guide');
    if (guide) {
      guide.style.top = `${e.clientY}px`;
    }
  }

  /**
   * Remove reading guide
   */
  function removeReadingGuide() {
    const guide = document.getElementById('reading-guide');
    if (guide) {
      guide.remove();
      document.removeEventListener('mousemove', updateReadingGuide);
    }
  }

  /**
   * Update button aria-pressed state
   */
  function updateButtonState(buttonId, pressed) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.setAttribute('aria-pressed', String(pressed));
    }
  }

  /**
   * Announce to screen readers
   */
  function announce(message) {
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) {
      announcer.textContent = message;
    }
  }

  /**
   * Add ARIA live regions
   */
  function addLiveRegions() {
    // Screen reader announcer
    const announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }

  /**
   * Initialize keyboard shortcuts
   */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Alt+A: Open accessibility toolbar
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        const toggle = document.getElementById('a11y-toolbar-toggle');
        if (toggle) toggle.click();
      }

      // Alt+C: Toggle high contrast
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        toggleHighContrast();
      }

      // Alt+T: Toggle text size
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        toggleTextSize();
      }

      // Alt+R: Toggle reading
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        toggleTextToSpeech();
      }

      // Alt+H: Show keyboard help
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        if (window.showKeyboardHelp) {
          window.showKeyboardHelp();
        }
      }
    });
  }

  /**
   * Enhance form accessibility
   */
  function enhanceForms() {
    // Add aria-required to required fields
    document
      .querySelectorAll('input[required], select[required], textarea[required]')
      .forEach(field => {
        field.setAttribute('aria-required', 'true');
      });

    // Link errors to fields
    document.querySelectorAll('.form-error, [role="alert"]').forEach(error => {
      const field = error.previousElementSibling;
      if (
        field &&
        (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA')
      ) {
        const errorId = error.id || `error-${Math.random().toString(36).substr(2, 9)}`;
        error.id = errorId;

        const describedBy = field.getAttribute('aria-describedby');
        field.setAttribute('aria-describedby', describedBy ? `${describedBy} ${errorId}` : errorId);
        field.setAttribute('aria-invalid', 'true');
      }
    });
  }
})();
