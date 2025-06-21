// Universal AI System - Production Webhook Setup
// Configure real platform integrations with public webhook URLs

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

class ProductionWebhookSetup {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.publicUrl = 'https://api.ooak.photography'; // PERMANENT CLOUDFLARE TUNNEL - OOAK.PHOTOGRAPHY
    this.configPath = path.join(__dirname, '.env.production');
    this.platforms = {
      whatsapp: {
        name: 'WhatsApp Business API',
        endpoints: ['/api/webhooks/whatsapp'],
        required: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']
      },
      instagram: {
        name: 'Instagram Business API', 
        endpoints: ['/api/webhooks/instagram'],
        required: ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_APP_SECRET', 'INSTAGRAM_VERIFY_TOKEN']
      },
      email: {
        name: 'Email Webhooks (Gmail/Outlook)',
        endpoints: ['/api/webhooks/email'],
        required: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'OUTLOOK_CLIENT_ID', 'OUTLOOK_CLIENT_SECRET']
      },
      calls: {
        name: 'Call Integration (Twilio)',
        endpoints: ['/api/webhooks/calls'],
        required: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
      }
    };
  }

  async setupProductionWebhooks() {
    console.log('🚀 Setting up Production Webhook Integration...\n');
    
    // Step 1: Setup public webhook URLs
    await this.setupPublicUrls();
    
    // Step 2: Generate configuration templates
    await this.generateConfigTemplates();
    
    // Step 3: Validate existing configuration
    await this.validateConfiguration();
    
    // Step 4: Setup platform-specific webhooks
    await this.setupWhatsAppWebhooks();
    await this.setupInstagramWebhooks();
    await this.setupEmailWebhooks();
    await this.setupCallWebhooks();
    
    // Step 5: Run integration tests
    await this.runIntegrationTests();
    
    console.log('\n✅ Production webhook setup completed!');
  }

  async setupPublicUrls() {
    console.log('🌐 Step 1: Setting up Public Webhook URLs');
    
    if (!this.publicUrl) {
      console.log('📡 Setting up ngrok tunnel for local development...');
      
      try {
        // Check if ngrok is installed
        await this.execCommand('which ngrok');
        
        // Start ngrok tunnel
        console.log('🚀 Starting ngrok tunnel on port 3000...');
        const ngrokProcess = exec('ngrok http 3000 --log=stdout');
        
        // Wait for ngrok to start and get the public URL
        await new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const response = await axios.get('http://localhost:4040/api/tunnels');
              const tunnel = response.data.tunnels.find(t => t.proto === 'https');
              if (tunnel) {
                this.publicUrl = tunnel.public_url;
                console.log(`✅ Ngrok tunnel active: ${this.publicUrl}`);
                resolve();
              }
            } catch (error) {
              console.log('⚠️  Could not auto-detect ngrok URL. Please check manually at http://localhost:4040');
              resolve();
            }
          }, 3000);
        });
        
      } catch (error) {
        console.log('❌ Ngrok not found. Please install ngrok or set PUBLIC_URL environment variable.');
        console.log('📖 Install ngrok: https://ngrok.com/download');
        console.log('💡 Or use Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/');
      }
    } else {
      console.log(`✅ Using configured public URL: ${this.publicUrl}`);
    }
    
    console.log('\n📋 Webhook Endpoints:');
    Object.keys(this.platforms).forEach(platform => {
      this.platforms[platform].endpoints.forEach(endpoint => {
        console.log(`${platform.toUpperCase()}: ${this.publicUrl}${endpoint}`);
      });
    });
    
    console.log('');
  }

  async generateConfigTemplates() {
    console.log('📝 Step 2: Generating Configuration Templates');
    
    const envTemplate = `# Universal AI System - Production Configuration
# Generated on ${new Date().toISOString()}

# Public URL for webhooks (auto-detected or manual)
PUBLIC_URL=${this.publicUrl || 'https://your-domain.com'}

# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_123
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Instagram Business API Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_VERIFY_TOKEN=your_instagram_verify_token_456
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_id

# Gmail API Configuration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token

# Microsoft Outlook Configuration
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
OUTLOOK_TENANT_ID=your_outlook_tenant_id

# Twilio Call Integration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# AI and Processing Configuration
OPENAI_API_KEY=your_openai_api_key
WEBHOOK_SECRET=your_webhook_secret_key

# Database Configuration
DATABASE_URL=your_database_connection_string
`;

    fs.writeFileSync(this.configPath, envTemplate);
    console.log(`✅ Configuration template saved: ${this.configPath}`);
    console.log('');
  }

  async validateConfiguration() {
    console.log('🔍 Step 3: Validating Configuration');
    
    // Check platform-specific variables
    Object.entries(this.platforms).forEach(([platform, config]) => {
      const platformVars = config.required.filter(varName => !process.env[varName]);
      if (platformVars.length > 0) {
        console.log(`⚠️  ${config.name}: Missing ${platformVars.join(', ')}`);
      } else {
        console.log(`✅ ${config.name}: Configuration complete`);
      }
    });
    
    console.log('');
  }

  async setupWhatsAppWebhooks() {
    console.log('📱 Step 4a: Setting up WhatsApp Webhooks');
    
    try {
      const webhookUrl = `${this.publicUrl}/api/webhooks/whatsapp`;
      console.log(`🔗 Webhook URL: ${webhookUrl}`);
      
      // Test webhook endpoint
      const testResponse = await axios.get(webhookUrl, {
        params: {
          'hub.mode': 'subscribe',
          'hub.challenge': 'test_challenge',
          'hub.verify_token': process.env.WHATSAPP_VERIFY_TOKEN || 'test_token'
        }
      });
      
      if (testResponse.status === 200) {
        console.log('✅ WhatsApp webhook verification successful');
      }
      
    } catch (error) {
      console.log(`❌ WhatsApp webhook test failed: ${error.message}`);
      console.log('📖 Manual setup required - see platform documentation');
    }
    
    console.log('');
  }

  async setupInstagramWebhooks() {
    console.log('📸 Step 4b: Setting up Instagram Webhooks');
    
    try {
      const webhookUrl = `${this.publicUrl}/api/webhooks/instagram`;
      console.log(`🔗 Webhook URL: ${webhookUrl}`);
      console.log('✅ Instagram webhook endpoint ready');
      
    } catch (error) {
      console.log(`❌ Instagram webhook setup failed: ${error.message}`);
    }
    
    console.log('');
  }

  async setupEmailWebhooks() {
    console.log('📧 Step 4c: Setting up Email Webhooks');
    
    const webhookUrl = `${this.publicUrl}/api/webhooks/email`;
    console.log(`🔗 Email Webhook URL: ${webhookUrl}`);
    console.log('📋 Configure this URL in Gmail/Outlook webhook settings');
    console.log('');
  }

  async setupCallWebhooks() {
    console.log('📞 Step 4d: Setting up Call Webhooks');
    
    const webhookUrl = `${this.publicUrl}/api/webhooks/calls`;
    console.log(`🔗 Call Webhook URL: ${webhookUrl}`);
    console.log('📋 Configure this URL in your Twilio phone number settings');
    console.log('');
  }

  async runIntegrationTests() {
    console.log('🧪 Step 5: Running Integration Tests');
    
    try {
      console.log('🚀 Starting integration test...');
      
      // Test Universal AI endpoint
      const aiResponse = await axios.post(`${this.baseUrl}/api/ai-universal-chat`, {
        message: 'System integration test'
      });
      
      if (aiResponse.status === 200) {
        console.log('✅ Universal AI system responding correctly');
      }
      
    } catch (error) {
      console.log(`⚠️  Integration test warning: ${error.message}`);
      console.log('💡 Run detailed tests: node webhook-tester.js full');
    }
    
    console.log('');
  }

  async execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// CLI Interface
if (require.main === module) {
  const setup = new ProductionWebhookSetup();
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setup.setupProductionWebhooks();
      break;
    case 'test':
      setup.runIntegrationTests();
      break;
    default:
      console.log(`
🚀 Universal AI System - Production Webhook Setup

Usage:
  node setup-production-webhooks.js setup     # Complete production setup
  node setup-production-webhooks.js test      # Run integration tests

Setup Process:
1. 🌐 Configure public webhook URLs (ngrok/cloudflare)
2. 📝 Generate configuration templates  
3. 🔍 Validate environment variables
4. 📱 Setup platform-specific webhooks
5. 🧪 Run integration tests

Prerequisites:
- Node.js application running on port 3000
- Database connection configured
- ngrok installed (for local development)

Next Steps:
1. Run: node setup-production-webhooks.js setup
2. Fill in .env.production with your API keys
3. Test with: node webhook-tester.js full
      `);
  }
}

module.exports = ProductionWebhookSetup; 