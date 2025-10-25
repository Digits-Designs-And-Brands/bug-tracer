/**
 * All Upload Providers - Dynamic Loader
 * This file dynamically loads all provider files in the correct order
 * and provides a single entry point for all upload providers
 */

(function() {
  'use strict';
  
  console.log('📦 Loading all upload providers...');
  
  // Provider files in loading order (base provider must be first)
  const PROVIDER_FILES = [
    'base-provider.js',
    'cloudinary-provider.js',
    'aws-s3-provider.js',
    'generic-http-provider.js'
  ];
  
  // Provider class names that should be available after loading
  const PROVIDER_CLASSES = [
    'BaseUploadProvider',
    'CloudinaryProvider',
    'AWSS3Provider',
    'GenericHTTPProvider'
  ];
  
  let loadedCount = 0;
  const totalFiles = PROVIDER_FILES.length;
  
  /**
   * Load a single provider file
   */
  function loadProviderFile(filename) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `upload-providers/${filename}`;
      script.onload = () => {
        loadedCount++;
        console.log(`✅ Loaded ${filename} (${loadedCount}/${totalFiles})`);
        resolve();
      };
      script.onerror = () => {
        console.error(`❌ Failed to load ${filename}`);
        reject(new Error(`Failed to load ${filename}`));
      };
      document.head.appendChild(script);
    });
  }
  
  /**
   * Load all provider files sequentially
   */
  async function loadAllProviders() {
    try {
      for (const filename of PROVIDER_FILES) {
        await loadProviderFile(filename);
      }
      
      // Verify all providers are loaded
      setTimeout(() => {
        const missing = PROVIDER_CLASSES.filter(provider => typeof window[provider] === 'undefined');
        if (missing.length === 0) {
          console.log('🎉 All upload providers loaded successfully!');
        } else {
          console.warn('⚠️ Missing providers:', missing);
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error loading providers:', error);
    }
  }
  
  /**
   * Upload Providers Manager
   */
  window.UploadProvidersManager = {
    files: PROVIDER_FILES,
    classes: PROVIDER_CLASSES,
    
    isLoaded() {
      return PROVIDER_CLASSES.every(provider => typeof window[provider] !== 'undefined');
    },
    
    getLoaded() {
      return PROVIDER_CLASSES.filter(provider => typeof window[provider] !== 'undefined');
    },
    
    getMissing() {
      return PROVIDER_CLASSES.filter(provider => typeof window[provider] === 'undefined');
    },
    
    verify() {
      if (this.isLoaded()) {
        console.log('✅ All upload providers verified');
        return true;
      } else {
        console.warn('⚠️ Missing providers:', this.getMissing());
        return false;
      }
    },
    
    get(name) {
      return window[name] || null;
    }
  };
  
  // Start loading all providers
  loadAllProviders();
  
})();
