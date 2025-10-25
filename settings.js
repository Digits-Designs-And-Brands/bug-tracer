/**
 * Settings page script for Bug Tracer extension
 * Handles multiple upload provider configuration
 */

class BugTracerSettings {
  constructor() {
    this.uploadManager = new UploadManager();
    this.currentProvider = null;
    this.initializeElements();
    this.setupEventListeners();
    this.initializeProviders();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.backLink = document.getElementById('backLink');
    this.providerSelect = document.getElementById('providerSelect');
    this.providerForm = document.getElementById('providerForm');
    this.providerFields = document.getElementById('providerFields');
    this.testConnectionBtn = document.getElementById('testConnection');
    this.saveConfigBtn = document.getElementById('saveConfig');
    this.statusIndicator = document.getElementById('statusIndicator');
    this.testResults = document.getElementById('testResults');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.backLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.goBack();
    });

    this.providerSelect.addEventListener('change', (e) => {
      this.onProviderChange(e.target.value);
    });

    this.providerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveConfiguration();
    });

    this.testConnectionBtn.addEventListener('click', () => {
      this.testConnection();
    });
  }

  /**
   * Initialize available providers
   */
  async initializeProviders() {
    try {
      // Load current provider from storage
      await this.uploadManager.loadCurrentProvider();
      
      // Populate provider select
      const providers = this.uploadManager.getAvailableProviders();
      this.providerSelect.innerHTML = '<option value="">Select a provider...</option>';
      
      providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = provider.name;
        this.providerSelect.appendChild(option);
      });

      // Set current provider if available
      const currentProviderId = this.uploadManager.getCurrentProviderId();
      if (currentProviderId) {
        this.providerSelect.value = currentProviderId;
        await this.onProviderChange(currentProviderId);
      }

    } catch (error) {
      console.error('Failed to initialize providers:', error);
      this.showTestResults('Failed to initialize providers', 'error');
    }
  }

  /**
   * Handle provider selection change
   */
  async onProviderChange(providerId) {
    if (!providerId) {
      this.providerForm.style.display = 'none';
      this.currentProvider = null;
      return;
    }

    try {
      this.currentProvider = providerId;
      await this.uploadManager.setCurrentProvider(providerId);
      
      // Get provider schema and render form
      const schema = await this.uploadManager.getCurrentProviderSchema();
      this.renderProviderForm(schema);
      
      // Load existing configuration
      await this.loadCurrentConfig();
      
      this.providerForm.style.display = 'block';
      this.updateStatusIndicator();
      
    } catch (error) {
      console.error('Failed to change provider:', error);
      this.showTestResults('Failed to load provider configuration', 'error');
    }
  }

  /**
   * Render provider configuration form
   */
  renderProviderForm(schema) {
    this.providerFields.innerHTML = '';
    
    schema.fields.forEach(field => {
      const fieldGroup = document.createElement('div');
      fieldGroup.className = 'form-group';
      
      const label = document.createElement('label');
      label.className = 'form-label';
      label.setAttribute('for', field.id);
      label.textContent = field.label;
      if (field.required) {
        label.textContent += ' *';
      }
      
      let input;
      if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-input';
        input.id = field.id;
        input.required = field.required;
        
        field.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          input.appendChild(optionElement);
        });
      } else if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'form-input';
        input.id = field.id;
        input.required = field.required;
        input.rows = 3;
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
        input.className = 'form-input';
        input.id = field.id;
        input.required = field.required;
      }
      
      if (field.placeholder) {
        input.placeholder = field.placeholder;
      }
      
      const help = document.createElement('div');
      help.className = 'form-help';
      help.textContent = field.help;
      
      fieldGroup.appendChild(label);
      fieldGroup.appendChild(input);
      fieldGroup.appendChild(help);
      
      this.providerFields.appendChild(fieldGroup);
    });
  }

  /**
   * Load current configuration
   */
  async loadCurrentConfig() {
    if (!this.currentProvider) return;

    try {
      const config = await this.uploadManager.getCurrentProviderConfig();
      
      // Populate form fields
      Object.entries(config).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = value;
          } else {
            input.value = value;
          }
        }
      });
      
      this.updateStatusIndicator();
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  /**
   * Save configuration
   */
  async saveConfiguration() {
    if (!this.currentProvider) {
      this.showTestResults('Please select a provider first', 'error');
      return;
    }

    try {
      const formData = new FormData(this.providerForm);
      const config = {};
      
      // Collect form data
      for (const [key, value] of formData.entries()) {
        config[key] = value;
      }
      
      // Handle special fields
      const textareaFields = this.providerFields.querySelectorAll('textarea');
      textareaFields.forEach(textarea => {
        if (textarea.value.trim()) {
          try {
            config[textarea.id] = JSON.parse(textarea.value);
          } catch (e) {
            config[textarea.id] = textarea.value;
          }
        }
      });

      // Save configuration
      await this.uploadManager.updateCurrentProviderConfig(config);
      await this.uploadManager.saveCurrentProvider(this.currentProvider);
      
      this.showTestResults('Configuration saved successfully!', 'success');
      this.updateStatusIndicator();
      
      // Auto-test connection after saving
      setTimeout(() => {
        this.testConnection();
      }, 1000);

    } catch (error) {
      console.error('Failed to save configuration:', error);
      this.showTestResults('Failed to save configuration: ' + error.message, 'error');
    }
  }

  /**
   * Test provider connection
   */
  async testConnection() {
    if (!this.currentProvider) {
      this.showTestResults('Please select and configure a provider first', 'error');
      return;
    }

    try {
      this.testConnectionBtn.disabled = true;
      this.testConnectionBtn.textContent = 'Testing...';
      this.hideTestResults();

      // Save current form data first
      await this.saveConfiguration();
      
      // Test connection
      const result = await this.uploadManager.testCurrentProvider();
      
      if (result.success) {
        this.showTestResults(result.message, 'success');
        this.updateStatusIndicator(true);
      } else {
        this.showTestResults(result.message, 'error');
        this.updateStatusIndicator(false);
      }

    } catch (error) {
      console.error('Connection test failed:', error);
      this.showTestResults('Connection test failed: ' + error.message, 'error');
      this.updateStatusIndicator(false);
    } finally {
      this.testConnectionBtn.disabled = false;
      this.testConnectionBtn.textContent = 'Test Connection';
    }
  }

  /**
   * Update status indicator
   */
  async updateStatusIndicator(isConnected = null) {
    if (isConnected === null) {
      try {
        const configured = await this.uploadManager.isCurrentProviderConfigured();
        this.statusIndicator.className = `status-indicator ${configured ? 'connected' : 'disconnected'}`;
      } catch (error) {
        this.statusIndicator.className = 'status-indicator disconnected';
      }
    } else {
      this.statusIndicator.className = `status-indicator ${isConnected ? 'connected' : 'disconnected'}`;
    }
  }

  /**
   * Show test results
   */
  showTestResults(message, type) {
    this.testResults.textContent = message;
    this.testResults.className = `test-results ${type}`;
    this.testResults.style.display = 'block';
  }

  /**
   * Hide test results
   */
  hideTestResults() {
    this.testResults.style.display = 'none';
  }

  /**
   * Go back to extension popup
   */
  goBack() {
    // Try to close the current tab and focus on the extension
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.remove(tabs[0].id);
      }
    });
  }
}

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BugTracerSettings();
});