const jwt = require('jsonwebtoken');

// Your JWT secret
const JWT_SECRET = 't/Qbvj36bUtknC5BSZjJc6wVKsaBQ3lHAlLFxkVvDVhdO5DNc2xtlzmqcTo0fAFp1PSRi5MZD8VayuU+9BRUVA==';

// User ID from your tests
const USER_ID = '764c38af-e49c-4fc0-9584-4cdcbbc3625c';

// Create a JWT token with user information
const payload = {
  sub: USER_ID, // Subject (user ID)
  email: 'vikas.alagarsamy1987@gmail.com',
  role: 'admin',
  iat: Math.floor(Date.now() / 1000), // Issued at
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Expires in 24 hours
};

try {
  const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  
  console.log('🎫 Generated JWT Token:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(token);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📋 Token Details:');
  console.log(`   User ID: ${USER_ID}`);
  console.log(`   Email: ${payload.email}`);
  console.log(`   Role: ${payload.role}`);
  console.log(`   Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
  console.log('');
  console.log('🔧 How to use:');
  console.log('1. Copy the token above');
  console.log('2. Paste it in the "Authorization Token" field in your test page');
  console.log('3. Or set it in the browser console: CONFIG.AUTH_TOKEN = "your_token_here"');
  console.log('4. Then run your tests!');
  
} catch (error) {
  console.error('❌ Error generating token:', error.message);
} 