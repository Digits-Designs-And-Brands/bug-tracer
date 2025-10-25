/**
 * Upload Providers Index
 * Centralized management for all upload providers
 * 
 * This file provides a single entry point for all upload providers
 * and ensures they are loaded in the correct order.
 */

// Provider loading order (base provider must be first)
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

/**
 * Verify that all required providers are loaded
 * @returns {boolean} True if all providers are loaded
 */
function verifyProviders() {
  const missing = PROVIDER_CLASSES.filter(provider => typeof window[provider] === 'undefined');
  
  if (missing.length > 0) {
    console.warn('Missing upload providers:', missing);
    return false;
  }
  
  console.log('✅ All upload providers loaded successfully');
  return true;
}

/**
 * Get list of available providers
 * @returns {Array} Array of provider class names that are loaded
 */
function getAvailableProviders() {
  return PROVIDER_CLASSES.filter(provider => typeof window[provider] !== 'undefined');
}

/**
 * Get provider class by name
 * @param {string} providerName - Name of the provider class
 * @returns {Function|null} Provider class constructor or null if not found
 */
function getProvider(providerName) {
  return window[providerName] || null;
}

// Make utility functions available globally
if (typeof window !== 'undefined') {
  window.UploadProviders = {
    verify: verifyProviders,
    getAvailable: getAvailableProviders,
    get: getProvider,
    list: PROVIDER_CLASSES,
    files: PROVIDER_FILES
  };
  
  // Verify providers are loaded when this script runs
  setTimeout(verifyProviders, 100);
}

console.log('📦 Upload providers index loaded');
