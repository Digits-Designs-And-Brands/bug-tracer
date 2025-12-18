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

    // Create compact bubble (default view)
    const bubble = document.createElement('div');
    bubble.className = 'bug-tracer-bubble';

    const bubbleIcon = document.createElement('div');
    bubbleIcon.className = 'bug-tracer-bubble-icon';
    bubbleIcon.textContent = '🎥';

    const bubbleDuration = document.createElement('div');
    bubbleDuration.className = 'bug-tracer-bubble-duration';
    bubbleDuration.textContent = '00:00';

    bubble.appendChild(bubbleIcon);
    bubble.appendChild(bubbleDuration);

    // Create expanded controls (shown on hover)
    const controls = document.createElement('div');
    controls.className = 'bug-tracer-controls';

    const controlsHeader = document.createElement('div');
    controlsHeader.className = 'bug-tracer-controls-header';

    const recordingIndicator = document.createElement('div');
    recordingIndicator.className = 'bug-tracer-recording-indicator';

    const redDot = document.createElement('span');
    redDot.className = 'bug-tracer-red-dot';

    const statusText = document.createElement('span');
    statusText.textContent = 'Recording';

    recordingIndicator.appendChild(redDot);
    recordingIndicator.appendChild(statusText);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'bug-tracer-close-btn';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close widget');
    closeBtn.addEventListener('click', () => this.hide());

    controlsHeader.appendChild(recordingIndicator);
    controlsHeader.appendChild(closeBtn);

    const controlsDuration = document.createElement('div');
    controlsDuration.className = 'bug-tracer-controls-duration';
    controlsDuration.textContent = '00:00';

    const controlsActions = document.createElement('div');
    controlsActions.className = 'bug-tracer-controls-actions';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'bug-tracer-stop-btn';
    stopBtn.textContent = '⏹️ Stop Recording';
    stopBtn.addEventListener('click', () => this.stopRecording());

    controlsActions.appendChild(stopBtn);

    controls.appendChild(controlsHeader);
    controls.appendChild(controlsDuration);
    controls.appendChild(controlsActions);

    this.widget.appendChild(bubble);
    this.widget.appendChild(controls);

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
      /* Main widget container */
      .bug-tracer-widget {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        user-select: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Compact bubble (default) */
      .bug-tracer-bubble {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        cursor: move;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .bug-tracer-bubble:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
      }

      .bug-tracer-widget:hover .bug-tracer-bubble {
        opacity: 0;
        pointer-events: none;
      }

      .bug-tracer-bubble-icon {
        font-size: 24px;
        margin-bottom: 2px;
        animation: recording-pulse 2s infinite;
      }

      @keyframes recording-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .bug-tracer-bubble-duration {
        font-size: 11px;
        font-weight: 600;
        color: white;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
      }

      /* Expanded controls (shown on hover) */
      .bug-tracer-controls {
        position: absolute;
        top: 0;
        right: 0;
        width: 260px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(10px);
      }

      .bug-tracer-widget:hover .bug-tracer-controls {
        opacity: 1;
        pointer-events: all;
        transform: translateX(0);
      }

      .bug-tracer-controls-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 12px;
        border-bottom: 1px solid #f0f0f0;
      }

      .bug-tracer-recording-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .bug-tracer-red-dot {
        width: 10px;
        height: 10px;
        background: #ff4444;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      .bug-tracer-close-btn {
        background: transparent;
        border: none;
        color: #999;
        font-size: 24px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .bug-tracer-close-btn:hover {
        background: #f5f5f5;
        color: #333;
      }

      .bug-tracer-controls-duration {
        font-size: 32px;
        font-weight: bold;
        color: #667eea;
        text-align: center;
        padding: 20px 16px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
      }

      .bug-tracer-controls-actions {
        padding: 0 16px 16px;
      }

      .bug-tracer-stop-btn {
        width: 100%;
        padding: 14px 20px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
      }

      .bug-tracer-stop-btn:hover {
        background: #e63939;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 68, 68, 0.4);
      }

      .bug-tracer-stop-btn:active {
        transform: translateY(0);
      }

      /* Responsive design */
      @media (max-width: 480px) {
        .bug-tracer-widget {
          top: 16px;
          right: 16px;
        }

        .bug-tracer-bubble {
          width: 70px;
          height: 70px;
        }

        .bug-tracer-bubble-icon {
          font-size: 20px;
        }

        .bug-tracer-controls {
          width: calc(100vw - 32px);
          right: -16px;
        }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .bug-tracer-controls {
          background: #2d2d2d;
        }

        .bug-tracer-controls-header {
          border-bottom-color: #404040;
        }

        .bug-tracer-recording-indicator {
          color: #e0e0e0;
        }

        .bug-tracer-close-btn:hover {
          background: #404040;
          color: #e0e0e0;
        }

        .bug-tracer-controls-duration {
          color: #667eea;
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
    const bubble = this.widget.querySelector('.bug-tracer-bubble');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    bubble.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = this.widget.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      bubble.style.cursor = 'grabbing';
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
        bubble.style.cursor = 'move';
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
        const formattedDuration = this.formatDuration(duration);

        // Update bubble duration
        const bubbleDuration = this.widget.querySelector('.bug-tracer-bubble-duration');
        if (bubbleDuration) {
          bubbleDuration.textContent = formattedDuration;
        }

        // Update controls duration
        const controlsDuration = this.widget.querySelector('.bug-tracer-controls-duration');
        if (controlsDuration) {
          controlsDuration.textContent = formattedDuration;
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
