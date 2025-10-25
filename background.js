/**
 * Background service worker for Bug Tracer extension
 * Coordinates screen recording and data capture
 */

// Global state
let isRecording = false;
let currentTabId = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = null;
let capturedData = {
  consoleLogs: [],
  networkRequests: []
};

/**
 * Get the current active tab
 */
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Start screen recording
 */
async function startScreenRecording() {
  try {
    const tab = await getCurrentTab();
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Request desktop capture permission
    const streamId = await new Promise((resolve, reject) => {
      chrome.desktopCapture.chooseDesktopMedia(
        ['screen', 'window', 'tab'],
        tab,
        (streamId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!streamId) {
            reject(new Error('User cancelled screen capture'));
          } else {
            resolve(streamId);
          }
        }
      );
    });

    // Ensure content script is injected and ready
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (error) {
      console.log('Content script already injected or failed to inject:', error);
    }

    // Wait for content script to be ready
    let contentScriptReady = false;
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!contentScriptReady && attempts < maxAttempts) {
      try {
        const pingResponse = await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        if (pingResponse && pingResponse.ready) {
          contentScriptReady = true;
        }
      } catch (error) {
        // Content script not ready yet
      }
      
      if (!contentScriptReady) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    if (!contentScriptReady) {
      throw new Error('Content script not ready after waiting');
    }

    // Send the stream ID to the content script to handle recording
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'START_SCREEN_RECORDING',
      streamId: streamId
    });

    if (response && response.success) {
      isRecording = true;
      currentTabId = tab.id;
      recordingStartTime = Date.now();
    } else {
      throw new Error(response?.error || 'Failed to start recording in content script');
    }

    return { success: true, tabId: tab.id };
  } catch (error) {
    console.error('Failed to start recording:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop screen recording
 */
async function stopScreenRecording() {
  try {
    if (!isRecording) {
      throw new Error('No active recording to stop');
    }

    // Notify content script to stop recording
    if (currentTabId) {
      const response = await chrome.tabs.sendMessage(currentTabId, { type: 'STOP_SCREEN_RECORDING' });
      if (response && response.success) {
        isRecording = false;
        currentTabId = null;
        recordingStartTime = null;
        return { success: true };
      } else {
        throw new Error(response?.error || 'Failed to stop recording in content script');
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to stop recording:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save recording to IndexedDB
 */
async function saveRecording(videoBlob, duration, tab) {
  try {
    // Get captured data from content script
    const capturedData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CAPTURED_DATA' });

    const recordingData = {
      videoBlob,
      duration,
      url: tab.url,
      title: tab.title,
      consoleLogs: capturedData.consoleLogs || [],
      networkRequests: capturedData.networkRequests || []
    };

    // Save to storage (this will be handled by popup script)
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
 * Get recording status
 */
function getRecordingStatus() {
  return {
    isRecording,
    currentTabId,
    recordingStartTime,
    duration: recordingStartTime ? Date.now() - recordingStartTime : 0
  };
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_RECORDING':
      startScreenRecording().then(sendResponse);
      return true; // Keep message channel open for async response

    case 'STOP_RECORDING':
      stopScreenRecording().then(sendResponse);
      return true; // Keep message channel open for async response

    case 'GET_RECORDING_STATUS':
      sendResponse(getRecordingStatus());
      break;

    case 'CONTENT_SCRIPT_READY':
      console.log('Content script ready for tab:', sender.tab?.id);
      break;

    case 'INJECTED_SCRIPT_READY':
      console.log('Injected script ready for tab:', sender.tab?.id);
      break;

    case 'RECORDING_DATA_CAPTURED':
      capturedData = {
        consoleLogs: message.data.consoleLogs,
        networkRequests: message.data.networkRequests
      };
      break;

    case 'PAGE_NAVIGATED':
      console.log('Page navigated:', message.data.url);
      break;

    case 'SAVE_RECORDING':
      // Forward the recording data to the popup script for storage
      console.log('Recording saved:', message.data);
      sendResponse({ success: true });
      break;

    case 'PING':
      sendResponse({ pong: true, recording: isRecording });
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
});

/**
 * Handle tab updates
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isRecording && tabId === currentTabId) {
    // Re-inject content script if page reloaded during recording
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(error => {
      console.error('Failed to re-inject content script:', error);
    });
  }
});

/**
 * Handle tab removal
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (isRecording && tabId === currentTabId) {
    // Stop recording if the recorded tab is closed
    stopScreenRecording();
  }
});

/**
 * Handle extension installation/update
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Bug Tracer extension installed');
  } else if (details.reason === 'update') {
    console.log('Bug Tracer extension updated');
  }
});

/**
 * Handle service worker startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('Bug Tracer service worker started');
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    startScreenRecording,
    stopScreenRecording,
    getRecordingStatus
  };
}
