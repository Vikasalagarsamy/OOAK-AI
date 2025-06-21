#!/usr/bin/env node

const qrcode = require('qrcode-terminal');

const expoUrl = 'exp://192.168.29.161:8081';

console.log('\n🚀 OOAK Call Manager Pro - QR Code Connection');
console.log('='.repeat(60));
console.log(`📱 Expo URL: ${expoUrl}`);
console.log('='.repeat(60));

console.log('\n📱 QR Code for Expo Go App:');
console.log('-'.repeat(40));

qrcode.generate(expoUrl, { small: true }, function (qrcode) {
  console.log(qrcode);
  console.log('-'.repeat(40));
  console.log('\n📋 Instructions:');
  console.log('1. Open Expo Go app on your Samsung Galaxy S24 Ultra');
  console.log('2. Either:');
  console.log('   • Scan the QR code above, OR');
  console.log('   • Tap "Enter URL manually" and enter: exp://192.168.29.161:8081');
  console.log('3. Tap "Connect"');
  console.log('\n✅ Your OOAK Call Manager Pro app should load!');
  console.log('='.repeat(60));
}); 