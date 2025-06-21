const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
const port = 8081;

console.log('\n🚀 OOAK Call Manager Pro - Connection Details');
console.log('='.repeat(50));
console.log(`📱 Development Server: http://${ip}:${port}`);
console.log(`🔗 Expo URL: exp://${ip}:${port}`);
console.log('\n📋 Instructions:');
console.log('1. Open Expo Go app on your Samsung Galaxy S24 Ultra');
console.log('2. Tap "Enter URL manually"');
console.log(`3. Enter: exp://${ip}:${port}`);
console.log('4. Tap "Connect"');
console.log('\n✅ Your app should now load with SDK 53 compatibility!');
console.log('='.repeat(50)); 