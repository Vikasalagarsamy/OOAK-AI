#!/usr/bin/env node

/**
 * OOAK Call Manager Pro - Call Monitoring Diagnostic Tool
 * This script helps diagnose why call monitoring isn't working
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');

console.log('🔍 OOAK Call Manager Pro - Call Monitoring Diagnostics');
console.log('=' .repeat(60));

// Test API connectivity
async function testAPIConnectivity() {
    console.log('\n📡 Testing API Connectivity...');
    
    const endpoints = [
        'http://localhost:3000/api/call-upload',
        'http://localhost:3000/api/call-uploads',
        'http://127.0.0.1:3000/api/call-upload',
        'http://192.168.1.100:3000/api/call-upload', // Common local IP
    ];
    
    for (const endpoint of endpoints) {
        try {
            await testEndpoint(endpoint);
        } catch (error) {
            console.log(`❌ ${endpoint} - ${error.message}`);
        }
    }
}

function testEndpoint(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, (res) => {
            console.log(`✅ ${url} - Status: ${res.statusCode}`);
            resolve();
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Check if CRM server is running
async function checkCRMServer() {
    console.log('\n🖥️  Checking CRM Server Status...');
    
    return new Promise((resolve) => {
        exec('netstat -an | grep :3000', (error, stdout, stderr) => {
            if (stdout.includes(':3000')) {
                console.log('✅ CRM Server appears to be running on port 3000');
                console.log('📋 Active connections:');
                console.log(stdout);
            } else {
                console.log('❌ No service found on port 3000');
                console.log('💡 Try starting your CRM server with: npm run dev');
            }
            resolve();
        });
    });
}

// Check Android device connectivity
async function checkAndroidDevice() {
    console.log('\n📱 Checking Android Device...');
    
    return new Promise((resolve) => {
        exec('adb devices', (error, stdout, stderr) => {
            if (error) {
                console.log('❌ ADB not found. Install Android SDK tools.');
                resolve();
                return;
            }
            
            const devices = stdout.split('\n').filter(line => 
                line.includes('device') && !line.includes('List of devices')
            );
            
            if (devices.length > 0) {
                console.log('✅ Android device(s) connected:');
                devices.forEach(device => console.log(`   📱 ${device}`));
                
                // Check if our app is installed
                exec('adb shell pm list packages | grep com.ooak.callmanager', (err, out) => {
                    if (out.includes('com.ooak.callmanager')) {
                        console.log('✅ OOAK Call Manager app is installed');
                        checkAppPermissions();
                    } else {
                        console.log('❌ OOAK Call Manager app not found');
                        console.log('💡 Install the app first');
                    }
                });
            } else {
                console.log('❌ No Android devices connected');
                console.log('💡 Connect your device and enable USB debugging');
            }
            resolve();
        });
    });
}

// Check app permissions
function checkAppPermissions() {
    console.log('\n🔐 Checking App Permissions...');
    
    const permissions = [
        'android.permission.READ_PHONE_STATE',
        'android.permission.CALL_PHONE',
        'android.permission.READ_CALL_LOG',
        'android.permission.RECORD_AUDIO'
    ];
    
    permissions.forEach(permission => {
        exec(`adb shell dumpsys package com.ooak.callmanager | grep ${permission}`, 
            (error, stdout) => {
                if (stdout.includes('granted=true')) {
                    console.log(`✅ ${permission} - GRANTED`);
                } else {
                    console.log(`❌ ${permission} - NOT GRANTED`);
                }
            }
        );
    });
}

// Generate test call data
function generateTestCallData() {
    console.log('\n🧪 Generating Test Call Data...');
    
    const testCall = {
        phoneNumber: '+919876543210',
        contactName: 'Test Contact',
        direction: 'outgoing',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 300000).toISOString(), // 5 minutes later
        duration: 300,
        employeeId: 'EMP001',
        status: 'completed'
    };
    
    console.log('📋 Test call data:');
    console.log(JSON.stringify(testCall, null, 2));
    
    return testCall;
}

// Main diagnostic function
async function runDiagnostics() {
    try {
        await testAPIConnectivity();
        await checkCRMServer();
        await checkAndroidDevice();
        
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('1. Ensure CRM server is running: npm run dev');
        console.log('2. Check Android app permissions in Settings');
        console.log('3. Verify network connectivity between device and server');
        console.log('4. Check Android logs: adb logcat | grep CallMonitoring');
        console.log('5. Test with a manual call to see if detection works');
        
        console.log('\n📞 To test call monitoring:');
        console.log('1. Make a call from your phone');
        console.log('2. Check Android logs: adb logcat | grep "Call state changed"');
        console.log('3. Look for API requests in your CRM server logs');
        
        generateTestCallData();
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
    }
}

// Run diagnostics
runDiagnostics(); 