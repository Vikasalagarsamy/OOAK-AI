# 🧠 AI MEMORY CARD
**Quick Briefing for New AI Assistants**

## 🚨 CRITICAL: READ THIS FIRST

**The AI system in this project is DATABASE-DRIVEN, not code-driven.**

### 🎯 **Key Facts**
- ✅ AI prompts stored in database tables (`ai_configurations`, `ai_prompt_templates`)
- ✅ Anti-hallucination protection built-in
- ✅ Self-healing and validation systems active
- ❌ NEVER edit prompts in TypeScript files

### 📍 **When Asked to Modify AI Behavior**

1. **Check**: `AI-SYSTEM-MANAGEMENT-GUIDE.md` (complete reference)
2. **Update**: Database tables, not code files
3. **Verify**: `curl http://localhost:3000/api/ai-simple-chat` (health check)

### 🔧 **Quick Actions**

```sql
-- View current AI config
SELECT config_key, LEFT(config_value, 50) FROM ai_configurations;

-- Update AI personality 
UPDATE ai_configurations SET config_value = 'NEW_PROMPT' 
WHERE config_key = 'business_personality';
```

### 🆘 **Emergency**
If AI starts hallucinating: Check database config, never edit code files.

**Full Documentation**: `AI-SYSTEM-MANAGEMENT-GUIDE.md`

---
*🧠 Remember: The AI's brain is in the database, not the code!* 