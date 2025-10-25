# Bug Tracer Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-brightgreen.svg)](https://chrome.google.com/webstore)
[![GitHub release](https://img.shields.io/github/release/Digits-Designs-And-Brands/bug-tracer.svg)](https://github.com/Digits-Designs-And-Brands/bug-tracer/releases)

A powerful Chrome extension for bug reporting with screen recording capabilities, similar to jam.dev. **Now with multi-provider upload support!**

## ✨ Features

- 🎥 **Screen Recording**: Capture screen and audio using MediaRecorder API
- 🎯 **Floating Widget**: Loom-style floating recording interface on the page
- 📝 **Console Logs**: Automatically capture all console logs (log, error, warn, info, debug)
- 🌐 **Network Requests**: Intercept and log all network requests (fetch, XHR) with request/response details
- 💾 **Local Storage**: Store recordings locally using IndexedDB
- ☁️ **Multi-Provider Upload**: Upload to Cloudinary, AWS S3, or any custom HTTP endpoint
- ⚙️ **Flexible Settings**: Configure multiple upload providers
- 🔒 **Privacy First**: All data stored locally by default

## Installation

1. **Load the Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select this folder

2. **Configure Upload Provider** (Optional):
   - Click the extension icon and then "Settings"
   - Choose from supported providers:
     - **Cloudinary**: Free tier available, easy setup
     - **AWS S3**: Enterprise-grade storage
     - **Generic HTTP**: Use your own upload endpoint
   - Follow the setup instructions for your chosen provider
   - Test the connection and save

## Usage

### Recording a Bug

1. **Start Recording**:
   - Click the extension icon
   - Click "Start Recording"
   - Select the screen/tab you want to record
   - Choose whether to include audio

2. **Reproduce the Bug**:
   - Navigate to the page with the issue
   - Reproduce the bug steps
   - All console logs and network requests are automatically captured
   - A floating widget appears on the page showing recording status

3. **Stop Recording**:
   - Click "Stop Recording" in the extension popup OR
   - Click "Stop" in the floating widget on the page
   - The recording is automatically saved locally

### Managing Recordings

- **View Recordings**: All recordings appear in the popup with metadata
- **Detailed Analysis**: Click "View" to see comprehensive recording analysis
- **Upload to Cloud**: Click "Upload" to share recordings online
- **Delete**: Remove recordings you no longer need

### Recording Analysis Page

When you click "View" on a recording, you'll see a comprehensive analysis page with:

- **📋 Recording Information**: Title, URL, duration, date, file size
- **🎬 Video Player**: Full-screen video playback with custom controls
- **📊 Console Logs**: All captured console messages (log, error, warn, info, debug)
- **🌐 Network Requests**: Complete request/response details with headers and bodies
- **🚀 Actions**: Download, upload, share, or start new recording

## 📤 Supported Upload Providers

### Cloudinary
- **Free tier**: 25GB storage, 25GB bandwidth
- **Easy setup**: Just need cloud name and upload preset
- **Features**: Automatic video optimization, CDN delivery
- **Setup**: [cloudinary.com](https://cloudinary.com)

### AWS S3
- **Enterprise-grade**: Scalable cloud storage
- **Flexible**: Pay-as-you-use pricing
- **Features**: High availability, global distribution
- **Setup**: AWS account + S3 bucket + IAM credentials

### Generic HTTP
- **Custom endpoints**: Use your own upload service
- **Flexible**: Support any HTTP-based upload API
- **Features**: Custom authentication, custom headers
- **Setup**: Any endpoint accepting multipart/form-data

## 🤝 Contributing

Bug Tracer is open source! We welcome contributions:

- 🐛 **Bug reports**: Found an issue? Let us know!
- ✨ **Feature requests**: Have an idea? We'd love to hear it!
- 🔧 **Code contributions**: Submit pull requests
- 📚 **Documentation**: Help improve our docs
- 🧪 **Testing**: Help us test new features

Please open an issue or submit a pull request on our [GitHub repository](https://github.com/Digits-Designs-And-Brands/bug-tracer).

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension format
- **Service Worker**: Background script for coordinating recording
- **Content Scripts**: Inject into web pages to capture data
- **IndexedDB**: Local storage for large video files
- **MediaRecorder API**: Screen recording with audio support
- **Provider Pattern**: Extensible upload provider system

### File Structure

```
tracer-extension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script
├── injected.js           # Page context script
├── floating-widget.js    # Loom-style floating recording widget
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── results.html          # Recording analysis page
├── results.js            # Results page functionality
├── storage.js            # IndexedDB wrapper
├── upload-manager.js     # Provider management
├── upload-providers/     # Upload provider implementations
│   ├── all-providers.js       # Single loader for all providers
│   ├── base-provider.js       # Base provider interface
│   ├── cloudinary-provider.js # Cloudinary provider
│   ├── aws-s3-provider.js     # AWS S3 provider
│   └── generic-http-provider.js # Generic HTTP provider
├── settings.html         # Settings page
├── settings.js           # Settings functionality
├── styles.css            # UI styling
└── README.md             # This file
```

### Permissions

- `activeTab`: Access current tab for recording
- `storage`: Save settings and configuration
- `scripting`: Inject scripts into pages
- `tabs`: Manage tab information
- `desktopCapture`: Capture screen content
- `<all_urls>`: Access all websites for bug reporting

## Development

### Prerequisites

- Chrome browser with developer mode enabled
- Basic understanding of Chrome extensions

### Local Development

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Test your changes

### Key Components

- **BugTracerStorage**: Handles IndexedDB operations
- **CloudinaryUploader**: Manages video uploads
- **BugTracerPopup**: Main UI controller
- **Background Service Worker**: Coordinates recording

## Troubleshooting

### Common Issues

1. **Recording not starting**:
   - Check if you have the necessary permissions
   - Ensure you're on a supported page (not chrome:// pages)

2. **Upload failing**:
   - Verify Cloudinary configuration
   - Check your internet connection
   - Ensure upload preset is set to "Unsigned"

3. **Console logs not captured**:
   - Refresh the page after installing the extension
   - Check if the page has CSP restrictions

### Browser Compatibility

- Chrome 88+ (for Manifest V3 support)
- Requires desktop capture permissions
- Works on all websites except restricted pages

## Security & Privacy

- All recordings are stored locally by default
- Cloudinary upload is optional and user-controlled
- No data is sent to external servers without explicit user action
- Console logs and network data are only captured during active recording

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Getting Started for Developers

### Prerequisites
- Chrome browser (version 88+)
- Basic knowledge of JavaScript and Chrome extensions

### Quick Start
1. Clone the repository
2. Load the extension in Chrome (Developer mode)
3. Start recording bugs!

## 🧪 Testing the Extension

### 1. Load the Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `tracer-extension` folder
5. The extension should appear in your extensions list with:
   - Name: Bug Tracer
   - Version: 1.0.0
   - Status: Enabled

### 2. Test the Extension Popup
1. Click the Bug Tracer icon in Chrome toolbar
2. You should see the popup with:
   - ✅ "Start Recording" button
   - ✅ "Recent Recordings" section (empty initially)
   - ✅ "Settings" button
3. Check for any console errors:
   - Right-click the extension icon
   - Select "Inspect popup"
   - Check Console tab for errors

### 3. Test Screen Recording
1. Click "Start Recording" in the popup
2. Chrome should ask for screen capture permission
3. Select a screen/tab to record
4. Choose whether to include audio
5. The popup should show:
   - ✅ "Stop Recording" button
   - ✅ Recording status indicator
   - ✅ Duration counter
6. Navigate to any website and interact with it
7. Click "Stop Recording"
8. Check that recording appears in the list

### 4. Test Data Capture
1. Start a new recording
2. Open a website with console logs (try opening DevTools and running `console.log("test")`)
3. Make some network requests (refresh page, click links)
4. Stop the recording
5. Check that the recording includes:
   - ✅ Video file
   - ✅ Console logs
   - ✅ Network requests
   - ✅ Page metadata

### 5. Test Upload Providers
1. Click "Settings" in the popup
2. Select a provider (Cloudinary, AWS S3, or Generic HTTP)
3. Fill in the configuration fields
4. Click "Test Connection"
5. If successful, save the configuration
6. Go back to recordings list
7. Click "Upload" on a recording
8. Verify upload progress and success

### 6. Test Local Storage
1. Create multiple recordings
2. Check that they all appear in the list
3. Try deleting a recording
4. Verify it's removed from the list
5. Check browser storage:
   - Open DevTools → Application → IndexedDB
   - Look for "BugTracerDB" database

### 7. Debug Common Issues
- **Extension not loading**: Check manifest.json syntax
- **Recording not starting**: Check permissions in manifest
- **Console errors**: Check popup console and background script console
- **Upload failing**: Check provider configuration and network
- **Data not captured**: Check if content script is injected properly

### 8. Performance Testing
1. Record a long session (5+ minutes)
2. Check memory usage in Chrome Task Manager
3. Test with large network responses
4. Verify IndexedDB storage limits
5. Test on different websites and SPAs

### Adding New Upload Providers

The extension uses a centralized provider loading system. To add a new upload provider:

1. **Create Provider File**: Add your provider in `upload-providers/your-provider.js`
2. **Extend Base Class**: Your provider should extend `BaseUploadProvider`
3. **Update Loader**: Add your provider to the `PROVIDER_FILES` array in `upload-providers/all-providers.js`
4. **Register Provider**: Add your provider class to the `PROVIDER_CLASSES` array in the same file
5. **Update Manager**: Register your provider in `upload-manager.js`

The `all-providers.js` file automatically loads all providers in the correct order, so you only need to update that one file when adding new providers.

Check our [GitHub repository](https://github.com/Digits-Designs-And-Brands/bug-tracer) for detailed instructions and examples.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Digits-Designs-And-Brands/bug-tracer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Digits-Designs-And-Brands/bug-tracer/discussions)
- **Documentation**: Check the code comments and this README

## 🙏 Acknowledgments

- Inspired by [jam.dev](https://jam.dev) and similar bug reporting tools
- Built with modern web technologies and Chrome extension APIs
- Community contributions and feedback

---

**Made with ❤️ for developers who want better bug reporting tools**
