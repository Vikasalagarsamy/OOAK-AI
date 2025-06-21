#!/bin/bash

# OOAK Call Manager - Deployment Script
# This script builds and installs the app on connected Android devices

echo "🚀 OOAK Call Manager - Deployment Script"
echo "========================================"

# Check if Android device is connected
echo "📱 Checking for connected Android devices..."
adb devices

# Check if any device is connected
DEVICE_COUNT=$(adb devices | grep -c "device$")
if [ $DEVICE_COUNT -eq 0 ]; then
    echo "❌ No Android devices connected!"
    echo "Please connect an Android device with USB debugging enabled."
    exit 1
fi

echo "✅ Found $DEVICE_COUNT Android device(s)"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean
cd ..

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the app
echo "🔨 Building the app..."
cd android
./gradlew assembleRelease
cd ..

# Check if build was successful
if [ ! -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    echo "❌ Build failed! APK not found."
    exit 1
fi

echo "✅ Build successful!"

# Install on connected devices
echo "📲 Installing on connected devices..."
adb install -r android/app/build/outputs/apk/release/app-release.apk

if [ $? -eq 0 ]; then
    echo "✅ Installation successful!"
    echo ""
    echo "🎉 OOAK Call Manager has been installed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Open the app on your device"
    echo "2. Grant all required permissions"
    echo "3. Go to Settings and configure API credentials"
    echo "4. Test the connection"
    echo "5. Start receiving call requests!"
    echo ""
    echo "📞 The app is ready for professional call management!"
else
    echo "❌ Installation failed!"
    echo "Please check device connection and try again."
    exit 1
fi 