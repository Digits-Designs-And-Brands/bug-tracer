/**
 * IndexedDB wrapper for storing bug recordings
 * Handles large video files and metadata storage
 */

class BugTracerStorage {
  constructor() {
    this.dbName = 'BugTracerDB';
    this.dbVersion = 1;
    this.db = null;
  }

  /**
   * Initialize IndexedDB connection
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create recordings store
        if (!db.objectStoreNames.contains('recordings')) {
          const recordingsStore = db.createObjectStore('recordings', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create indexes for efficient querying
          recordingsStore.createIndex('timestamp', 'timestamp', { unique: false });
          recordingsStore.createIndex('url', 'url', { unique: false });
        }
      };
    });
  }

  /**
   * Save a recording with metadata
   * @param {Object} recordingData - Recording data including blob and metadata
   */
  async saveRecording(recordingData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      
      const recording = {
        timestamp: Date.now(),
        url: recordingData.url,
        title: recordingData.title || `Recording ${new Date().toLocaleString()}`,
        videoBlob: recordingData.videoBlob,
        consoleLogs: recordingData.consoleLogs || [],
        networkRequests: recordingData.networkRequests || [],
        duration: recordingData.duration || 0,
        size: recordingData.videoBlob ? recordingData.videoBlob.size : 0,
        uploaded: false,
        cloudinaryUrl: null
      };

      const request = store.add(recording);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all recordings
   */
  async getAllRecordings() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by timestamp (newest first)
        const recordings = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(recordings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a specific recording by ID
   */
  async getRecording(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a recording
   */
  async deleteRecording(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update recording metadata (e.g., after upload)
   */
  async updateRecording(id, updates) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const recording = getRequest.result;
        if (recording) {
          Object.assign(recording, updates);
          const putRequest = store.put(recording);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Recording not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');
      const request = store.getAll();

      request.onsuccess = () => {
        const recordings = request.result;
        const totalSize = recordings.reduce((sum, recording) => sum + (recording.size || 0), 0);
        const totalCount = recordings.length;
        
        resolve({
          totalSize,
          totalCount,
          averageSize: totalCount > 0 ? totalSize / totalCount : 0
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all recordings (for cleanup)
   */
  async clearAllRecordings() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BugTracerStorage;
} else {
  window.BugTracerStorage = BugTracerStorage;
}
