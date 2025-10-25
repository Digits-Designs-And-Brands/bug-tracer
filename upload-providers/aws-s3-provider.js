/**
 * AWS S3 upload provider
 * Extends BaseUploadProvider for AWS S3 integration
 */

class AWSS3Provider extends BaseUploadProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'AWS S3';
    this.bucket = config.bucket || null;
    this.region = config.region || 'us-east-1';
    this.accessKeyId = config.accessKeyId || null;
    this.secretAccessKey = config.secretAccessKey || null;
    this.folder = config.folder || 'bug-tracer';
  }

  /**
   * Validate provider configuration
   */
  validateConfig() {
    const errors = [];
    if (!this.bucket) errors.push('S3 Bucket is required');
    if (!this.region) errors.push('Region is required');
    if (!this.accessKeyId) errors.push('Access Key ID is required');
    if (!this.secretAccessKey) errors.push('Secret Access Key is required');
    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if AWS S3 is properly configured
   */
  isConfigured() {
    return this.validateConfig().valid;
  }

  /**
   * Generate AWS signature for S3 upload
   */
  generateSignature(method, contentType, date, resource) {
    const stringToSign = `${method}\n\n${contentType}\n${date}\n${resource}`;
    
    // In a real implementation, you'd use AWS SDK or proper HMAC-SHA1
    // For now, we'll use a simplified approach
    return btoa(stringToSign);
  }

  /**
   * Upload a video blob to AWS S3
   */
  async uploadVideo(videoBlob, metadata = {}, onProgress = null) {
    if (!this.isConfigured()) {
      throw new Error('AWS S3 not configured');
    }

    const filename = this.generateFilename(metadata.title || 'bug-tracer', 'webm');
    const key = `${this.folder}/${filename}`;
    const contentType = 'video/webm';
    const date = new Date().toUTCString();

    const formData = new FormData();
    formData.append('key', key);
    formData.append('Content-Type', contentType);
    formData.append('file', videoBlob);

    // Add metadata
    if (metadata.title) {
      formData.append('x-amz-meta-title', metadata.title);
    }
    if (metadata.tags) {
      formData.append('x-amz-meta-tags', metadata.tags.join(','));
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
        if (xhr.status === 200 || xhr.status === 204) {
          const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
          resolve({
            url,
            key,
            bucket: this.bucket,
            region: this.region,
            size: videoBlob.size
          });
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
      xhr.open('POST', `https://${this.bucket}.s3.${this.region}.amazonaws.com/`);
      xhr.send(formData);
    });
  }

  /**
   * Delete a file from AWS S3
   */
  async deleteFile(fileKey) {
    if (!this.isConfigured()) {
      throw new Error('AWS S3 not configured');
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status === 204) {
          resolve({ success: true });
        } else {
          reject(new Error(`Delete failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during delete'));
      });

      xhr.open('DELETE', `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`);
      xhr.send();
    });
  }

  /**
   * Test connection to AWS S3
   */
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('AWS S3 not configured');
    }

    try {
      // Create a small test blob
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testKey = `${this.folder}/test-${Date.now()}.txt`;
      
      // Try to upload test file
      const result = await this.uploadVideo(testBlob, {
        title: 'bug-tracer-test'
      });

      if (result.url) {
        // Clean up test file
        try {
          await this.deleteFile(testKey);
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
   * Get provider configuration schema for UI
   */
  getConfigSchema() {
    return {
      name: this.name,
      fields: [
        {
          id: 'bucket',
          label: 'S3 Bucket',
          type: 'text',
          required: true,
          placeholder: 'your-bucket-name',
          help: 'Your AWS S3 bucket name'
        },
        {
          id: 'region',
          label: 'Region',
          type: 'select',
          required: true,
          options: [
            { value: 'us-east-1', label: 'US East (N. Virginia)' },
            { value: 'us-west-2', label: 'US West (Oregon)' },
            { value: 'eu-west-1', label: 'Europe (Ireland)' },
            { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' }
          ],
          help: 'AWS region where your bucket is located'
        },
        {
          id: 'accessKeyId',
          label: 'Access Key ID',
          type: 'text',
          required: true,
          placeholder: 'your-access-key-id',
          help: 'Your AWS access key ID'
        },
        {
          id: 'secretAccessKey',
          label: 'Secret Access Key',
          type: 'password',
          required: true,
          placeholder: 'your-secret-access-key',
          help: 'Your AWS secret access key'
        },
        {
          id: 'folder',
          label: 'Folder (Optional)',
          type: 'text',
          required: false,
          placeholder: 'bug-tracer',
          help: 'Folder path in S3 bucket (default: bug-tracer)'
        }
      ]
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AWSS3Provider;
} else {
  window.AWSS3Provider = AWSS3Provider;
}
