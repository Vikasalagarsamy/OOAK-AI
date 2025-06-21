#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');

console.log('🔍 Monitoring API call frequency...');
console.log('📊 This will track GET /api/call-monitoring requests for 60 seconds');

let callCount = 0;
let startTime = Date.now();

// Monitor for 60 seconds
const monitorInterval = setInterval(() => {
  exec('ps aux | grep "next dev" | grep -v grep | wc -l', (error, stdout) => {
    if (stdout.trim() === '0') {
      console.log('❌ Next.js dev server not running');
      clearInterval(monitorInterval);
      process.exit(1);
    }
  });
}, 5000);

// Stop monitoring after 60 seconds
setTimeout(() => {
  clearInterval(monitorInterval);
  const elapsed = (Date.now() - startTime) / 1000;
  console.log('');
  console.log('📈 MONITORING RESULTS:');
  console.log(`⏱️  Duration: ${elapsed.toFixed(1)} seconds`);
  console.log(`📞 Total API calls: ${callCount}`);
  console.log(`🔄 Calls per second: ${(callCount / elapsed).toFixed(2)}`);
  console.log(`📊 Calls per minute: ${((callCount / elapsed) * 60).toFixed(0)}`);
  
  if (callCount > 10) {
    console.log('⚠️  WARNING: High API call frequency detected!');
    console.log('💡 Recommendations:');
    console.log('   - Check if multiple browser tabs are open');
    console.log('   - Verify auto-refresh is disabled by default');
    console.log('   - Consider increasing cache duration');
  } else {
    console.log('✅ API call frequency looks normal');
  }
  
  // Clean up the script
  fs.unlinkSync(__filename);
  process.exit(0);
}, 60000);

// Simple way to estimate API calls by checking response times
const checkAPIActivity = () => {
  exec(`curl -s -w "%{time_total}" "http://192.168.0.243:3000/api/call-monitoring" -o /dev/null`, (error, stdout) => {
    if (!error && stdout) {
      callCount++;
      const responseTime = parseFloat(stdout) * 1000;
      console.log(`📞 API call #${callCount} - Response: ${responseTime.toFixed(0)}ms`);
    }
  });
};

// Check every 5 seconds
setInterval(checkAPIActivity, 5000);

console.log('🎯 Starting monitoring... (will auto-stop in 60 seconds)');
console.log(''); 