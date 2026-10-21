#!/bin/bash

# WRFCoin Frontend - Storybook Auto-Import Setup Script
# This script sets up and runs the Storybook auto-import system

echo "🚀 WRFCoin Storybook Auto-Import Setup"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Check if Storybook is installed
if [ ! -d "node_modules/@storybook" ]; then
    echo "❌ Error: Storybook dependencies not found. Please run 'npm install' first"
    exit 1
fi

echo "📦 Generating stories for all components..."
npm run storybook:generate

if [ $? -eq 0 ]; then
    echo "✅ Successfully generated stories for all components!"
    echo ""
    echo "📊 Summary:"
    echo "- Components scanned: $(find src/components -name "*.jsx" -o -name "*.tsx" | wc -l)"
    echo "- Stories generated: $(find src/stories/auto-generated -name "*.stories.ts" | wc -l)" 
    echo "- Categories: $(find src/stories/auto-generated -mindepth 1 -type d | wc -l)"
    echo ""
    echo "🎉 Storybook is ready! Run one of these commands:"
    echo ""
    echo "  npm run storybook          # Start Storybook development server"
    echo "  npm run storybook:dev      # Regenerate stories and start server"  
    echo "  npm run build-storybook    # Build Storybook for production"
    echo ""
    echo "📖 Documentation available at:"
    echo "  - STORYBOOK_AUTO_IMPORT.md (comprehensive guide)"
    echo "  - .storybook/main.ts (configuration)"
    echo "  - .storybook/generate-stories.js (auto-generation script)"
    echo ""
    echo "🌐 Access Storybook at: http://localhost:6006"
else
    echo "❌ Error: Story generation failed. Check the logs above for details."
    exit 1
fi