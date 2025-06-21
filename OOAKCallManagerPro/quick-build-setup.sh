#!/bin/bash

# 🚀 OOAK Call Manager Pro - Quick Build Setup Script
# This script helps prepare your Android Studio project

echo "📱 OOAK Call Manager Pro - Quick Build Setup"
echo "============================================="

# Check if Android Studio is installed
if command -v studio &> /dev/null; then
    echo "✅ Android Studio found"
else
    echo "❌ Android Studio not found"
    echo "📥 Please download from: https://developer.android.com/studio"
    echo "   Install with default settings and accept all SDK licenses"
    exit 1
fi

# Create project structure
echo "📁 Creating Android Studio project structure..."

mkdir -p android-studio-project/app/src/main/java/com/ooak/callmanager
mkdir -p android-studio-project/app/src/main/res/layout
mkdir -p android-studio-project/app/src/main/res/values
mkdir -p android-studio-project/app/src/main/res/xml
mkdir -p android-studio-project/app/src/main/res/drawable

# Copy all source files
echo "📋 Copying source files..."

# Java files
cp -r android-app/api android-studio-project/app/src/main/java/com/ooak/callmanager/
cp -r android-app/services android-studio-project/app/src/main/java/com/ooak/callmanager/
cp -r android-app/models android-studio-project/app/src/main/java/com/ooak/callmanager/
cp -r android-app/utils android-studio-project/app/src/main/java/com/ooak/callmanager/
cp -r android-app/receivers android-studio-project/app/src/main/java/com/ooak/callmanager/
cp android-app/MainActivity.java android-studio-project/app/src/main/java/com/ooak/callmanager/

# Resource files
cp android-app/res/layout/* android-studio-project/app/src/main/res/layout/
cp android-app/res/values/* android-studio-project/app/src/main/res/values/
cp android-app/res/xml/* android-studio-project/app/src/main/res/xml/

# Configuration files
cp android-app/AndroidManifest.xml android-studio-project/app/src/main/
cp android-app/build.gradle android-studio-project/app/

echo "✅ Project structure created successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Open Android Studio"
echo "2. Open existing project: $(pwd)/android-studio-project"
echo "3. Wait for Gradle sync"
echo "4. Build → Generate Signed Bundle/APK"
echo ""
echo "📱 Your OOAK Call Manager Pro is ready to build!" 