/**
 * Cloudinary upload provider
 * Extends BaseUploadProvider for Cloudinary integration
 */

class CloudinaryProvider extends BaseUploadProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'Cloudinary';
    this.cloudName = config.cloudName || null;
    this.uploadPreset = config.uploadPreset || null;
    this.apiKey = config.apiKey || null;
  }

  /**
   * Load Cloudinary configuration from Chrome storage
   */
  async loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['cloudinaryConfig'], (result) => {
        const config = result.cloudinaryConfig || {};
        this.cloudName = config.cloudName;
        this.uploadPreset = config.uploadPreset;
        this.apiKey = config.apiKey;
        resolve(config);
      });
    });
  }

  /**
   * Save Cloudinary configuration to Chrome storage
   */
  async saveConfig(config) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ cloudinaryConfig: config }, () => {
        this.cloudName = config.cloudName;
        this.uploadPreset = config.uploadPreset;
        this.apiKey = config.apiKey;
        resolve();
      });
    });
  }

  /**
   * Validate provider configuration
   */
  validateConfig() {
    const errors = [];
    if (!this.cloudName) errors.push('Cloud Name is required');
    if (!this.uploadPreset) errors.push('Upload Preset is required');
    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if Cloudinary is properly configured
   */
  isConfigured() {
    return this.validateConfig().valid;
  }

  /**
   * Upload a video blob to Cloudinary
   * @param {Blob} videoBlob - The video blob to upload
   * @param {Object} metadata - Additional metadata for the upload
   * @param {Function} onProgress - Progress callback function
   */
  async uploadVideo(videoBlob, metadata = {}, onProgress = null) {
    await this.loadConfig();

    if (!this.isConfigured()) {
      throw new Error('Cloudinary not configured. Please set cloud name and upload preset.');
    }

    const formData = new FormData();
    formData.append('file', videoBlob);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('cloud_name', this.cloudName);
    
    // Add metadata
    if (metadata.title) {
      formData.append('public_id', `bug-tracer/${Date.now()}-${metadata.title.replace(/[^a-zA-Z0-9]/g, '-')}`);
    }
    
    if (metadata.tags) {
      formData.append('tags', metadata.tags.join(','));
    }

    // Add resource type for video
    formData.append('resource_type', 'video');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              publicId: response.public_id,
              format: response.format,
              size: response.bytes,
              duration: response.duration
            });
          } catch (error) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      // Set timeout to 5 minutes for large video files
      xhr.timeout = 300000;

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`);
      xhr.send(formData);
    });
  }

  /**
   * Test connection to Cloudinary
   */
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary not configured');
    }

    try {
      // Create a small test blob
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      
      // Try to upload test file
      const result = await this.uploadVideo(testBlob, {
        title: 'bug-tracer-test',
        tags: ['bug-tracer', 'test']
      });

      if (result.url) {
        // Clean up test file
        try {
          await this.deleteFile(result.publicId);
        } catch (deleteError) {
          console.log('Could not delete test file (this is normal)');
        }
        
        return { success: true, message: 'Connection successful' };
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete a video from Cloudinary
   * @param {string} publicId - The public ID of the video to delete
   */
  async deleteVideo(publicId) {
    await this.loadConfig();

    if (!this.isConfigured()) {
      throw new Error('Cloudinary not configured');
    }

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('cloud_name', this.cloudName);
    formData.append('api_key', this.apiKey);
    formData.append('timestamp', Math.round(Date.now() / 1000));

    // Generate signature (simplified - in production, use server-side signing)
    const signature = await this.generateSignature(publicId, formData.get('timestamp'));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Delete failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during delete'));
      });

      formData.append('signature', signature);
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/video/destroy`);
      xhr.send(formData);
    });
  }

  /**
   * Generate signature for Cloudinary API calls
   * Note: In production, this should be done server-side for security
   */
  async generateSignature(publicId, timestamp) {
    // This is a simplified version - in production, use proper HMAC-SHA1
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${this.apiKey || ''}`;
    return btoa(stringToSign);
  }

  /**
   * Get provider configuration schema for UI
   */
  getConfigSchema() {
    return {
      name: this.name,
      fields: [
        {
          id: 'cloudName',
          label: 'Cloud Name',
          type: 'text',
          required: true,
          placeholder: 'your-cloud-name',
          help: 'Your Cloudinary cloud name (found in your Cloudinary dashboard)'
        },
        {
          id: 'uploadPreset',
          label: 'Upload Preset',
          type: 'text',
          required: true,
          placeholder: 'your-upload-preset',
          help: 'Your Cloudinary upload preset (create one in Settings > Upload)'
        },
        {
          id: 'apiKey',
          label: 'API Key (Optional)',
          type: 'text',
          required: false,
          placeholder: 'your-api-key',
          help: 'Required only for deleting videos from Cloudinary'
        }
      ]
    };
  }

  /**
   * Get Cloudinary configuration status
   */
  async getConfigStatus() {
    await this.loadConfig();
    return {
      configured: this.isConfigured(),
      cloudName: this.cloudName,
      uploadPreset: this.uploadPreset,
      hasApiKey: !!this.apiKey
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CloudinaryProvider;
} else {
  window.CloudinaryProvider = CloudinaryProvider;
}
