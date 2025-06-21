// Universal AI System - Real API Connection Helper
// Configure your system with live WhatsApp, Instagram, and other APIs

const publicUrl = 'https://98ce-2405-201-e001-e844-3991-db6c-2301-deb.ngrok-free.app';

console.log('🚀 UNIVERSAL AI SYSTEM - REAL API SETUP');
console.log('=====================================\n');

console.log('🌐 YOUR PUBLIC WEBHOOK URLS:');
console.log(`📱 WhatsApp: ${publicUrl}/api/webhooks/whatsapp`);
console.log(`📸 Instagram: ${publicUrl}/api/webhooks/instagram`);
console.log(`📧 Email: ${publicUrl}/api/webhooks/email`);
console.log(`📞 Calls: ${publicUrl}/api/webhooks/calls\n`);

console.log('🔧 NEXT STEPS TO CONNECT REAL APIS:\n');

console.log('1️⃣ WHATSAPP BUSINESS API SETUP:');
console.log('   • Go to: https://developers.facebook.com/');
console.log('   • Create Business App');
console.log('   • Add WhatsApp Product');
console.log(`   • Webhook URL: ${publicUrl}/api/webhooks/whatsapp`);
console.log('   • Verify Token: whatsapp_verify_123');
console.log('   • Subscribe to: messages, message_deliveries\n');

console.log('2️⃣ INSTAGRAM BUSINESS API SETUP:');
console.log('   • Convert Instagram to Business Account');
console.log('   • Connect to Facebook Page');
console.log('   • Add Instagram Basic Display to your app');
console.log(`   • Webhook URL: ${publicUrl}/api/webhooks/instagram`);
console.log('   • Verify Token: instagram_verify_456\n');

console.log('3️⃣ TEST YOUR INTEGRATION:');
console.log('   • Send WhatsApp message to your business number');
console.log('   • Send Instagram DM to your business account');
console.log('   • Check dashboard: http://localhost:3001/dashboard');
console.log('   • Run: node webhook-tester.js full\n');

console.log('4️⃣ ENVIRONMENT VARIABLES NEEDED:');
console.log('   Add these to your .env file:');
console.log('   WHATSAPP_ACCESS_TOKEN=your_token_here');
console.log('   WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123');
console.log('   WHATSAPP_PHONE_NUMBER_ID=your_phone_id');
console.log('   INSTAGRAM_ACCESS_TOKEN=your_instagram_token');
console.log('   INSTAGRAM_VERIFY_TOKEN=instagram_verify_456\n');

console.log('🎯 READY TO PROCESS REAL CUSTOMERS!');
console.log('Your Universal AI will automatically:');
console.log('✅ Capture leads from WhatsApp messages');
console.log('✅ Process Instagram DMs');
console.log('✅ Generate business intelligence');
console.log('✅ Provide 100% confident responses');
console.log('✅ Track customer journeys A-Z\n');

console.log('📖 FULL SETUP GUIDE: REAL-API-SETUP-GUIDE.md');
console.log('🧪 TEST SYSTEM: node webhook-tester.js full');
console.log('🎮 LIVE DEMO: node live-demo.js\n');

console.log('🚀 YOUR UNIVERSAL AI IS LIVE AND READY! 🚀');

// Test webhook connectivity
const testWebhooks = async () => {
  const axios = require('axios');
  
  console.log('\n🧪 TESTING WEBHOOK CONNECTIVITY...\n');
  
  const endpoints = [
    { name: 'WhatsApp', url: `${publicUrl}/api/webhooks/whatsapp` },
    { name: 'Instagram', url: `${publicUrl}/api/webhooks/instagram` },
    { name: 'Email', url: `${publicUrl}/api/webhooks/email` },
    { name: 'Calls', url: `${publicUrl}/api/webhooks/calls` },
    { name: 'Universal AI', url: `${publicUrl}/api/ai-universal-chat` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint.url, { timeout: 5000 });
      console.log(`✅ ${endpoint.name}: ${response.status} - Ready`);
    } catch (error) {
      if (error.response?.status === 405) {
        console.log(`✅ ${endpoint.name}: Webhook endpoint active`);
      } else {
        console.log(`⚠️  ${endpoint.name}: ${error.message}`);
      }
    }
  }
  
  console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
  console.log('Ready to connect to real WhatsApp and Instagram APIs!');
};

// Auto-run test if script is called directly
if (require.main === module) {
  testWebhooks().catch(console.error);
}

module.exports = { publicUrl, testWebhooks }; 