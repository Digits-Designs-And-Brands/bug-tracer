/**
 * Injected script for capturing console logs and network requests
 * This script runs in the page context to access native APIs
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.bugTracerInjected) {
    return;
  }
  window.bugTracerInjected = true;

  // Storage for captured data
  const capturedData = {
    consoleLogs: [],
    networkRequests: [],
    isRecording: false
  };

  // Original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  // Original fetch and XMLHttpRequest
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  /**
   * Capture console logs
   */
  function captureConsoleLog(level, args) {
    if (!capturedData.isRecording) return;

    const timestamp = Date.now();
    const message = Array.from(args).map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logEntry = {
      timestamp,
      level,
      message,
      url: window.location.href,
      stack: new Error().stack
    };

    capturedData.consoleLogs.push(logEntry);

    // Send to content script
    window.postMessage({
      type: 'BUG_TRACER_CONSOLE_LOG',
      data: logEntry
    }, '*');
  }

  /**
   * Override console methods
   */
  function setupConsoleCapture() {
    ['log', 'error', 'warn', 'info', 'debug'].forEach(level => {
      console[level] = function(...args) {
        captureConsoleLog(level, args);
        originalConsole[level].apply(console, args);
      };
    });
  }

  /**
   * Capture network requests
   */
  function captureNetworkRequest(url, method, requestData, responseData, status, headers) {
    if (!capturedData.isRecording) return;

    const timestamp = Date.now();
    const requestEntry = {
      timestamp,
      url,
      method,
      requestData,
      responseData,
      status,
      headers,
      duration: Date.now() - timestamp
    };

    capturedData.networkRequests.push(requestEntry);

    // Send to content script
    window.postMessage({
      type: 'BUG_TRACER_NETWORK_REQUEST',
      data: requestEntry
    }, '*');
  }

  /**
   * Override fetch API
   */
  function setupFetchCapture() {
    window.fetch = async function(input, init = {}) {
      const url = typeof input === 'string' ? input : input.url;
      const method = init.method || 'GET';
      const requestData = {
        headers: init.headers,
        body: init.body
      };

      try {
        const response = await originalFetch(input, init);
        const responseClone = response.clone();
        
        let responseData = null;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await responseClone.json();
          } else if (contentType && contentType.includes('text/')) {
            responseData = await responseClone.text();
          }
        } catch (e) {
          responseData = '[Binary data]';
        }

        captureNetworkRequest(
          url,
          method,
          requestData,
          responseData,
          response.status,
          Object.fromEntries(response.headers.entries())
        );

        return response;
      } catch (error) {
        captureNetworkRequest(
          url,
          method,
          requestData,
          { error: error.message },
          0,
          {}
        );
        throw error;
      }
    };
  }

  /**
   * Override XMLHttpRequest
   */
  function setupXHRCapture() {
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._bugTracerMethod = method;
      this._bugTracerUrl = url;
      this._bugTracerStartTime = Date.now();
      return originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(data) {
      const xhr = this;
      const method = xhr._bugTracerMethod;
      const url = xhr._bugTracerUrl;
      const requestData = {
        headers: {},
        body: data
      };

      // Capture request headers
      if (xhr.setRequestHeader) {
        const originalSetRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(name, value) {
          requestData.headers[name] = value;
          return originalSetRequestHeader.call(this, name, value);
        };
      }

      // Capture response
      xhr.addEventListener('loadend', function() {
        let responseData = null;
        try {
          const contentType = xhr.getResponseHeader('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = JSON.parse(xhr.responseText);
          } else if (contentType && contentType.includes('text/')) {
            responseData = xhr.responseText;
          } else {
            responseData = '[Binary data]';
          }
        } catch (e) {
          responseData = xhr.responseText || '[No response data]';
        }

        const responseHeaders = {};
        const headerString = xhr.getAllResponseHeaders();
        if (headerString) {
          headerString.split('\r\n').forEach(line => {
            const parts = line.split(': ');
            if (parts.length === 2) {
              responseHeaders[parts[0]] = parts[1];
            }
          });
        }

        captureNetworkRequest(
          url,
          method,
          requestData,
          responseData,
          xhr.status,
          responseHeaders
        );
      });

      return originalXHRSend.apply(this, [data]);
    };
  }

  /**
   * Start recording
   */
  function startRecording() {
    capturedData.isRecording = true;
    capturedData.consoleLogs = [];
    capturedData.networkRequests = [];
    
    // Send start message to content script
    window.postMessage({
      type: 'BUG_TRACER_START_RECORDING',
      data: { timestamp: Date.now() }
    }, '*');
  }

  /**
   * Stop recording and return captured data
   */
  function stopRecording() {
    capturedData.isRecording = false;
    
    const data = {
      consoleLogs: [...capturedData.consoleLogs],
      networkRequests: [...capturedData.networkRequests]
    };

    // Send stop message to content script
    window.postMessage({
      type: 'BUG_TRACER_STOP_RECORDING',
      data
    }, '*');

    return data;
  }

  /**
   * Get current captured data
   */
  function getCapturedData() {
    return {
      consoleLogs: [...capturedData.consoleLogs],
      networkRequests: [...capturedData.networkRequests],
      isRecording: capturedData.isRecording
    };
  }

  /**
   * Listen for messages from content script
   */
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;

    switch (event.data.type) {
      case 'BUG_TRACER_START':
        startRecording();
        break;
      case 'BUG_TRACER_STOP':
        stopRecording();
        break;
      case 'BUG_TRACER_GET_DATA':
        event.source.postMessage({
          type: 'BUG_TRACER_DATA_RESPONSE',
          data: getCapturedData()
        }, '*');
        break;
    }
  });

  /**
   * Setup all captures
   */
  function initialize() {
    setupConsoleCapture();
    setupFetchCapture();
    setupXHRCapture();

    // Send ready message to content script
    window.postMessage({
      type: 'BUG_TRACER_READY',
      data: { timestamp: Date.now() }
    }, '*');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose API for debugging
  window.bugTracerAPI = {
    startRecording,
    stopRecording,
    getCapturedData,
    isRecording: () => capturedData.isRecording
  };

})();
