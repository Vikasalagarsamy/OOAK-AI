# 🚀 Universal Business AI - Simple Setup Guide

**For Non-Technical Users** 👨‍💼👩‍💼

This guide will help you set up your Universal Business AI system in **3 simple steps**.

## 🎯 What You're Getting

✅ **Complete Business Intelligence** - AI that knows everything about your business  
✅ **WhatsApp Integration** - Handle customer messages automatically  
✅ **Instagram Integration** - Manage social media interactions  
✅ **Email Integration** - Process business emails intelligently  
✅ **Call Integration** - Transcribe and analyze phone calls  
✅ **Sales Analytics** - Real-time business insights  

---

## 🔧 Step 1: One-Time Setup

**Open Terminal and run:**
```bash
npm run setup
```

This will automatically configure everything for you!

---

## 🚀 Step 2: Start Your AI System

**Run this command:**
```bash
./start-universal-ai.sh
```

**You'll see:**
- ✅ System starting on Port 3000
- ✅ Public URLs for webhooks
- ✅ Dashboard links ready

---

## 🎯 Step 3: Configure External Services

Your system will show you **exact URLs** to copy into:

### 📱 WhatsApp Business
1. Go to Meta Developer Console
2. Paste your WhatsApp webhook URL
3. Use verify token: `whatsapp_verify_123`

### 📸 Instagram Business  
1. Go to Meta Developer Console
2. Paste your Instagram webhook URL
3. Use verify token: `instagram_verify_456`

---

## 🔑 Important URLs (Always Port 3000)

- **Dashboard**: `http://localhost:3000/dashboard`
- **AI Chat**: `http://localhost:3000/test-ai`
- **Sales Analytics**: `http://localhost:3000/sales`

---

## 🛑 Stop Your System

```bash
./stop-universal-ai.sh
```

---

## 🔧 Making Changes

**NEVER edit `.env.local` manually!**

Instead:
1. Edit `config/master-config.js`
2. Run `npm run generate-env`
3. Restart with `./start-universal-ai.sh`

---

## 🆘 Need Help?

- **System not starting?** Check if port 3000 is free
- **Database issues?** Verify Supabase URL in `config/master-config.js`
- **Webhook errors?** Copy the exact URLs shown by the startup script

---

## 🎉 Success Checklist

✅ System starts on port 3000  
✅ Public URLs are displayed  
✅ AI responds to test queries  
✅ Webhooks are configured in Meta Developer Console  
✅ Dashboard is accessible  

**You're ready to transform your business with AI!** 🚀 