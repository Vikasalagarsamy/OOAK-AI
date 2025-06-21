#!/bin/bash

echo "🔍 Checking OOAK Call Manager Pro Permissions..."
echo "================================================"

# Check for denied permissions
denied_perms=$(adb shell dumpsys package com.ooak.callmanager | grep "granted=false")

if [ -z "$denied_perms" ]; then
    echo "✅ All permissions granted!"
else
    echo "❌ DENIED PERMISSIONS:"
    echo "$denied_perms"
    echo ""
    echo "📋 FIX THESE MANUALLY:"
    echo "1. Settings → Apps → OOAK Call Manager Pro → Permissions"
    echo "   → Enable: Storage, Phone, Microphone" 
    echo "2. Settings → Apps → Special app access → Display over other apps"
    echo "   → Enable OOAK Call Manager Pro"
fi

echo ""
echo "🔍 Checking if CallMonitoringService is running..."
service_status=$(adb shell dumpsys activity services | grep -i callmonitor)
if [[ $service_status == *"CallMonitoringService"* ]]; then
    echo "✅ CallMonitoringService is RUNNING"
else
    echo "⚠️ CallMonitoringService NOT running"
    echo "   → Tap 'Start Background Services' in the app"
fi 