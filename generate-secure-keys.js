#!/usr/bin/env node

// 🔒 ULTRA-STRONG SECRET KEY GENERATOR
// Generates cryptographically secure random keys for AI Business Intelligence

const crypto = require('crypto');

console.log('🔒 GENERATING ULTRA-STRONG AI SECURITY KEYS');
console.log('===========================================');
console.log('');

// Generate AI Endpoint Secret (64 characters)
const aiEndpointSecret = crypto.randomBytes(32).toString('hex');

// Generate AI Admin API Key (64 characters) 
const aiAdminApiKey = crypto.randomBytes(32).toString('hex');

// Generate Alternative API Key Format (Base64 for variety)
const alternativeKey = crypto.randomBytes(48).toString('base64').replace(/[+/=]/g, '');

console.log('🔑 YOUR NEW ULTRA-SECURE KEYS:');
console.log('');
console.log('# Add these to your ENV Backup/.env-07-6-2025.local file:');
console.log('');
console.log('# 🔒 AI BUSINESS INTELLIGENCE SECURITY KEYS (ULTRA-SECURE)');
console.log(`AI_ENDPOINT_SECRET=${aiEndpointSecret}`);
console.log(`AI_ADMIN_API_KEY=${aiAdminApiKey}`);
console.log('AI_RATE_LIMIT_PER_MINUTE=10');
console.log('');
console.log('🛡️ SECURITY STRENGTH ANALYSIS:');
console.log(`- AI Endpoint Secret: ${aiEndpointSecret.length} characters`);
console.log(`- Admin API Key: ${aiAdminApiKey.length} characters`);
console.log('- Entropy: 256 bits (Military grade)');
console.log('- Character set: Hexadecimal (0-9, a-f)');
console.log('- Brute force time: ~10^77 years');
console.log('');
console.log('🚀 ALTERNATIVE FORMAT (if needed):');
console.log(`AI_ENDPOINT_SECRET=${alternativeKey.substring(0, 40)}`);
console.log('');
console.log('✅ KEYS GENERATED SUCCESSFULLY!');
console.log('   Copy the keys above to your environment file.');
console.log('   These keys are IMPOSSIBLE to guess or crack.');
console.log('');
console.log('🔒 SECURITY TIPS:');
console.log('1. Never share these keys with anyone');
console.log('2. Store them securely');
console.log('3. Rotate them monthly for maximum security');
console.log('4. Use different keys for development vs production'); 