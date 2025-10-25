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

    // Request screen capture
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'screen',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: true // Include system audio if available
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
      await saveRecording(blob, duration, tab);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      recordedChunks = [];
      mediaRecorder = null;
      recordingStartTime = null;
    };

    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    isRecording = true;
    currentTabId = tab.id;

    // Notify content script to start capturing console/network data
    await chrome.tabs.sendMessage(tab.id, { type: 'START_RECORDING' });

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
    if (!mediaRecorder || !isRecording) {
      throw new Error('No active recording to stop');
    }

    // Stop MediaRecorder
    mediaRecorder.stop();
    isRecording = false;

    // Notify content script to stop capturing data
    if (currentTabId) {
      await chrome.tabs.sendMessage(currentTabId, { type: 'STOP_RECORDING' });
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
