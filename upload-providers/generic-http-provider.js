/**
 * Generic HTTP upload provider
 * Extends BaseUploadProvider for custom HTTP endpoints
 */

class GenericHTTPProvider extends BaseUploadProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'Generic HTTP';
    this.endpoint = config.endpoint || null;
    this.apiKey = config.apiKey || null;
    this.headers = config.headers || {};
    this.method = config.method || 'POST';
    this.fieldName = config.fieldName || 'file';
  }

  /**
   * Validate provider configuration
   */
  validateConfig() {
    const errors = [];
    if (!this.endpoint) errors.push('Endpoint URL is required');
    if (!this.endpoint.startsWith('http')) errors.push('Endpoint must be a valid HTTP/HTTPS URL');
    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if provider is properly configured
   */
  isConfigured() {
    return this.validateConfig().valid;
  }

  /**
   * Upload a video blob to generic HTTP endpoint
   */
  async uploadVideo(videoBlob, metadata = {}, onProgress = null) {
    if (!this.isConfigured()) {
      throw new Error('Generic HTTP provider not configured');
    }

    const formData = new FormData();
    formData.append(this.fieldName, videoBlob, this.generateFilename(metadata.title || 'bug-tracer', 'webm'));

    // Add metadata as form fields
    if (metadata.title) {
      formData.append('title', metadata.title);
    }
    if (metadata.tags) {
      formData.append('tags', metadata.tags.join(','));
    }
    if (metadata.timestamp) {
      formData.append('timestamp', metadata.timestamp.toString());
    }

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
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            resolve({
              url: response.url || response.link || response.data?.url,
              id: response.id || response.fileId,
              size: videoBlob.size,
              response: response
            });
          } catch (error) {
            // If response is not JSON, assume success
            resolve({
              url: xhr.responseText || 'Upload successful',
              size: videoBlob.size,
              response: xhr.responseText
            });
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

      xhr.timeout = 300000; // 5 minutes
      xhr.open(this.method, this.endpoint);

      // Set headers
      if (this.apiKey) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
      }
      
      // Set custom headers
      Object.entries(this.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  }

  /**
   * Delete a file (if supported by endpoint)
   */
  async deleteFile(fileId) {
    if (!this.isConfigured()) {
      throw new Error('Generic HTTP provider not configured');
    }

    // This is a placeholder - actual implementation depends on the endpoint
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`Delete failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during delete'));
      });

      xhr.open('DELETE', `${this.endpoint}/${fileId}`);
      
      if (this.apiKey) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
      }
      
      Object.entries(this.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send();
    });
  }

  /**
   * Test connection to endpoint
   */
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('Generic HTTP provider not configured');
    }

    try {
      // Create a small test blob
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      
      // Try to upload test file
      const result = await this.uploadVideo(testBlob, {
        title: 'bug-tracer-test'
      });

      if (result.url || result.response) {
        return { success: true, message: 'Connection successful' };
      } else {
        throw new Error('No response from endpoint');
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get provider configuration schema for UI
   */
  getConfigSchema() {
    return {
      name: this.name,
      fields: [
        {
          id: 'endpoint',
          label: 'Upload Endpoint',
          type: 'url',
          required: true,
          placeholder: 'https://your-api.com/upload',
          help: 'HTTP/HTTPS endpoint for file uploads'
        },
        {
          id: 'method',
          label: 'HTTP Method',
          type: 'select',
          required: true,
          options: [
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' }
          ],
          help: 'HTTP method to use for uploads'
        },
        {
          id: 'fieldName',
          label: 'File Field Name',
          type: 'text',
          required: false,
          placeholder: 'file',
          help: 'Form field name for the file (default: file)'
        },
        {
          id: 'apiKey',
          label: 'API Key (Optional)',
          type: 'password',
          required: false,
          placeholder: 'your-api-key',
          help: 'API key for authentication (will be sent as Bearer token)'
        },
        {
          id: 'headers',
          label: 'Custom Headers (JSON)',
          type: 'textarea',
          required: false,
          placeholder: '{"X-Custom-Header": "value"}',
          help: 'Additional headers as JSON object'
        }
      ]
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GenericHTTPProvider;
} else {
  window.GenericHTTPProvider = GenericHTTPProvider;
}
