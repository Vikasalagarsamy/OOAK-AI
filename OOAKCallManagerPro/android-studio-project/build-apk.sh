#!/bin/bash

# OOAK Call Manager Pro - Build Script
# This script builds the Android APK with proper Java environment setup

echo "🚀 Building OOAK Call Manager Pro APK..."

# Set Java Home to Android Studio's bundled JDK
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Check if Java is available
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please ensure Android Studio is installed."
    exit 1
fi

echo "☕ Using Java: $(java -version 2>&1 | head -n 1)"

# Clean previous build
echo "🧹 Cleaning previous build..."
./gradlew clean

# Build debug APK (skip lint for faster build)
echo "🔨 Building debug APK..."
./gradlew assembleDebug -x lintDebug

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📱 Debug APK location: app/build/outputs/apk/debug/app-debug.apk"
    echo "📱 Release APK location: app/build/outputs/apk/release/app-release-unsigned.apk"
    
    # Show APK info
    echo ""
    echo "📊 APK Information:"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
    
    echo ""
    echo "🎉 OOAK Call Manager Pro APK built successfully!"
    echo "💡 You can now install the APK on your Android device for testing."
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi 