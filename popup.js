/**
 * Popup script for Bug Tracer extension
 * Handles UI interactions and coordinates with background script
 */

class BugTracerPopup {
  constructor() {
    console.log('Bug Tracer popup: Constructor called');
    try {
      this.storage = new BugTracerStorage();
      this.uploadManager = new UploadManager();
      this.isRecording = false;
      this.recordings = [];
      this.recordingInterval = null;
      
      this.initializeElements();
      this.setupEventListeners();
      this.loadRecordings();
      // Initialize recording status first
      this.initializeRecordingStatus();
      console.log('Bug Tracer popup: Constructor completed successfully');
    } catch (error) {
      console.error('Bug Tracer popup: Constructor failed:', error);
      throw error;
    }
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.recordButton = document.getElementById('recordButton');
    this.recordIcon = document.getElementById('recordIcon');
    this.recordText = document.getElementById('recordText');
    this.recordingStatus = document.getElementById('recordingStatus');
    this.statusText = document.getElementById('statusText');
    this.recordingDuration = document.getElementById('recordingDuration');
    this.durationText = document.getElementById('durationText');
    this.recordingsList = document.getElementById('recordingsList');
    this.recordingsCount = document.getElementById('recordingsCount');
    this.emptyState = document.getElementById('emptyState');
    this.settingsButton = document.getElementById('settingsButton');
    this.notificationContainer = document.getElementById('notificationContainer');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.recordButton.addEventListener('click', () => this.toggleRecording());
    this.settingsButton.addEventListener('click', () => this.openSettings());
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleBackgroundMessage(message, sender, sendResponse);
    });
  }

  /**
   * Handle messages from background script
   */
  handleBackgroundMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'SAVE_RECORDING':
        this.saveRecording(message.data);
        break;
      case 'RECORDING_STATUS_UPDATE':
        this.updateRecordingStatus(message.data);
        break;
    }
  }

  /**
   * Toggle recording state
   */
  async toggleRecording() {
    try {
      this.recordButton.disabled = true;
      
      if (this.isRecording) {
        await this.stopRecording();
      } else {
        await this.startRecording();
      }
    } catch (error) {
      this.showNotification('Error: ' + error.message, 'error');
      console.error('Recording error:', error);
    } finally {
      this.recordButton.disabled = false;
    }
  }

  /**
   * Start recording
   */
  async startRecording() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'START_RECORDING' });
      
      if (response.success) {
        this.isRecording = true;
        this.updateUI();
        this.startDurationTimer();
        this.showNotification('Recording started', 'success');
      } else {
        throw new Error(response.error || 'Failed to start recording');
      }
    } catch (error) {
      throw new Error('Failed to start recording: ' + error.message);
    }
  }

  /**
   * Stop recording
   */
  async stopRecording() {
    try {
      // First check if we're actually recording
      const status = await chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATUS' });
      if (!status.isRecording) {
        // We're not actually recording, just update the UI
        this.isRecording = false;
        this.updateUI();
        this.stopDurationTimer();
        this.showNotification('No active recording to stop', 'info');
        return;
      }

      const response = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
      
      if (response.success) {
        this.isRecording = false;
        this.updateUI();
        this.stopDurationTimer();
        this.showNotification('Recording stopped', 'success');
        // Reload recordings after a short delay
        setTimeout(() => this.loadRecordings(), 1000);
      } else {
        throw new Error(response.error || 'Failed to stop recording');
      }
    } catch (error) {
      // If there's an error, reset the UI state
      this.isRecording = false;
      this.updateUI();
      this.stopDurationTimer();
      throw new Error('Failed to stop recording: ' + error.message);
    }
  }

  /**
   * Save recording to storage
   */
  async saveRecording(recordingData) {
    try {
      await this.storage.init();
      const recordingId = await this.storage.saveRecording(recordingData);
      this.showNotification('Recording saved successfully', 'success');
      this.loadRecordings();
      return recordingId;
    } catch (error) {
      this.showNotification('Failed to save recording: ' + error.message, 'error');
      console.error('Save recording error:', error);
    }
  }

  /**
   * Load recordings from storage
   */
  async loadRecordings() {
    try {
      await this.storage.init();
      this.recordings = await this.storage.getAllRecordings();
      this.renderRecordings();
    } catch (error) {
      console.error('Failed to load recordings:', error);
      this.showNotification('Failed to load recordings', 'error');
    }
  }

  /**
   * Render recordings list
   */
  renderRecordings() {
    this.recordingsCount.textContent = this.recordings.length;

    if (this.recordings.length === 0) {
      this.emptyState.style.display = 'block';
      this.recordingsList.innerHTML = '';
      this.recordingsList.appendChild(this.emptyState);
      return;
    }

    this.emptyState.style.display = 'none';
    this.recordingsList.innerHTML = '';

    this.recordings.forEach(recording => {
      const recordingElement = this.createRecordingElement(recording);
      this.recordingsList.appendChild(recordingElement);
    });
  }

  /**
   * Create recording element
   */
  createRecordingElement(recording) {
    const element = document.createElement('div');
    element.className = 'recording-item';
    element.dataset.recordingId = recording.id;

    const duration = this.formatDuration(recording.duration);
    const size = this.formatFileSize(recording.size);
    const date = new Date(recording.timestamp).toLocaleString();

    // Create recording info section
    const recordingInfo = document.createElement('div');
    recordingInfo.className = 'recording-info';
    recordingInfo.style.cursor = 'pointer';
    recordingInfo.addEventListener('click', () => this.viewRecording(recording.id));

    // Create title
    const recordingTitle = document.createElement('div');
    recordingTitle.className = 'recording-title';
    recordingTitle.textContent = recording.title;

    // Create meta section
    const recordingMeta = document.createElement('div');
    recordingMeta.className = 'recording-meta';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = `📅 ${date}`;

    const durationSpan = document.createElement('span');
    durationSpan.textContent = `⏱️ ${duration}`;

    const sizeSpan = document.createElement('span');
    sizeSpan.textContent = `💾 ${size}`;

    const domainSpan = document.createElement('span');
    domainSpan.textContent = `🌐 ${this.getDomainFromUrl(recording.url)}`;

    recordingMeta.appendChild(dateSpan);
    recordingMeta.appendChild(durationSpan);
    recordingMeta.appendChild(sizeSpan);
    recordingMeta.appendChild(domainSpan);

    if (recording.uploaded) {
      const uploadedSpan = document.createElement('span');
      uploadedSpan.textContent = '☁️ Uploaded';
      recordingMeta.appendChild(uploadedSpan);
    }

    recordingInfo.appendChild(recordingTitle);
    recordingInfo.appendChild(recordingMeta);

    // Create actions section
    const recordingActions = document.createElement('div');
    recordingActions.className = 'recording-actions';

    // View button
    const viewButton = document.createElement('button');
    viewButton.className = 'action-button view';
    viewButton.textContent = 'View';
    viewButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewRecording(recording.id);
    });

    // Upload button (only if not uploaded)
    if (!recording.uploaded) {
      const uploadButton = document.createElement('button');
      uploadButton.className = 'action-button upload';
      uploadButton.textContent = 'Upload';
      uploadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.uploadRecording(recording.id);
      });
      recordingActions.appendChild(uploadButton);
    }

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'action-button delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteRecording(recording.id);
    });

    recordingActions.appendChild(viewButton);
    recordingActions.appendChild(deleteButton);

    // Assemble the element
    element.appendChild(recordingInfo);
    element.appendChild(recordingActions);

    return element;
  }

  /**
   * View recording in results page
   */
  viewRecording(recordingId) {
    const resultsUrl = chrome.runtime.getURL(`results.html?id=${recordingId}`);
    chrome.tabs.create({ url: resultsUrl });
  }

  /**
   * Upload recording using current provider
   */
  async uploadRecording(recordingId) {
    try {
      const recording = await this.storage.getRecording(recordingId);
      if (!recording) {
        throw new Error('Recording not found');
      }

      // Check if provider is configured
      const isConfigured = await this.uploadManager.isCurrentProviderConfigured();
      if (!isConfigured) {
        this.showNotification('Please configure upload provider settings first', 'error');
        this.openSettings();
        return;
      }

      // Show upload progress
      const button = document.querySelector(`[data-recording-id="${recordingId}"] .upload`);
      const originalText = button.textContent;
      button.disabled = true;
      button.innerHTML = '<span class="loading"></span> Uploading...';

      // Upload using current provider
      const uploadResult = await this.uploadManager.uploadRecording(recording, (progress) => {
        button.innerHTML = `<span class="loading"></span> ${Math.round(progress)}%`;
      });

      // Update recording with upload info
      await this.storage.updateRecording(recordingId, {
        uploaded: true,
        uploadUrl: uploadResult.video.url,
        uploadProvider: this.uploadManager.getCurrentProviderId(),
        uploadMetadata: uploadResult
      });

      button.textContent = 'Uploaded';
      button.style.background = '#4CAF50';
      this.showNotification('Recording uploaded successfully', 'success');
      
    } catch (error) {
      console.error('Upload error:', error);
      this.showNotification('Upload failed: ' + error.message, 'error');
      
      // Reset button
      const button = document.querySelector(`[data-recording-id="${recordingId}"] .upload`);
      if (button) {
        button.disabled = false;
        button.textContent = 'Upload';
      }
    }
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId) {
    if (!confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      await this.storage.deleteRecording(recordingId);
      this.showNotification('Recording deleted', 'success');
      this.loadRecordings();
    } catch (error) {
      console.error('Delete error:', error);
      this.showNotification('Failed to delete recording: ' + error.message, 'error');
    }
  }

  /**
   * Initialize recording status on popup open
   */
  async initializeRecordingStatus() {
    try {
      const status = await chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATUS' });
      this.updateRecordingStatus(status);
      
      // Set up periodic status checks to keep popup in sync
      this.statusCheckInterval = setInterval(() => {
        this.updateRecordingStatus();
      }, 2000); // Check every 2 seconds
      
    } catch (error) {
      console.error('Failed to initialize recording status:', error);
      // Default to not recording if we can't get status
      this.isRecording = false;
      this.updateUI();
    }
  }

  /**
   * Update recording status
   */
  async updateRecordingStatus(status = null) {
    if (!status) {
      try {
        status = await chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATUS' });
      } catch (error) {
        console.error('Failed to get recording status:', error);
        return;
      }
    }

    this.isRecording = status.isRecording;
    this.updateUI();
    
    if (this.isRecording && status.recordingStartTime) {
      this.startDurationTimer(status.recordingStartTime);
    } else {
      this.stopDurationTimer();
    }
  }

  /**
   * Update UI based on recording state
   */
  updateUI() {
    if (this.isRecording) {
      this.recordButton.className = 'record-button stop';
      this.recordIcon.textContent = '⏹️';
      this.recordText.textContent = 'Stop';
      this.statusText.textContent = 'Recording...';
      this.durationText.style.display = 'inline';
    } else {
      this.recordButton.className = 'record-button start';
      this.recordIcon.textContent = '🔴';
      this.recordText.textContent = 'Start';
      this.statusText.textContent = 'Ready';
      this.durationText.style.display = 'none';
    }
  }

  /**
   * Start duration timer
   */
  startDurationTimer(startTime = null) {
    this.stopDurationTimer();
    
    const start = startTime || Date.now();
    this.recordingInterval = setInterval(() => {
      const duration = Date.now() - start;
      this.durationText.textContent = this.formatDuration(duration);
    }, 1000);
  }

  /**
   * Stop duration timer
   */
  stopDurationTimer() {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  /**
   * Cleanup intervals when popup is closed
   */
  cleanup() {
    this.stopDurationTimer();
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  /**
   * Open settings page
   */
  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    this.notificationContainer.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Format duration in milliseconds to readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format file size in bytes to readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get domain from URL
   */
  getDomainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Bug Tracer popup: DOM loaded, initializing...');
  try {
    window.popup = new BugTracerPopup();
    console.log('Bug Tracer popup: Initialized successfully');
  } catch (error) {
    console.error('Bug Tracer popup: Initialization failed:', error);
  }
});

// Cleanup when popup is closed
window.addEventListener('beforeunload', () => {
  if (window.popup) {
    window.popup.cleanup();
  }
});
