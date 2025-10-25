#!/bin/bash

# Chrome Web Store Packaging Script for Bug Tracer
# This script creates a clean package suitable for Chrome Web Store submission

echo "🚀 Packaging Bug Tracer for Chrome Web Store..."

# Create build directory
mkdir -p build

# Copy essential files
echo "📁 Copying extension files..."
cp manifest.json build/
cp *.js build/
cp *.html build/
cp *.css build/
cp -r upload-providers build/
cp -r icons build/

# Remove development files
echo "🧹 Cleaning up development files..."
rm -f build/package*.json
rm -f build/.gitignore
rm -f build/LICENSE
rm -f build/CONTRIBUTING.md

# Create zip file
echo "📦 Creating extension package..."
cd build
zip -r ../bug-tracer-extension.zip . -x "*.DS_Store" "*.git*"
cd ..

# Clean up build directory
rm -rf build

echo "✅ Package created: bug-tracer-extension.zip"
echo "📏 Package size: $(du -h bug-tracer-extension.zip | cut -f1)"
echo ""
echo "🎯 Ready for Chrome Web Store submission!"
echo "📋 Next steps:"
echo "   1. Go to Chrome Web Store Developer Dashboard"
echo "   2. Upload bug-tracer-extension.zip"
echo "   3. Fill out the store listing information"
echo "   4. Submit for review"
echo ""
echo "📚 Check the README.md for detailed instructions"
