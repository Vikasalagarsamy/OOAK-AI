# 🔗 PERMANENT WEBHOOK URLS - UNIVERSAL AI SYSTEM
**Created:** June 7, 2025  
**Status:** ACTIVE & PERMANENT  
**Purpose:** Centralized storage of all webhook URLs that survive server restarts

## 🎯 PRIMARY WEBHOOK CONFIGURATION

### 📱 WhatsApp Business API
- **Permanent URL:** `https://api.ooak.photography/api/webhooks/whatsapp`
- **Provider:** Cloudflare Tunnel (FREE)
- **Status:** ✅ ACTIVE
- **Features:** 
  - Survives server restarts
  - Persistent message storage (file + memory)
  - AI has complete access
  - Never changes URL

### 📋 WEBHOOK CONFIGURATION CHECKLIST

#### ✅ Interakt WhatsApp Business
- **Platform:** Interakt
- **Business Number:** +919677362524
- **Webhook URL:** `https://api.ooak.photography/api/webhooks/whatsapp`
- **Verify Token:** `whatsapp_verify_123`
- **Last Updated:** June 7, 2025
- **Test Status:** WORKING

#### 📸 Instagram (Future)
- **Webhook URL:** `https://prints-nc-wanna-physics.trycloudflare.com/api/webhooks/instagram`
- **Status:** Ready for configuration

#### 📧 Email Integration (Future)
- **Webhook URL:** `https://prints-nc-wanna-physics.trycloudflare.com/api/webhooks/email`
- **Status:** Ready for configuration

#### ☎️ Call Integration (Future)
- **Webhook URL:** `https://prints-nc-wanna-physics.trycloudflare.com/api/webhooks/calls`
- **Status:** Ready for configuration

## 🔧 TECHNICAL DETAILS

### Cloudflare Tunnel Configuration
```bash
# Start permanent tunnel
cloudflared tunnel --url http://localhost:3000

# Tunnel ID: sam-detect-folders-translation
# Public URL: https://sam-detect-folders-translation.trycloudflare.com
```

### Storage Configuration
- **File Storage:** `/data/whatsapp_messages.json`
- **Memory Cache:** Last 100 messages
- **Persistence:** Survives server restarts
- **AI Access:** Full read access to all messages

### Environment Variables
```env
# Webhook verification tokens
WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123
INSTAGRAM_VERIFY_TOKEN=instagram_verify_456
EMAIL_VERIFY_TOKEN=email_verify_789
CALLS_VERIFY_TOKEN=calls_verify_101

# Public URL (permanent)
PUBLIC_URL=https://api.ooak.photography
```

## 🎯 UPDATE INSTRUCTIONS

### To Update Interakt Webhook:
1. Login to Interakt Dashboard
2. Go to WhatsApp Business API settings
3. Update webhook URL to: `https://sam-detect-folders-translation.trycloudflare.com/api/webhooks/whatsapp`
4. Verify token: `whatsapp_verify_123`
5. Test webhook connection

### To Test Webhook:
```bash
curl -X POST https://sam-detect-folders-translation.trycloudflare.com/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook_test"}'
```

## ✅ BENEFITS OF PERMANENT SETUP

1. **🔄 Restart-Proof:** Server restarts won't break webhooks
2. **📊 Complete Knowledge:** AI knows everything about client interactions
3. **💰 Free:** Cloudflare Tunnel is completely free
4. **⚡ Fast:** Real-time message processing
5. **🔒 Reliable:** Multiple storage methods

---
**IMPORTANT:** This URL is permanent and should be used in all platform configurations. Old ngrok URLs are deprecated. 