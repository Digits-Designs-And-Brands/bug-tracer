/**
 * Content script for Bug Tracer extension
 * Coordinates between injected script and background script
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.bugTracerContentInjected) {
    return;
  }
  window.bugTracerContentInjected = true;

  let isRecording = false;
  let injectedScriptReady = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordingStartTime = null;
  let capturedData = {
    consoleLogs: [],
    networkRequests: []
  };

  /**
   * Inject the injected script into the page context
   */
  function injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  /**
   * Inject the floating widget script
   */
  function injectFloatingWidget() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('floating-widget.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  /**
   * Send message to background script
   */
  function sendToBackground(type, data) {
    chrome.runtime.sendMessage({
      type,
      data,
      tabId: null // Will be set by background script
    });
  }

  /**
   * Handle messages from injected script and floating widget
   */
  function handleInjectedMessage(event) {
    if (event.source !== window) return;

    switch (event.data.type) {
      case 'BUG_TRACER_READY':
        injectedScriptReady = true;
        sendToBackground('INJECTED_SCRIPT_READY', {
          url: window.location.href,
          timestamp: Date.now()
        });
        break;

      case 'BUG_TRACER_CONSOLE_LOG':
        if (isRecording) {
          capturedData.consoleLogs.push(event.data.data);
        }
        break;

      case 'BUG_TRACER_NETWORK_REQUEST':
        if (isRecording) {
          capturedData.networkRequests.push(event.data.data);
        }
        break;

      case 'BUG_TRACER_START_RECORDING':
        isRecording = true;
        capturedData.consoleLogs = [];
        capturedData.networkRequests = [];
        break;

      case 'BUG_TRACER_STOP_RECORDING':
        // Handle stop recording from floating widget
        if (isRecording) {
          stopScreenRecording();
        }
        break;
    }
  }

  /**
   * Start screen recording
   */
  async function startScreenRecording(streamId) {
    try {
      // Get the media stream using the stream ID
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId,
            maxWidth: 1920,
            maxHeight: 1080
          }
        },
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          }
        }
      });

      // Create MediaRecorder
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      recordedChunks = [];
      recordingStartTime = Date.now();

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const duration = Date.now() - recordingStartTime;
        
        // Save recording to storage
        await saveRecording(blob, duration);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        recordedChunks = [];
        mediaRecorder = null;
        recordingStartTime = null;
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      isRecording = true;

      // Start capturing console/network data
      startRecording();

      // Show floating widget
      if (window.bugTracerWidget) {
        window.bugTracerWidget.updateStatus(true);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to start screen recording:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop screen recording
   */
  async function stopScreenRecording() {
    try {
      if (!mediaRecorder || !isRecording) {
        throw new Error('No active recording to stop');
      }

      // Stop MediaRecorder
      mediaRecorder.stop();
      isRecording = false;

      // Stop capturing console/network data
      stopRecording();

      // Hide floating widget
      if (window.bugTracerWidget) {
        window.bugTracerWidget.updateStatus(false);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to stop screen recording:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save recording to storage
   */
  async function saveRecording(videoBlob, duration) {
    try {
      // Get captured data
      const data = await getCapturedData();

      const recordingData = {
        videoBlob,
        duration,
        url: window.location.href,
        title: document.title,
        consoleLogs: data.consoleLogs || [],
        networkRequests: data.networkRequests || []
      };

      // Send to background script for storage
      chrome.runtime.sendMessage({
        type: 'SAVE_RECORDING',
        data: recordingData
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to save recording:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start recording console logs and network requests
   */
  function startRecording() {
    if (!injectedScriptReady) {
      console.warn('Bug Tracer: Injected script not ready, waiting...');
      
      // Wait for injected script to be ready (with timeout)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkReady = () => {
        if (injectedScriptReady) {
          window.postMessage({
            type: 'BUG_TRACER_START'
          }, '*');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkReady, 100);
        } else {
          console.error('Bug Tracer: Injected script failed to load within timeout');
        }
      };
      
      checkReady();
      return;
    }

    window.postMessage({
      type: 'BUG_TRACER_START'
    }, '*');
  }

  /**
   * Stop recording and get captured data
   */
  function stopRecording() {
    if (!injectedScriptReady) {
      console.warn('Bug Tracer: Injected script not ready');
      return;
    }

    window.postMessage({
      type: 'BUG_TRACER_STOP'
    }, '*');
  }

  /**
   * Get current captured data
   */
  function getCapturedData() {
    if (!injectedScriptReady) {
      return { consoleLogs: [], networkRequests: [], isRecording: false };
    }

    return new Promise((resolve) => {
      const handleResponse = (event) => {
        if (event.source !== window || event.data.type !== 'BUG_TRACER_DATA_RESPONSE') {
          return;
        }
        window.removeEventListener('message', handleResponse);
        resolve(event.data.data);
      };

      window.addEventListener('message', handleResponse);
      window.postMessage({
        type: 'BUG_TRACER_GET_DATA'
      }, '*');

      // Timeout after 1 second
      setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        resolve({ consoleLogs: [], networkRequests: [], isRecording: false });
      }, 1000);
    });
  }

  /**
   * Handle messages from background script
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'START_SCREEN_RECORDING':
        startScreenRecording(message.streamId).then(response => {
          sendResponse(response);
        });
        return true; // Keep message channel open for async response

      case 'STOP_SCREEN_RECORDING':
        stopScreenRecording().then(response => {
          sendResponse(response);
        });
        return true; // Keep message channel open for async response

      case 'START_RECORDING':
        startRecording();
        sendResponse({ success: true });
        break;

      case 'STOP_RECORDING':
        stopRecording();
        sendResponse({ success: true });
        break;

      case 'GET_CAPTURED_DATA':
        getCapturedData().then(data => {
          sendResponse(data);
        });
        return true; // Keep message channel open for async response

      case 'GET_PAGE_INFO':
        sendResponse({
          url: window.location.href,
          title: document.title,
          ready: injectedScriptReady,
          recording: isRecording
        });
        break;

      case 'PING':
        sendResponse({ pong: true, ready: injectedScriptReady });
        break;
    }
  });

  /**
   * Initialize content script
   */
  function initialize() {
    // Inject the script into page context
    injectScript();
    
    // Inject the floating widget
    injectFloatingWidget();

    // Listen for messages from injected script
    window.addEventListener('message', handleInjectedMessage);

    // Wait a moment for scripts to load, then notify background script
    setTimeout(() => {
      sendToBackground('CONTENT_SCRIPT_READY', {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
      });
    }, 100);

    // Handle page navigation (for SPAs)
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        sendToBackground('PAGE_NAVIGATED', {
          url: window.location.href,
          title: document.title,
          timestamp: Date.now()
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose API for debugging
  window.bugTracerContentAPI = {
    startRecording,
    stopRecording,
    getCapturedData,
    isRecording: () => isRecording,
    isReady: () => injectedScriptReady
  };

})();
