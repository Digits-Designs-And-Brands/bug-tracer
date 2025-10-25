/**
 * Floating Recording Widget
 * Creates a Loom-style floating recording interface on the page
 */

class FloatingRecordingWidget {
  constructor() {
    this.widget = null;
    this.isVisible = false;
    this.recordingStartTime = null;
    this.durationInterval = null;
    this.createWidget();
  }

  /**
   * Create the floating widget
   */
  createWidget() {
    // Create widget container
    this.widget = document.createElement('div');
    this.widget.id = 'bug-tracer-floating-widget';
    this.widget.className = 'bug-tracer-widget';
    
    // Create widget content using DOM methods (Trusted Types safe)
    const content = document.createElement('div');
    content.className = 'bug-tracer-widget-content';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'bug-tracer-widget-header';
    
    const icon = document.createElement('div');
    icon.className = 'bug-tracer-widget-icon';
    icon.textContent = '🎥';
    
    const title = document.createElement('div');
    title.className = 'bug-tracer-widget-title';
    title.textContent = 'Bug Tracer';
    
    const closeBtn = document.createElement('div');
    closeBtn.className = 'bug-tracer-widget-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.hide());
    
    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'bug-tracer-widget-body';
    
    // Create status
    const status = document.createElement('div');
    status.className = 'bug-tracer-widget-status';
    
    const dot = document.createElement('div');
    dot.className = 'bug-tracer-widget-dot';
    
    const statusText = document.createElement('span');
    statusText.className = 'bug-tracer-widget-text';
    statusText.textContent = 'Recording...';
    
    status.appendChild(dot);
    status.appendChild(statusText);
    
    // Create duration
    const duration = document.createElement('div');
    duration.className = 'bug-tracer-widget-duration';
    duration.textContent = '00:00';
    
    // Create actions
    const actions = document.createElement('div');
    actions.className = 'bug-tracer-widget-actions';
    
    const stopBtn = document.createElement('button');
    stopBtn.className = 'bug-tracer-widget-btn bug-tracer-widget-stop';
    stopBtn.textContent = '⏹️ Stop';
    stopBtn.addEventListener('click', () => this.stopRecording());
    
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'bug-tracer-widget-btn bug-tracer-widget-pause';
    pauseBtn.textContent = '⏸️ Pause';
    pauseBtn.addEventListener('click', () => this.togglePause());
    
    actions.appendChild(stopBtn);
    actions.appendChild(pauseBtn);
    
    // Assemble the widget
    body.appendChild(status);
    body.appendChild(duration);
    body.appendChild(actions);
    
    content.appendChild(header);
    content.appendChild(body);
    
    this.widget.appendChild(content);

    // Add styles
    this.addStyles();

    // Make widget draggable
    this.makeDraggable();

    // Initially hidden
    this.widget.style.display = 'none';
    
    // Add to page
    document.body.appendChild(this.widget);
  }

  /**
   * Add CSS styles for the widget
   */
  addStyles() {
    if (document.getElementById('bug-tracer-widget-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bug-tracer-widget-styles';
    
    // Use textContent instead of innerHTML for Trusted Types compatibility
    const cssText = `
      .bug-tracer-widget {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 280px;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        user-select: none;
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
      }

      .bug-tracer-widget-content {
        padding: 0;
        border-radius: 12px;
        overflow: hidden;
      }

      .bug-tracer-widget-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px 12px 0 0;
      }

      .bug-tracer-widget-icon {
        font-size: 18px;
        margin-right: 8px;
      }

      .bug-tracer-widget-title {
        flex: 1;
        font-weight: 600;
        font-size: 15px;
      }

      .bug-tracer-widget-close {
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        opacity: 0.8;
        transition: opacity 0.2s;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .bug-tracer-widget-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.2);
      }

      .bug-tracer-widget-body {
        padding: 16px;
      }

      .bug-tracer-widget-status {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }

      .bug-tracer-widget-dot {
        width: 8px;
        height: 8px;
        background: #ff4444;
        border-radius: 50%;
        margin-right: 8px;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      .bug-tracer-widget-text {
        color: #333;
        font-weight: 500;
      }

      .bug-tracer-widget-duration {
        font-size: 24px;
        font-weight: bold;
        color: #333;
        text-align: center;
        margin-bottom: 16px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      }

      .bug-tracer-widget-actions {
        display: flex;
        gap: 8px;
      }

      .bug-tracer-widget-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .bug-tracer-widget-stop {
        background: #ff4444;
        color: white;
      }

      .bug-tracer-widget-stop:hover {
        background: #e63939;
        transform: translateY(-1px);
      }

      .bug-tracer-widget-pause {
        background: #f0f0f0;
        color: #333;
        border: 1px solid #ddd;
      }

      .bug-tracer-widget-pause:hover {
        background: #e8e8e8;
        transform: translateY(-1px);
      }

      .bug-tracer-widget-pause.paused {
        background: #4CAF50;
        color: white;
        border-color: #4CAF50;
      }

      .bug-tracer-widget-pause.paused:hover {
        background: #45a049;
      }

      /* Responsive design */
      @media (max-width: 480px) {
        .bug-tracer-widget {
          width: calc(100vw - 40px);
          right: 20px;
          left: 20px;
        }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .bug-tracer-widget {
          background: rgba(30, 30, 30, 0.95);
          border-color: #444;
        }
        
        .bug-tracer-widget-text,
        .bug-tracer-widget-duration {
          color: #fff;
        }
        
        .bug-tracer-widget-pause {
          background: #444;
          color: #fff;
          border-color: #666;
        }
        
        .bug-tracer-widget-pause:hover {
          background: #555;
        }
      }
    `;

    styles.textContent = cssText;
    document.head.appendChild(styles);
  }

  /**
   * Make the widget draggable
   */
  makeDraggable() {
    const header = this.widget.querySelector('.bug-tracer-widget-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('bug-tracer-widget-close')) return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(window.getComputedStyle(this.widget).left, 10) || 0;
      startTop = parseInt(window.getComputedStyle(this.widget).top, 10) || 0;
      
      this.widget.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      this.widget.style.left = (startLeft + deltaX) + 'px';
      this.widget.style.top = (startTop + deltaY) + 'px';
      this.widget.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.widget.style.cursor = 'default';
      }
    });
  }

  /**
   * Show the widget
   */
  show() {
    if (this.isVisible) return;
    
    this.widget.style.display = 'block';
    this.isVisible = true;
    this.recordingStartTime = Date.now();
    this.startDurationTimer();
  }

  /**
   * Hide the widget
   */
  hide() {
    if (!this.isVisible) return;
    
    this.widget.style.display = 'none';
    this.isVisible = false;
    this.stopDurationTimer();
  }

  /**
   * Start duration timer
   */
  startDurationTimer() {
    this.stopDurationTimer();
    
    this.durationInterval = setInterval(() => {
      if (this.recordingStartTime) {
        const duration = Date.now() - this.recordingStartTime;
        const durationElement = this.widget.querySelector('.bug-tracer-widget-duration');
        if (durationElement) {
          durationElement.textContent = this.formatDuration(duration);
        }
      }
    }, 1000);
  }

  /**
   * Stop duration timer
   */
  stopDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
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
   * Stop recording
   */
  stopRecording() {
    // Send message to content script to stop recording
    window.postMessage({
      type: 'BUG_TRACER_STOP_RECORDING'
    }, '*');
    
    this.hide();
  }

  /**
   * Toggle pause (placeholder for future feature)
   */
  togglePause() {
    const pauseBtn = this.widget.querySelector('.bug-tracer-widget-pause');
    const isPaused = pauseBtn.classList.contains('paused');
    
    if (isPaused) {
      pauseBtn.classList.remove('paused');
      pauseBtn.innerHTML = '⏸️ Pause';
      this.startDurationTimer();
    } else {
      pauseBtn.classList.add('paused');
      pauseBtn.innerHTML = '▶️ Resume';
      this.stopDurationTimer();
    }
  }

  /**
   * Update recording status
   */
  updateStatus(isRecording) {
    if (isRecording) {
      this.show();
    } else {
      this.hide();
    }
  }
}

// Initialize widget when script loads
if (typeof window !== 'undefined') {
  window.bugTracerWidget = new FloatingRecordingWidget();
}
