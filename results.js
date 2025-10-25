/**
 * Results Page Script
 * Displays comprehensive recording analysis and captured data
 */

class BugTracerResults {
  constructor() {
    this.recordingData = null;
    this.video = null;
    this.isPlaying = false;
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadRecordingData();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.loadingElement = document.getElementById('loading');
    this.contentElement = document.getElementById('content');
    
    // Recording info elements
    this.titleElement = document.getElementById('recording-title');
    this.urlElement = document.getElementById('recording-url');
    this.durationElement = document.getElementById('recording-duration');
    this.dateElement = document.getElementById('recording-date');
    this.sizeElement = document.getElementById('recording-size');
    this.statusElement = document.getElementById('recording-status');
    
    // Video elements
    this.video = document.getElementById('recording-video');
    this.videoSource = document.getElementById('video-source');
    this.playButton = document.getElementById('play-button');
    this.progressBar = document.getElementById('progress-bar');
    this.progressFill = document.getElementById('progress-fill');
    this.timeDisplay = document.getElementById('time-display');
    
    // Tab elements
    this.tabs = document.querySelectorAll('.tab');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    // Data containers
    this.consoleLogsContainer = document.getElementById('console-logs');
    this.networkRequestsContainer = document.getElementById('network-requests');
    
    // Action buttons
    this.downloadBtn = document.getElementById('download-btn');
    this.uploadBtn = document.getElementById('upload-btn');
    this.shareBtn = document.getElementById('share-btn');
    this.newRecordingBtn = document.getElementById('new-recording-btn');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Video controls
    this.video.addEventListener('loadedmetadata', () => this.updateVideoInfo());
    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('play', () => this.onPlay());
    this.video.addEventListener('pause', () => this.onPause());
    this.video.addEventListener('ended', () => this.onEnded());
    
    this.playButton.addEventListener('click', () => this.togglePlay());
    this.progressBar.addEventListener('click', (e) => this.seekTo(e));
    
    // Tabs
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Action buttons
    this.downloadBtn.addEventListener('click', () => this.downloadRecording());
    this.uploadBtn.addEventListener('click', () => this.uploadRecording());
    this.shareBtn.addEventListener('click', () => this.shareRecording());
    this.newRecordingBtn.addEventListener('click', () => this.startNewRecording());
  }

  /**
   * Load recording data from URL parameters or storage
   */
  async loadRecordingData() {
    try {
      // Get recording ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const recordingId = urlParams.get('id');
      
      if (!recordingId) {
        throw new Error('No recording ID provided');
      }

      // Load recording data from storage
      const storage = new BugTracerStorage();
      await storage.init();
      this.recordingData = await storage.getRecording(parseInt(recordingId));
      
      if (!this.recordingData) {
        throw new Error('Recording not found');
      }

      this.displayRecordingData();
      this.loadingElement.style.display = 'none';
      this.contentElement.style.display = 'block';
      
    } catch (error) {
      console.error('Failed to load recording data:', error);
      this.showError('Failed to load recording data: ' + error.message);
    }
  }

  /**
   * Display recording information
   */
  displayRecordingData() {
    // Basic info
    this.titleElement.textContent = this.recordingData.title || 'Untitled Recording';
    this.urlElement.textContent = this.recordingData.url || 'Unknown URL';
    this.durationElement.textContent = this.formatDuration(this.recordingData.duration || 0);
    this.dateElement.textContent = new Date(this.recordingData.timestamp).toLocaleString();
    this.sizeElement.textContent = this.formatFileSize(this.recordingData.size || 0);
    this.statusElement.textContent = this.recordingData.uploaded ? 'Uploaded' : 'Local Only';

    // Video
    if (this.recordingData.videoBlob) {
      const videoUrl = URL.createObjectURL(this.recordingData.videoBlob);
      this.videoSource.src = videoUrl;
      this.video.load();
    }

    // Console logs
    this.displayConsoleLogs(this.recordingData.consoleLogs || []);
    
    // Network requests
    this.displayNetworkRequests(this.recordingData.networkRequests || []);
  }

  /**
   * Display console logs
   */
  displayConsoleLogs(logs) {
    if (logs.length === 0) {
      this.consoleLogsContainer.innerHTML = `
        <div class="empty-state">
          <h3>No console logs captured</h3>
          <p>Console logs will appear here when available.</p>
        </div>
      `;
      return;
    }

    this.consoleLogsContainer.innerHTML = logs.map(log => `
      <div class="log-entry ${log.level}">
        <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
        <span class="log-message">${this.escapeHtml(log.message)}</span>
        ${log.stack ? `<div class="log-stack">${this.escapeHtml(log.stack)}</div>` : ''}
      </div>
    `).join('');
  }

  /**
   * Display network requests
   */
  displayNetworkRequests(requests) {
    if (requests.length === 0) {
      this.networkRequestsContainer.innerHTML = `
        <div class="empty-state">
          <h3>No network requests captured</h3>
          <p>Network requests will appear here when available.</p>
        </div>
      `;
      return;
    }

    this.networkRequestsContainer.innerHTML = requests.map(request => `
      <div class="network-request">
        <div class="network-header" onclick="this.nextElementSibling.classList.toggle('expanded')">
          <span class="network-method ${request.method}">${request.method}</span>
          <span class="network-url">${this.escapeHtml(request.url)}</span>
          <span class="network-status ${this.getStatusClass(request.status)}">${request.status}</span>
        </div>
        <div class="network-details">
          <div class="detail-section">
            <h4>Request Headers</h4>
            <div class="detail-content">${this.formatHeaders(request.requestHeaders)}</div>
          </div>
          <div class="detail-section">
            <h4>Request Body</h4>
            <div class="detail-content">${this.escapeHtml(request.requestBody || 'No body')}</div>
          </div>
          <div class="detail-section">
            <h4>Response Headers</h4>
            <div class="detail-content">${this.formatHeaders(request.responseHeaders)}</div>
          </div>
          <div class="detail-section">
            <h4>Response Body</h4>
            <div class="detail-content">${this.escapeHtml(request.responseBody || 'No body')}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Video control methods
   */
  updateVideoInfo() {
    this.updateTimeDisplay();
  }

  updateProgress() {
    if (this.video.duration) {
      const progress = (this.video.currentTime / this.video.duration) * 100;
      this.progressFill.style.width = progress + '%';
      this.updateTimeDisplay();
    }
  }

  updateTimeDisplay() {
    const current = this.formatTime(this.video.currentTime || 0);
    const total = this.formatTime(this.video.duration || 0);
    this.timeDisplay.textContent = `${current} / ${total}`;
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  onPlay() {
    this.playButton.textContent = '⏸️';
    this.isPlaying = true;
  }

  onPause() {
    this.playButton.textContent = '▶️';
    this.isPlaying = false;
  }

  onEnded() {
    this.playButton.textContent = '▶️';
    this.isPlaying = false;
  }

  seekTo(event) {
    const rect = this.progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    this.video.currentTime = percentage * this.video.duration;
  }

  /**
   * Tab switching
   */
  switchTab(tabName) {
    // Update tab buttons
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabName + '-tab');
    });
  }

  /**
   * Action methods
   */
  downloadRecording() {
    if (this.recordingData.videoBlob) {
      const url = URL.createObjectURL(this.recordingData.videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.recordingData.title || 'recording'}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  async uploadRecording() {
    try {
      this.uploadBtn.disabled = true;
      this.uploadBtn.textContent = '⏳ Uploading...';

      // Get upload manager
      const uploadManager = new UploadManager();
      const isConfigured = await uploadManager.isCurrentProviderConfigured();
      
      if (!isConfigured) {
        alert('Please configure upload provider settings first');
        this.uploadBtn.disabled = false;
        this.uploadBtn.textContent = '☁️ Upload to Cloud';
        return;
      }

      // Upload recording
      const result = await uploadManager.uploadRecording(this.recordingData);
      
      // Update recording status
      const storage = new BugTracerStorage();
      await storage.init();
      await storage.updateRecording(this.recordingData.id, {
        uploaded: true,
        uploadUrl: result.video.url,
        uploadProvider: uploadManager.getCurrentProviderId(),
        uploadMetadata: result
      });

      this.statusElement.textContent = 'Uploaded';
      this.uploadBtn.textContent = '✅ Uploaded';
      this.uploadBtn.disabled = true;
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
      this.uploadBtn.disabled = false;
      this.uploadBtn.textContent = '☁️ Upload to Cloud';
    }
  }

  shareRecording() {
    if (this.recordingData.uploaded && this.recordingData.uploadUrl) {
      // Copy URL to clipboard
      navigator.clipboard.writeText(this.recordingData.uploadUrl).then(() => {
        alert('Recording URL copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = this.recordingData.uploadUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Recording URL copied to clipboard!');
      });
    } else {
      alert('Please upload the recording first to get a shareable link');
    }
  }

  startNewRecording() {
    // Open extension popup or redirect to extension
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  }

  /**
   * Utility methods
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatHeaders(headers) {
    if (!headers || Object.keys(headers).length === 0) {
      return 'No headers';
    }
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  getStatusClass(status) {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400) return 'error';
    if (status >= 300) return 'warning';
    return '';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    this.loadingElement.innerHTML = `
      <div class="empty-state">
        <h3>Error</h3>
        <p>${this.escapeHtml(message)}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BugTracerResults();
});
