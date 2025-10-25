#!/usr/bin/env node

/**
 * Generate dynamic release notes for Bug Tracer Chrome Extension
 * Extracts information from package.json, README.md, and git history
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getPackageInfo() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function getManifestInfo() {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function getReadmeFeatures() {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readme = fs.readFileSync(readmePath, 'utf8');
  
  // Extract features section
  const featuresMatch = readme.match(/## ✨ Features([\s\S]*?)(?=## |$)/);
  if (featuresMatch) {
    return featuresMatch[1].trim();
  }
  return '';
}

function getRecentCommits(limit = 10) {
  try {
    const commits = execSync(`git log --oneline -${limit} --pretty=format:"%h %s"`, { encoding: 'utf8' });
    return commits.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    console.warn('Could not get git commits:', error.message);
    return [];
  }
}

function getChangelogInfo() {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    // Extract the latest version section
    const versionMatch = changelog.match(/## \[([^\]]+)\][\s\S]*?(?=## \[|$)/);
    if (versionMatch) {
      return versionMatch[0].trim();
    }
  }
  return null;
}

function getVersionInfo() {
  const packageInfo = getPackageInfo();
  const manifestInfo = getManifestInfo();
  
  return {
    name: packageInfo.name,
    version: packageInfo.version,
    description: packageInfo.description,
    manifestVersion: manifestInfo.version,
    author: packageInfo.author,
    license: packageInfo.license
  };
}

function generateReleaseNotes() {
  const versionInfo = getVersionInfo();
  const features = getReadmeFeatures();
  const recentCommits = getRecentCommits();
  const changelogInfo = getChangelogInfo();
  
  // Get current date
  const releaseDate = new Date().toISOString().split('T')[0];
  
  // Generate release notes
  const releaseNotes = `## 🚀 Bug Tracer Chrome Extension v${versionInfo.version}

### 📋 About
${versionInfo.description}

### ✨ Key Features
${features}

### 📦 Installation
1. Download the \`bug-tracer-extension.zip\` file
2. Extract the zip file
3. Open Chrome and go to \`chrome://extensions/\`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extracted folder

### 🔧 Configuration
- **Upload Providers**: Configure Cloudinary, AWS S3, or custom HTTP endpoints
- **Privacy**: All data stored locally by default
- **Permissions**: Minimal required permissions for security

${changelogInfo ? `### 📝 What's New
${changelogInfo}

` : ''}### 📝 Recent Changes
${recentCommits.length > 0 ? recentCommits.map(commit => `- ${commit}`).join('\n') : '- Various improvements and bug fixes'}

### 🏷️ Version Info
- **Extension Version**: ${versionInfo.manifestVersion}
- **Package Version**: ${versionInfo.version}
- **Release Date**: ${releaseDate}
- **License**: ${versionInfo.license}

### 🔗 Links
- [GitHub Repository](https://github.com/Digits-Designs-And-Brands/bug-tracer)
- [Report Issues](https://github.com/Digits-Designs-And-Brands/bug-tracer/issues)
- [Documentation](https://github.com/Digits-Designs-And-Brands/bug-tracer#readme)

---
*Generated automatically on ${releaseDate}*`;

  return releaseNotes;
}

// If run directly, output the release notes
if (require.main === module) {
  try {
    const releaseNotes = generateReleaseNotes();
    console.log(releaseNotes);
  } catch (error) {
    console.error('Error generating release notes:', error.message);
    process.exit(1);
  }
}

module.exports = { generateReleaseNotes, getVersionInfo, getRecentCommits };
