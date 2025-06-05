/**
 * LLM Service for Task Management System
 * Supports both local Ollama deployment and external API fallback
 * Optimized for RunPod GPU hosting
 */

interface LLMConfig {
  provider: 'ollama' | 'openai' | 'anthropic'
  endpoint: string
  model: string
  apiKey?: string
  timeout: number
  maxRetries: number
}

interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: string
}

class LLMService {
  private config: LLMConfig
  private fallbackConfigs: LLMConfig[]

  constructor() {
    // Primary configuration (local Ollama)
    this.config = {
      provider: 'ollama',
      endpoint: process.env.LLM_ENDPOINT || 'http://localhost:11434',
      model: process.env.LLM_MODEL || 'llama3.1:8b',
      timeout: parseInt(process.env.LLM_TIMEOUT || '60000'),
      maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3')
    }

    // Fallback configurations
    this.fallbackConfigs = [
      {
        provider: 'ollama',
        endpoint: this.config.endpoint,
        model: process.env.LLM_BACKUP_MODEL || 'qwen2.5:7b',
        timeout: this.config.timeout,
        maxRetries: 2
      }
    ]

    // Add external API fallbacks if configured
    if (process.env.OPENAI_API_KEY) {
      this.fallbackConfigs.push({
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000,
        maxRetries: 2
      })
    }
  }

  /**
   * Generate AI task from lead data
   */
  async generateTask(leadData: any, context: string): Promise<LLMResponse> {
    const prompt = `
You are an AI assistant helping with task management for a business.

Lead Information:
- Client: ${leadData.client_name}
- Email: ${leadData.email || 'Not provided'}
- Phone: ${leadData.phone || 'Not provided'}
- Company: ${leadData.company_name || 'Not provided'}
- Source: ${leadData.source || 'Not provided'}
- Status: ${leadData.status}
- Notes: ${leadData.notes || 'No additional notes'}

Context: ${context}

Generate a specific, actionable task for this lead. Include:
1. Clear task title (max 80 characters)
2. Detailed description with specific actions
3. Priority level (low/medium/high/urgent)
4. Estimated completion time
5. Business impact assessment
6. Recommended next steps

Format your response as JSON:
{
  "title": "Task title here",
  "description": "Detailed description here",
  "priority": "medium",
  "estimated_hours": 2,
  "business_impact": "Impact description",
  "next_steps": ["Step 1", "Step 2"],
  "reasoning": "Why this task is important"
}
`

    return this.generateCompletion(prompt)
  }

  /**
   * Analyze task completion and suggest quotation approach
   */
  async analyzeTaskCompletion(taskData: any, completionNotes: string): Promise<LLMResponse> {
    const prompt = `
You are an AI assistant analyzing task completion to help generate quotations.

Task Information:
- Title: ${taskData.title}
- Client: ${taskData.client_name}
- Completion Notes: ${completionNotes}
- Estimated Value: ₹${taskData.estimated_value}
- Business Impact: ${taskData.business_impact}

Analyze the task completion and provide quotation recommendations:

1. Client Requirements Analysis
2. Suggested Budget Range
3. Project Scope Recommendations
4. Timeline Estimates
5. Risk Assessment
6. Upselling Opportunities

Format your response as JSON:
{
  "client_requirements": "Analyzed requirements",
  "budget_range": "₹X - ₹Y",
  "project_scope": "Recommended scope",
  "timeline": "Estimated timeline",
  "risk_factors": ["Risk 1", "Risk 2"],
  "upsell_opportunities": ["Opportunity 1", "Opportunity 2"],
  "confidence_score": 0.85,
  "reasoning": "Analysis reasoning"
}
`

    return this.generateCompletion(prompt)
  }

  /**
   * Generate follow-up task suggestions
   */
  async generateFollowUpTasks(leadData: any, previousTasks: any[]): Promise<LLMResponse> {
    const taskHistory = previousTasks.map(t => `- ${t.title} (${t.status}): ${t.description}`).join('\n')
    
    const prompt = `
You are an AI assistant helping with follow-up task generation.

Lead Information:
- Client: ${leadData.client_name}
- Current Status: ${leadData.status}
- Estimated Value: ₹${leadData.estimated_value || 'Not specified'}

Previous Task History:
${taskHistory || 'No previous tasks'}

Generate 2-3 follow-up tasks that would help move this lead forward in the sales pipeline. Consider:
1. Natural progression from previous tasks
2. Lead status and engagement level
3. Potential objections or concerns
4. Conversion opportunities

Format your response as JSON:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "priority": "medium",
      "estimated_hours": 1,
      "business_impact": "Impact description",
      "reasoning": "Why this task is needed"
    }
  ],
  "strategy": "Overall strategy for this lead",
  "next_milestone": "What we're working towards"
}
`

    return this.generateCompletion(prompt)
  }

  /**
   * Core completion method with fallback logic
   */
  private async generateCompletion(prompt: string): Promise<LLMResponse> {
    // Try primary configuration first
    try {
      return await this.callLLM(this.config, prompt)
    } catch (error) {
      console.warn('Primary LLM failed, trying fallbacks:', error)
      
      // Try fallback configurations
      for (const fallbackConfig of this.fallbackConfigs) {
        try {
          const response = await this.callLLM(fallbackConfig, prompt)
          console.log(`✅ Fallback LLM (${fallbackConfig.provider}:${fallbackConfig.model}) succeeded`)
          return response
        } catch (fallbackError) {
          console.warn(`Fallback LLM (${fallbackConfig.provider}:${fallbackConfig.model}) failed:`, fallbackError)
        }
      }
      
      // All LLMs failed, return error response
      throw new Error('All LLM services are unavailable')
    }
  }

  /**
   * Call specific LLM provider
   */
  private async callLLM(config: LLMConfig, prompt: string): Promise<LLMResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      let response: Response

      if (config.provider === 'ollama') {
        response = await fetch(`${config.endpoint}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: config.model,
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 2048
            }
          }),
          signal: controller.signal
        })
      } else if (config.provider === 'openai') {
        response = await fetch(`${config.endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2048
          }),
          signal: controller.signal
        })
      } else {
        throw new Error(`Unsupported LLM provider: ${config.provider}`)
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      // Parse response based on provider
      if (config.provider === 'ollama') {
        return {
          content: data.response || '',
          model: config.model,
          provider: config.provider,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0
          } : undefined
        }
      } else if (config.provider === 'openai') {
        return {
          content: data.choices?.[0]?.message?.content || '',
          model: config.model,
          provider: config.provider,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0
          } : undefined
        }
      }

      throw new Error('Invalid response format')

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Health check for LLM services
   */
  async healthCheck(): Promise<{
    primary: boolean
    fallbacks: Array<{ provider: string, model: string, healthy: boolean }>
    details: string
  }> {
    const results = {
      primary: false,
      fallbacks: [] as Array<{ provider: string, model: string, healthy: boolean }>,
      details: ''
    }

    // Check primary LLM
    try {
      await this.callLLM(this.config, 'Hello, respond with "OK"')
      results.primary = true
      results.details += `✅ Primary LLM (${this.config.provider}:${this.config.model}) is healthy\n`
    } catch (error) {
      results.details += `❌ Primary LLM (${this.config.provider}:${this.config.model}) failed: ${error}\n`
    }

    // Check fallback LLMs
    for (const fallbackConfig of this.fallbackConfigs) {
      try {
        await this.callLLM(fallbackConfig, 'Hello, respond with "OK"')
        results.fallbacks.push({
          provider: fallbackConfig.provider,
          model: fallbackConfig.model,
          healthy: true
        })
        results.details += `✅ Fallback LLM (${fallbackConfig.provider}:${fallbackConfig.model}) is healthy\n`
      } catch (error) {
        results.fallbacks.push({
          provider: fallbackConfig.provider,
          model: fallbackConfig.model,
          healthy: false
        })
        results.details += `❌ Fallback LLM (${fallbackConfig.provider}:${fallbackConfig.model}) failed: ${error}\n`
      }
    }

    return results
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      primary: this.config,
      fallbacks: this.fallbackConfigs
    }
  }
}

// Export singleton instance
export const llmService = new LLMService()
export default llmService 