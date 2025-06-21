# 🤖 AI System Documentation

## Overview
This project uses a **robust, database-driven AI system** that prevents hallucination and maintains consistent behavior across all environments and restarts.

## Key Features
- ✅ **Anti-Hallucination Protection**: AI cannot make up fake data
- ✅ **Persistent Configuration**: Survives restarts and deployments  
- ✅ **Real-Time Business Intelligence**: Uses actual database records
- ✅ **Self-Healing**: Automatically recovers from configuration issues

## Quick Health Check
```bash
curl http://localhost:3000/api/ai-simple-chat
```
Expected response: `"✅ AI System Ready"`

## For Developers & AI Assistants

### 📖 **Essential Reading**
1. **`AI-MEMORY-CARD.md`** - Quick briefing for new AI assistants
2. **`AI-SYSTEM-MANAGEMENT-GUIDE.md`** - Complete reference guide
3. **`AI-SYSTEM-ROBUSTNESS.md`** - Technical architecture details

### 🚨 **Critical Rule**
**NEVER edit AI prompts in TypeScript files!**  
All AI behavior is stored in database tables:
- `ai_configurations` - Core prompts and personality
- `ai_prompt_templates` - Template-based generation
- `ai_behavior_settings` - Validation and safety rules

### 🔧 **Making AI Changes**
```sql
-- Correct way to update AI personality
UPDATE ai_configurations 
SET config_value = 'Your new AI personality here'
WHERE config_key = 'business_personality';
```

## Architecture
```
User Query → AI Configuration Service → Database Templates → Local LLM → Validated Response
```

## Status: ✅ Production Ready
- **Local LLM**: llama3.1:8b (Ollama)
- **Configuration**: Database-driven (robust)
- **Anti-Hallucination**: Active
- **Business Intelligence**: Real-time 