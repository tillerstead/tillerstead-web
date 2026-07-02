/**
 * Professional Contact Form Handler
 * Handles submission with success messaging and email notifications
 */

(function () {
  'use strict';

  const FORM_CONFIG = {
    formSelector: 'form[name="contact"]',
    endpoint: '/api/contact',
    successMessage: {
      title: 'Message Sent Successfully!',
      body: "Thank you for contacting Tillerstead. We've received your inquiry and will respond within 48 hours. If you don't hear from us, please text us at (609) 862-8808 to confirm we received your message.",
      confirmationSent: 'Your request is now in our delivery queue.',
    },
    errorMessage: {
      title: 'Submission Error',
      body: 'We could not confirm delivery yet. Your request has been saved in this browser and can be retried without losing details.',
    },
  };

  function showMessage(type, title, body, extra = '') {
    const container = document.createElement('div');
    container.className = `form-message form-message--${type}`;
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');

    container.innerHTML = `
      <div class="form-message__content">
        <h3 class="form-message__title">${title}</h3>
        <p class="form-message__body">${body}</p>
        ${extra ? `<p class="form-message__extra">${extra}</p>` : ''}
        <button type="button" class="form-message__close" aria-label="Close message">×</button>
      </div>
    `;

    // Add close functionality
    container.querySelector('.form-message__close').addEventListener('click', () => {
      container.remove();
    });

    return container;
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateForm(formData) {
    const errors = [];

    if (!formData.get('name')?.trim()) {
      errors.push('Name is required');
    }

    const email = formData.get('email');
    if (!email?.trim()) {
      errors.push('Email is required');
    } else if (!validateEmail(email)) {
      errors.push('Please enter a valid email address');
    }

    if (!formData.get('message')?.trim()) {
      errors.push('Project details are required');
    }

    return errors;
  }

  function formDataToPayload(formData) {
    return {
      name: (formData.get('name') || '').toString(),
      email: (formData.get('email') || '').toString(),
      phone: (formData.get('phone') || '').toString(),
      project_type: (formData.get('project_type') || '').toString(),
      message: (formData.get('message') || '').toString(),
      source: (formData.get('source') || 'tillerstead').toString(),
      _submitted_at: new Date().toISOString(),
    };
  }

  function readQueue() {
    try {
      const raw = localStorage.getItem('tillerstead-contact-queue-v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeQueue(queue) {
    localStorage.setItem('tillerstead-contact-queue-v1', JSON.stringify(queue.slice(-30)));
  }

  function queueSubmission(payload) {
    const queue = readQueue();
    queue.push({ payload, queuedAt: new Date().toISOString() });
    writeQueue(queue);
  }

  async function flushQueuedSubmissions() {
    const queue = readQueue();
    if (!queue.length) return;

    const remaining = [];
    for (const item of queue) {
      try {
        const res = await fetch(FORM_CONFIG.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(item.payload),
        });

        if (!res.ok) {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    writeQueue(remaining);
  }

  async function submitForm(formData) {
    const payload = formDataToPayload(formData);

    try {
      const response = await fetch(FORM_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, method: 'internal-api' };
      }

      if (response.status >= 500 || response.status === 429) {
        queueSubmission(payload);
        return { success: false, queued: true };
      }

      const data = await response.json().catch(() => null);
      const message = data?.message || data?.error || 'We could not confirm delivery yet.';
      return { success: false, message };
    } catch {
      queueSubmission(payload);
      return { success: false, queued: true };
    }
  }

  function initContactForm() {
    const form = document.querySelector(FORM_CONFIG.formSelector);
    if (!form) return;

    flushQueuedSubmissions();

    form.addEventListener('submit', async e => {
      e.preventDefault();

      // Remove any existing messages
      document.querySelectorAll('.form-message').forEach(msg => msg.remove());

      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn?.textContent;

      // Validate
      const errors = validateForm(formData);
      if (errors.length > 0) {
        const errorMsg = showMessage('error', 'Please Fix These Errors', errors.join('. '));
        form.insertBefore(errorMsg, form.firstChild);
        return;
      }

      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        const result = await submitForm(formData);

        if (result.success) {
          const successMsg = showMessage(
            'success',
            FORM_CONFIG.successMessage.title,
            FORM_CONFIG.successMessage.body,
            FORM_CONFIG.successMessage.confirmationSent
          );

          form.insertBefore(successMsg, form.firstChild);
          form.reset();
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

          setTimeout(() => {
            if (window.location.pathname !== '/success/') {
              window.location.href = '/success/';
            }
          }, 3000);
        } else {
          const fallbackText = result.queued
            ? 'Your request has been saved for retry in this browser. You can submit again at any time.'
            : result.message || FORM_CONFIG.errorMessage.body;
          const errorMsg = showMessage('error', FORM_CONFIG.errorMessage.title, fallbackText);
          form.insertBefore(errorMsg, form.firstChild);
          errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.error('Form submission error:', error);

        const errorMsg = showMessage(
          'error',
          FORM_CONFIG.errorMessage.title,
          FORM_CONFIG.errorMessage.body
        );

        form.insertBefore(errorMsg, form.firstChild);
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } finally {
        // Restore button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });

    // Add loading styles if not present
    if (!document.querySelector('#form-handler-styles')) {
      const styles = document.createElement('style');
      styles.id = 'form-handler-styles';
      styles.textContent = `
        .form-message {
          padding: 1.5rem;
          border-radius: var(--ts-radius-md, 8px);
          margin-bottom: 1.5rem;
          position: relative;
          animation: slideIn 0.3s ease-out;
        }

        .form-message--success {
          background: var(--ts-color-success-soft, #d4edda);
          border: 2px solid var(--ts-color-success, #28a745);
          color: var(--ts-color-success-strong, #155724);
        }

        .form-message--error {
          background: var(--ts-color-error-soft, #f8d7da);
          border: 2px solid var(--ts-color-error, #dc3545);
          color: var(--ts-color-error-strong, #721c24);
        }

        .form-message__title {
          margin: 0 0 0.5rem;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .form-message__body {
          margin: 0 0 0.5rem;
          line-height: 1.6;
        }

        .form-message__extra {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .form-message__close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: transparent;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .form-message__close:hover {
          opacity: 1;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        button[type="submit"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
