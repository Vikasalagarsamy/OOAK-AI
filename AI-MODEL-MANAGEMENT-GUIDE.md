# 🤖 AI Model Management Guide

**For Non-Technical Business Users** 👨‍💼👩‍💼

This guide helps you manage your AI models easily, switch between different models, and migrate to powerful GPU servers when needed.

---

## 🎯 What This System Gives You

✅ **Automatic AI Model Management** - No technical knowledge required  
✅ **Easy Model Switching** - Change AI models with simple commands  
✅ **GPU Server Ready** - Migrate to powerful servers instantly  
✅ **Zero Downtime** - Switch models without stopping your business  
✅ **Fallback Protection** - Backup models if main one fails  
✅ **Performance Monitoring** - See how your AI models perform  

---

## 🔧 Current AI Configuration

Your system is pre-configured with these AI models:

### 📱 **Local Models (Development)**
- **Ollama** - Fast local model for testing
- **LM Studio** - Local GPU testing

### 🚀 **Remote GPU Models (Production)**
- **RunPod Llama 70B** - High-performance business AI
- **RunPod Qwen 72B** - Advanced reasoning AI
- **Custom GPU Server** - Your own GPU server

### 🛡️ **External Models (Backup)**
- **OpenAI GPT-4** - Reliable fallback
- **Anthropic Claude** - Advanced reasoning backup

---

## 🚀 How to Check Your Current AI Status

**Open terminal and run:**
```bash
curl http://localhost:3000/api/ai-model-switch
```

**You'll see:**
- ✅ Active model currently running
- 🔄 Fallback model for backup
- 📊 Performance metrics
- 🔗 Connection status

---

## 🔄 How to Switch AI Models

### **For Local Development:**
```bash
curl -X POST http://localhost:3000/api/ai-model-switch \
  -H "Content-Type: application/json" \
  -d '{"model_id": "local_ollama"}'
```

### **For Production (GPU Server):**
```bash
curl -X POST http://localhost:3000/api/ai-model-switch \
  -H "Content-Type: application/json" \
  -d '{"model_id": "runpod_llama"}'
```

### **For Reliable Backup:**
```bash
curl -X POST http://localhost:3000/api/ai-model-switch \
  -H "Content-Type: application/json" \
  -d '{"model_id": "openai_gpt4"}'
```

---

## 🚀 How to Migrate to Your GPU Server

**Step 1: Get your GPU server details**
- Server URL (e.g., `https://your-gpu-server.com`)
- Model name (e.g., `llama-3.1-70b`)
- API key (if required)

**Step 2: Configure GPU server**
```bash
curl -X POST http://localhost:3000/api/ai-model-switch \
  -H "Content-Type: application/json" \
  -d '{
    "gpu_server": {
      "endpoint": "https://your-gpu-server.com",
      "model": "llama-3.1-70b",
      "api_key": "your-api-key"
    }
  }'
```

**Step 3: Test your new GPU server**
```bash
curl -X POST http://localhost:3000/api/ai-universal-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test GPU server connection", "userId": "admin"}'
```

---

## 🎮 Available AI Models

| Model ID | Name | Best For | Performance |
|----------|------|----------|-------------|
| `local_ollama` | Local Ollama | Development | Fast |
| `runpod_llama` | RunPod Llama 70B | Production | Very High |
| `runpod_qwen` | RunPod Qwen 72B | Complex Analysis | Very High |
| `openai_gpt4` | OpenAI GPT-4 | Reliable Backup | High |
| `anthropic_claude` | Claude 3.5 | Advanced Reasoning | High |
| `custom_gpu_server` | Your GPU Server | Custom Setup | Variable |

---

## 🛠️ Simple Configuration Updates

### **Update AI settings in one place:**
```bash
# Edit the master configuration
nano config/master-config.js

# Change this line to switch default model:
ACTIVE_MODEL: "runpod_llama",  // Your choice here
```

### **Regenerate environment:**
```bash
npm run generate-env
```

### **Restart system:**
```bash
./start-universal-ai.sh
```

---

## 🎯 Common Use Cases

### **Starting a Business (Local)**
```bash
# Use local model for development
curl -X POST http://localhost:3000/api/ai-model-switch \
  -H "Content-Type: application/json" \
  -d '{"model_id": "local_ollama"}'
```

### **Growing Business (GPU Server)**
```bash
# Switch to powerful GPU model
curl -X POST http://localhost:3000/api/ai-model-switch \
  -H "Content-Type: application/json" \
  -d '{"model_id": "runpod_llama"}'
```

### **Emergency Backup**
```bash
# Use reliable external model
curl -X POST http://localhost:3000/api/ai-model-switch \
  -H "Content-Type: application/json" \
  -d '{"model_id": "openai_gpt4"}'
```

---

## 🔍 How to Monitor Performance

**Check AI performance:**
```bash
curl http://localhost:3000/api/ai-model-switch | jq .current_configuration.performance
```

**What to look for:**
- ✅ **Average response time** - Should be < 2000ms
- ✅ **Success rate** - Should be > 95%
- ✅ **Connection status** - Should be "connected"

---

## 🚨 Troubleshooting

### **AI Not Responding:**
1. Check connection: `curl http://localhost:3000/api/ai-model-switch`
2. Switch to backup: Use commands above
3. Restart system: `./stop-universal-ai.sh && ./start-universal-ai.sh`

### **Slow Performance:**
1. Check if local model is overloaded
2. Switch to GPU server: Use RunPod models
3. Check internet connection for external models

### **Migration Issues:**
1. Verify GPU server URL is correct
2. Check API key is valid
3. Test connection manually

---

## 💡 Best Practices

### **For Small Business:**
- Start with `local_ollama` for development
- Use `openai_gpt4` for important queries
- Monitor costs with external models

### **For Growing Business:**
- Invest in `runpod_llama` for performance
- Keep `openai_gpt4` as fallback
- Monitor performance metrics

### **For Enterprise:**
- Use `custom_gpu_server` for control
- Set up multiple fallbacks
- Implement performance monitoring

---

## 📞 Quick Support Commands

**Get system status:**
```bash
curl http://localhost:3000/api/health
```

**Test Universal AI:**
```bash
curl -X POST http://localhost:3000/api/ai-universal-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many leads do we have?", "userId": "admin"}'
```

**Check all endpoints:**
```bash
node webhook-tester.js
```

---

## 🎉 You're Ready!

Your AI system is now:
- ✅ **Centrally Configured** - All settings in one place
- ✅ **Migration Ready** - Switch to any server instantly
- ✅ **Business Focused** - Optimized for your needs
- ✅ **Non-Technical Friendly** - Simple commands only
- ✅ **Future Proof** - Easy to upgrade models

**No more technical headaches - just powerful business AI!** 🚀 