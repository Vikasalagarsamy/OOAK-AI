#!/usr/bin/env node

// Quick test to verify Android app permissions are working
console.log('🔍 Testing Android App Permissions...\n');

const { exec } = require('child_process');

// Test permission status
exec('adb shell dumpsys package com.ooak.callmanager | grep "granted=false"', (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Error checking permissions:', error);
        return;
    }
    
    if (stdout.trim()) {
        console.log('❌ DENIED PERMISSIONS FOUND:');
        console.log(stdout);
        console.log('\n📋 Manual Fix Required:');
        console.log('1. Settings → Apps → OOAK Call Manager Pro → Permissions');
        console.log('2. Enable: Storage, Phone, Microphone');
        console.log('3. Settings → Apps → Special app access → Display over other apps');
        console.log('4. Enable OOAK Call Manager Pro');
    } else {
        console.log('✅ All critical permissions granted!');
        console.log('🚀 App should work properly now');
    }
});

// Test if app services are running
setTimeout(() => {
    exec('adb shell dumpsys activity services | grep -i callmonitor', (error, stdout, stderr) => {
        if (stdout.includes('CallMonitoringService')) {
            console.log('\n✅ CallMonitoringService is running');
        } else {
            console.log('\n⚠️ CallMonitoringService not detected');
            console.log('   Try tapping "Start Background Services" in the app');
        }
    });
}, 2000); 