# 🤖 Local LLM Setup Guide for AI Business Intelligence

Your AI Business Intelligence system can now connect to your local LLM for **much more intelligent and precise responses**. Here's how to set it up:

## 🚀 Quick Setup Options

### Option 1: Ollama (Recommended)

1. **Install Ollama** (if not already installed):
   ```bash
   # macOS
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Or download from https://ollama.ai
   ```

2. **Pull a good model**:
   ```bash
   ollama pull llama3.2        # Fast, good for business analysis
   ollama pull llama3.2:13b    # Larger, more capable
   ollama pull mistral         # Alternative option
   ```

3. **Start Ollama** (if not running):
   ```bash
   ollama serve
   ```

4. **Add to your `.env.local`**:
   ```env
   LOCAL_LLM_PROVIDER=ollama
   LOCAL_LLM_API_URL=http://localhost:11434/api/generate
   LOCAL_LLM_MODEL=llama3.2
   ```

### Option 2: LM Studio

1. **Download LM Studio** from https://lmstudio.ai
2. **Download a model** (recommend business-focused models)
3. **Start the local server** in LM Studio
4. **Add to your `.env.local`**:
   ```env
   LOCAL_LLM_PROVIDER=lmstudio
   LOCAL_LLM_API_URL=http://localhost:1234/v1/chat/completions
   LOCAL_LLM_MODEL=local-model
   ```

### Option 3: OpenAI-Compatible API

```env
LOCAL_LLM_PROVIDER=openai-compatible
LOCAL_LLM_API_URL=http://localhost:8000/v1/chat/completions
LOCAL_LLM_MODEL=your-model-name
LOCAL_LLM_API_KEY=your-api-key
```

## 🧪 Test Your Setup

1. **Check API status**:
   ```bash
   curl http://localhost:3001/api/ai-chat
   ```

2. **Test in your app**:
   - Go to Dashboard → AI Business Intelligence → AI Chat
   - Ask: "How are you doing today?"
   - You should see much more intelligent responses!

## 📊 What Your LLM Gets

Your local LLM receives **complete business context** including:

- ✅ **Real sales data**: quotations, revenue, conversion rates
- ✅ **Team information**: employee count, departments, growth
- ✅ **Client metrics**: active leads, top clients, performance
- ✅ **Specific details**: exact quotation amounts, client names, statuses

## 🎯 Expected Benefits

**Before (Rule-based):**
```
User: "What's my highest value quote?"
AI: "I have access to your complete business data..."
```

**After (Local LLM):**
```
User: "What's my highest value quote?"
AI: "Your highest value quotation is ₹54,000 for Ramya, created on January 15th. 
     Currently in 'sent' status. This represents 41.5% of your total quotation value.
     
     Given it's been sent but not yet approved, I recommend following up with Ramya
     to address any concerns and close this significant deal. Would you like me to
     suggest a follow-up strategy?"
```

## 🔧 Advanced Configuration

### Custom Model Instructions

The system sends this context to your LLM:

```
You are an expert business analyst with access to real-time data.
Current business metrics: [YOUR ACTUAL DATA]
- Revenue: ₹130,000 from 3 quotations
- Team: 2 employees, 0 recent hires
- Clients: 3 active clients, 0 leads today
...
Provide intelligent, actionable business advice based on this data.
```

### Performance Tuning

For better responses, use these model parameters:
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **Max tokens**: 1000 (detailed responses)
- **Top-p**: 0.9 (focused responses)

## 🛠️ Troubleshooting

### Connection Issues

1. **Check if LLM is running**:
   ```bash
   # For Ollama
   curl http://localhost:11434/api/tags
   
   # For LM Studio  
   curl http://localhost:1234/v1/models
   ```

2. **Verify model is loaded**:
   ```bash
   ollama list  # For Ollama
   ```

3. **Test direct API call**:
   ```bash
   curl -X POST http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d '{"model": "llama3.2", "prompt": "Hello", "stream": false}'
   ```

### Fallback Behavior

If your local LLM fails, the system automatically falls back to rule-based responses, so your chat always works.

## 🚀 Recommended Models for Business Intelligence

### Small/Fast Models (4-8GB RAM)
- `llama3.2:3b` - Good for basic questions
- `mistral:7b` - Well-rounded performance

### Large/Accurate Models (16GB+ RAM)
- `llama3.2:13b` - Better reasoning
- `llama3.1:70b` - Enterprise-grade analysis

### Specialized Models
- `codellama` - Good for technical analysis
- `deepseek-coder` - Strong analytical capabilities

## 📈 Next Steps

1. **Set up your preferred LLM** using the options above
2. **Add configuration** to your `.env.local`
3. **Restart your development server**
4. **Test with business questions** in the AI chat
5. **Enjoy much more intelligent responses!** 🎉

Your AI will now provide **context-aware, data-driven insights** based on your actual business performance! 