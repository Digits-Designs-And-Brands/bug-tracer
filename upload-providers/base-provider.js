/**
 * Base upload provider interface
 * All upload providers should extend this class
 */

class BaseUploadProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'Base Provider';
  }

  /**
   * Validate provider configuration
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateConfig() {
    return { valid: true, errors: [] };
  }

  /**
   * Upload a video blob
   * @param {Blob} videoBlob - The video blob to upload
   * @param {Object} metadata - Additional metadata
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<Object>} Upload result with URL and metadata
   */
  async uploadVideo(videoBlob, metadata = {}, onProgress = null) {
    throw new Error('uploadVideo method must be implemented by provider');
  }

  /**
   * Upload recording with console logs and network data
   * @param {Object} recording - Recording object with video blob and metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadRecording(recording, onProgress = null) {
    try {
      // Upload video first
      const videoResult = await this.uploadVideo(recording.videoBlob, {
        title: recording.title,
        tags: ['bug-tracer', 'screen-recording']
      }, onProgress);

      // Create metadata JSON
      const metadata = {
        title: recording.title,
        url: recording.url,
        timestamp: recording.timestamp,
        duration: recording.duration,
        consoleLogs: recording.consoleLogs,
        networkRequests: recording.networkRequests,
        videoUrl: videoResult.url
      };

      // Upload metadata as JSON file
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json'
      });

      const metadataResult = await this.uploadVideo(metadataBlob, {
        title: `${recording.title}-metadata`,
        tags: ['bug-tracer', 'metadata']
      });

      return {
        video: videoResult,
        metadata: metadataResult,
        success: true
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete a file from the provider
   * @param {string} fileId - The file identifier to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(fileId) {
    throw new Error('deleteFile method must be implemented by provider');
  }

  /**
   * Test connection to the provider
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    throw new Error('testConnection method must be implemented by provider');
  }

  /**
   * Get provider configuration schema for UI
   * @returns {Object} Configuration schema
   */
  getConfigSchema() {
    return {
      name: this.name,
      fields: []
    };
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Generate unique filename
   * @param {string} prefix - Filename prefix
   * @param {string} extension - File extension
   * @returns {string} Unique filename
   */
  generateFilename(prefix = 'bug-tracer', extension = 'webm') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}.${extension}`;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseUploadProvider;
} else {
  window.BaseUploadProvider = BaseUploadProvider;
}
