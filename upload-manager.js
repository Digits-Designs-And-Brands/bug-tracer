/**
 * Upload Manager
 * Manages multiple upload providers and handles provider selection
 */

class UploadManager {
  constructor() {
    this.providers = new Map();
    this.currentProvider = null;
    this.initializeProviders();
  }

  /**
   * Initialize available providers
   */
  initializeProviders() {
    // Register Cloudinary provider
    if (typeof CloudinaryProvider !== 'undefined') {
      this.providers.set('cloudinary', CloudinaryProvider);
    }

    // Register AWS S3 provider
    if (typeof AWSS3Provider !== 'undefined') {
      this.providers.set('aws-s3', AWSS3Provider);
    }

    // Register Generic HTTP provider
    if (typeof GenericHTTPProvider !== 'undefined') {
      this.providers.set('generic-http', GenericHTTPProvider);
    }
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys()).map(id => ({
      id,
      name: this.providers.get(id).name || id,
      class: this.providers.get(id)
    }));
  }

  /**
   * Set current provider
   */
  setCurrentProvider(providerId) {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} not found`);
    }
    this.currentProvider = providerId;
  }

  /**
   * Get current provider instance
   */
  async getCurrentProvider() {
    if (!this.currentProvider) {
      throw new Error('No provider selected');
    }

    const ProviderClass = this.providers.get(this.currentProvider);
    if (!ProviderClass) {
      throw new Error(`Provider ${this.currentProvider} not found`);
    }

    // Load configuration from storage
    const config = await this.loadProviderConfig(this.currentProvider);
    return new ProviderClass(config);
  }

  /**
   * Load provider configuration from Chrome storage
   */
  async loadProviderConfig(providerId) {
    return new Promise((resolve) => {
      chrome.storage.sync.get([`${providerId}Config`], (result) => {
        resolve(result[`${providerId}Config`] || {});
      });
    });
  }

  /**
   * Save provider configuration to Chrome storage
   */
  async saveProviderConfig(providerId, config) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [`${providerId}Config`]: config }, () => {
        resolve();
      });
    });
  }

  /**
   * Get current provider configuration
   */
  async getCurrentProviderConfig() {
    if (!this.currentProvider) {
      return {};
    }
    return await this.loadProviderConfig(this.currentProvider);
  }

  /**
   * Update current provider configuration
   */
  async updateCurrentProviderConfig(config) {
    if (!this.currentProvider) {
      throw new Error('No provider selected');
    }
    return await this.saveProviderConfig(this.currentProvider, config);
  }

  /**
   * Upload recording using current provider
   */
  async uploadRecording(recording, onProgress = null) {
    const provider = await this.getCurrentProvider();
    return await provider.uploadRecording(recording, onProgress);
  }

  /**
   * Test current provider connection
   */
  async testCurrentProvider() {
    const provider = await this.getCurrentProvider();
    return await provider.testConnection();
  }

  /**
   * Get current provider configuration schema
   */
  async getCurrentProviderSchema() {
    const provider = await this.getCurrentProvider();
    return provider.getConfigSchema();
  }

  /**
   * Validate current provider configuration
   */
  async validateCurrentProviderConfig() {
    const provider = await this.getCurrentProvider();
    return provider.validateConfig();
  }

  /**
   * Check if current provider is configured
   */
  async isCurrentProviderConfigured() {
    try {
      const provider = await this.getCurrentProvider();
      return provider.isConfigured();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get provider configuration status
   */
  async getProviderStatus(providerId) {
    try {
      const config = await this.loadProviderConfig(providerId);
      const ProviderClass = this.providers.get(providerId);
      if (!ProviderClass) {
        return { configured: false, error: 'Provider not found' };
      }

      const provider = new ProviderClass(config);
      return {
        configured: provider.isConfigured(),
        config: config,
        schema: provider.getConfigSchema()
      };
    } catch (error) {
      return { configured: false, error: error.message };
    }
  }

  /**
   * Get all providers status
   */
  async getAllProvidersStatus() {
    const status = {};
    for (const providerId of this.providers.keys()) {
      status[providerId] = await this.getProviderStatus(providerId);
    }
    return status;
  }

  /**
   * Register a new provider
   */
  registerProvider(id, providerClass) {
    this.providers.set(id, providerClass);
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(id) {
    this.providers.delete(id);
    if (this.currentProvider === id) {
      this.currentProvider = null;
    }
  }

  /**
   * Get current provider ID
   */
  getCurrentProviderId() {
    return this.currentProvider;
  }

  /**
   * Set current provider from storage
   */
  async loadCurrentProvider() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['currentProvider'], (result) => {
        if (result.currentProvider && this.providers.has(result.currentProvider)) {
          this.currentProvider = result.currentProvider;
        }
        resolve(this.currentProvider);
      });
    });
  }

  /**
   * Save current provider to storage
   */
  async saveCurrentProvider(providerId) {
    this.setCurrentProvider(providerId);
    return new Promise((resolve) => {
      chrome.storage.sync.set({ currentProvider: providerId }, () => {
        resolve();
      });
    });
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UploadManager;
} else {
  window.UploadManager = UploadManager;
}
