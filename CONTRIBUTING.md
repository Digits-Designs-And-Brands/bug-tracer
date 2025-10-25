# Contributing to Bug Tracer

Thank you for your interest in contributing to Bug Tracer! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Adding New Upload Providers](#adding-new-upload-providers)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

This project follows a code of conduct that we expect all contributors to adhere to:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/bug-tracer.git
   cd bug-tracer
   ```
3. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Chrome browser (version 88+ for Manifest V3 support)
- Basic knowledge of JavaScript, HTML, and CSS
- Understanding of Chrome extension development

### Local Development

1. **Load the extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the project folder

2. **Make changes** to the source files

3. **Test your changes**:
   - Click the refresh icon on the extension in `chrome://extensions/`
   - Test the functionality in a new tab

4. **Debug** using Chrome DevTools:
   - Right-click the extension icon → "Inspect popup"
   - Use the Console tab for debugging

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues and improve stability
- **New features**: Add new functionality
- **Upload providers**: Add support for new cloud storage services
- **UI/UX improvements**: Enhance the user interface
- **Documentation**: Improve documentation and examples
- **Testing**: Add tests and improve test coverage

### Code Style

- Use **ES6+** JavaScript features
- Follow **consistent indentation** (2 spaces)
- Use **descriptive variable and function names**
- Add **comments** for complex logic
- Keep functions **small and focused**

### File Structure

```
tracer-extension/
├── manifest.json              # Extension manifest
├── background.js              # Service worker
├── content.js                 # Content script
├── injected.js                # Page context script
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup functionality
├── storage.js                 # IndexedDB wrapper
├── upload-manager.js          # Upload provider manager
├── cloudinary.js              # Cloudinary provider
├── upload-providers/          # Upload provider implementations
│   ├── base-provider.js       # Base provider interface
│   ├── aws-s3-provider.js     # AWS S3 provider
│   └── generic-http-provider.js # Generic HTTP provider
├── settings.html              # Settings page
├── settings.js                # Settings functionality
├── styles.css                 # UI styling
└── icons/                     # Extension icons
```

## Adding New Upload Providers

To add support for a new cloud storage service:

1. **Create a new provider file** in `upload-providers/`:
   ```javascript
   class YourProvider extends BaseUploadProvider {
     constructor(config = {}) {
       super(config);
       this.name = 'Your Service';
       // Initialize your provider
     }

     validateConfig() {
       // Validate required configuration
     }

     async uploadVideo(videoBlob, metadata = {}, onProgress = null) {
       // Implement upload logic
     }

     async deleteFile(fileId) {
       // Implement delete logic (optional)
     }

     async testConnection() {
       // Implement connection test
     }

     getConfigSchema() {
       // Return configuration schema for UI
     }
   }
   ```

2. **Register the provider** in `upload-manager.js`:
   ```javascript
   if (typeof YourProvider !== 'undefined') {
     this.providers.set('your-provider', YourProvider);
   }
   ```

3. **Include the script** in `popup.html` and `settings.html`:
   ```html
   <script src="upload-providers/your-provider.js"></script>
   ```

4. **Test thoroughly** with different file sizes and network conditions

### Provider Requirements

All providers must implement:

- `validateConfig()`: Validate configuration
- `uploadVideo()`: Upload video blob with progress callback
- `testConnection()`: Test provider connectivity
- `getConfigSchema()`: Return UI configuration schema

Optional methods:
- `deleteFile()`: Delete uploaded files
- `uploadRecording()`: Upload with metadata (inherited from base)

## Testing

### Manual Testing

1. **Test recording functionality**:
   - Start/stop recording
   - Verify console logs are captured
   - Verify network requests are captured

2. **Test upload providers**:
   - Configure each provider
   - Test connection
   - Upload recordings
   - Verify upload success

3. **Test edge cases**:
   - Large file uploads
   - Network interruptions
   - Invalid configurations

### Automated Testing

We're working on adding automated tests. For now, please test manually and document any issues.

## Submitting Changes

### Pull Request Process

1. **Ensure your changes work**:
   - Test thoroughly in Chrome
   - Verify no console errors
   - Test with different providers

2. **Update documentation** if needed:
   - Update README.md for new features
   - Add comments for complex code
   - Update provider documentation

3. **Create a pull request**:
   - Use a descriptive title
   - Explain what your changes do
   - Reference any related issues
   - Include screenshots for UI changes

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] New upload provider
- [ ] Documentation update
- [ ] UI/UX improvement

## Testing
- [ ] Tested in Chrome extension
- [ ] Tested with multiple providers
- [ ] No console errors
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Additional Notes
Any additional information
```

## Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Check the README and code comments

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to Bug Tracer! 🐛🎥
