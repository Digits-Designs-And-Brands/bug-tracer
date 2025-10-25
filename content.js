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
   * Handle messages from injected script
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
        isRecording = false;
        sendToBackground('RECORDING_DATA_CAPTURED', {
          consoleLogs: event.data.data.consoleLogs,
          networkRequests: event.data.data.networkRequests,
          url: window.location.href,
          timestamp: Date.now()
        });
        break;
    }
  }

  /**
   * Start recording console logs and network requests
   */
  function startRecording() {
    if (!injectedScriptReady) {
      console.warn('Bug Tracer: Injected script not ready');
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

    // Listen for messages from injected script
    window.addEventListener('message', handleInjectedMessage);

    // Notify background script that content script is ready
    sendToBackground('CONTENT_SCRIPT_READY', {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    });

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
