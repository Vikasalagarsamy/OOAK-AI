// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.781Z
// Original file backed up as: services/unified-ai-service.js.backup


// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


// Query helper function
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('❌ PostgreSQL Query Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Transaction helper function  
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return { data: result, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Transaction Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Original content starts here:
const { Pool } = require('pg');
/**
 * UNIFIED AI SERVICE
 * =================
 * 
 * Single service that handles ALL AI model interactions
 * Supports seamless switching between local, remote GPU, and external models
 * Ready for production deployment and migration
 */

import { AI_MODEL_CONFIG, getActiveModelConfig, getFallbackModelConfig } from '../config/ai-model-config.js'

export class UnifiedAIService {
  constructor() {
    this.activeConfig = null
    this.fallbackConfig = null
    this.connectionStatus = new Map()
    this.performanceMetrics = new Map()
  }

  /**
   * Initialize the AI service with active configuration
   */
  async initialize() {
    console.log('🤖 Initializing Unified AI Service...')
    
    this.activeConfig = getActiveModelConfig()
    this.fallbackConfig = getFallbackModelConfig()
    
    if (!this.activeConfig) {
      throw new Error('No active AI model configuration found')
    }
    
    console.log(`✅ Active Model: ${this.activeConfig.name}`)
    console.log(`🔄 Fallback Model: ${this.fallbackConfig?.name || 'None'}`)
    
    // Test connections
    await this.testConnections()
  }

  /**
   * Generate business intelligence response
   */
  async generateBusinessResponse(prompt, context = {}) {
    const startTime = Date.now()
    
    try {
      console.log(`🧠 Processing query with ${this.activeConfig.name}...`)
      
      const response = await this.callModel(this.activeConfig, prompt, context)
      
      const processingTime = Date.now() - startTime
      this.recordPerformance(this.activeConfig.provider, processingTime, true)
      
      return {
        response: response.content,
        model_used: this.activeConfig.name,
        provider: this.activeConfig.provider,
        processing_time_ms: processingTime,
        confidence: this.calculateConfidence(response, context),
        sources: this.extractSources(context),
        suggested_actions: this.generateSuggestedActions(response, context)
      }
      
    } catch (error) {
      console.error(`❌ Primary model failed: ${error.message}`)
      
      // Try fallback model
      if (this.fallbackConfig) {
        console.log(`🔄 Attempting fallback with ${this.fallbackConfig.name}...`)
        
        try {
          const response = await this.callModel(this.fallbackConfig, prompt, context)
          const processingTime = Date.now() - startTime
          
          return {
            response: response.content,
            model_used: this.fallbackConfig.name,
            provider: this.fallbackConfig.provider,
            processing_time_ms: processingTime,
            confidence: this.calculateConfidence(response, context) * 0.9, // Slightly lower confidence for fallback
            sources: this.extractSources(context),
            suggested_actions: this.generateSuggestedActions(response, context),
            fallback_used: true
          }
          
        } catch (fallbackError) {
          console.error(`❌ Fallback model also failed: ${fallbackError.message}`)
        }
      }
      
      // Return error response if all models fail
      return {
        response: "I apologize, but I'm currently unable to process your request. Please try again in a moment.",
        model_used: "error_fallback",
        provider: "none",
        processing_time_ms: Date.now() - startTime,
        confidence: 0.0,
        sources: [],
        suggested_actions: ["Check AI service status", "Try again in a few moments"],
        error: error.message
      }
    }
  }

  /**
   * Call specific AI model with proper formatting
   */
  async callModel(config, prompt, context = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      let response

      switch (config.provider) {
        case 'ollama':
          response = await this.callOllama(config, prompt, controller.signal)
          break
        
        case 'runpod':
          response = await this.callRunPod(config, prompt, controller.signal)
          break
        
        case 'openai':
          response = await this.callOpenAI(config, prompt, controller.signal)
          break
        
        case 'anthropic':
          response = await this.callAnthropic(config, prompt, controller.signal)
          break
        
        case 'custom':
          response = await this.callCustomGPU(config, prompt, controller.signal)
          break
          
        default:
          throw new Error(`Unsupported AI provider: ${config.provider}`)
      }

      clearTimeout(timeoutId)
      return response

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Call Ollama (Local Development)
   */
  async callOllama(config, prompt, signal) {
    const response = await fetch(`${config.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: config.temperature,
          max_tokens: config.max_tokens
        }
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    return { content: data.response || 'No response generated' }
  }

  /**
   * Call RunPod (GPU Server)
   */
  async callRunPod(config, prompt, signal) {
    const apiKey = process.env[config.api_key_env]
    const podId = process.env[config.pod_id_env]
    
    if (!apiKey || !podId) {
      throw new Error('RunPod API key or Pod ID not configured')
    }

    const endpoint = config.endpoint.replace('{pod_id}', podId)
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          max_tokens: config.max_tokens,
          temperature: config.temperature,
          model: config.model
        }
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`RunPod API error: ${response.status}`)
    }

    const data = await response.json()
    return { content: data.output?.text || data.output || 'No response generated' }
  }

  /**
   * Call OpenAI (External Fallback)
   */
  async callOpenAI(config, prompt, signal) {
    const apiKey = process.env[config.api_key_env]
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch(`${config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.max_tokens
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return { content: data.choices[0]?.message?.content || 'No response generated' }
  }

  /**
   * Call Anthropic Claude (External Fallback)
   */
  async callAnthropic(config, prompt, signal) {
    const apiKey = process.env[config.api_key_env]
    
    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const response = await fetch(`${config.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    return { content: data.content[0]?.text || 'No response generated' }
  }

  /**
   * Call Custom GPU Server
   */
  async callCustomGPU(config, prompt, signal) {
    const apiKey = process.env[config.api_key_env]
    
    const headers = { 'Content-Type': 'application/json' }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(`${config.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.max_tokens
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`Custom GPU API error: ${response.status}`)
    }

    const data = await response.json()
    return { content: data.choices[0]?.message?.content || 'No response generated' }
  }

  /**
   * Test connections to all configured models
   */
  async testConnections() {
    console.log('🔍 Testing AI model connections...')
    
    // Test active model
    try {
      await this.testModelConnection(this.activeConfig)
      this.connectionStatus.set(this.activeConfig.provider, 'connected')
      console.log(`✅ ${this.activeConfig.name}: Connected`)
    } catch (error) {
      this.connectionStatus.set(this.activeConfig.provider, 'failed')
      console.log(`❌ ${this.activeConfig.name}: ${error.message}`)
    }
    
    // Test fallback model if configured
    if (this.fallbackConfig) {
      try {
        await this.testModelConnection(this.fallbackConfig)
        this.connectionStatus.set(this.fallbackConfig.provider, 'connected')
        console.log(`✅ ${this.fallbackConfig.name}: Connected`)
      } catch (error) {
        this.connectionStatus.set(this.fallbackConfig.provider, 'failed')
        console.log(`❌ ${this.fallbackConfig.name}: ${error.message}`)
      }
    }
  }

  /**
   * Test individual model connection
   */
  async testModelConnection(config) {
    const testPrompt = "Test connection. Respond with: OK"
    
    try {
      const response = await this.callModel(config, testPrompt)
      return response.content.includes('OK') || response.content.length > 0
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`)
    }
  }

  /**
   * Calculate response confidence based on content and context
   */
  calculateConfidence(response, context) {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence based on response length and quality
    if (response.content.length > 100) confidence += 0.2
    if (response.content.includes('₹')) confidence += 0.1 // Business context
    if (context.leads || context.quotations) confidence += 0.2 // Has business data
    
    return Math.min(confidence, 1.0)
  }

  /**
   * Extract sources from context
   */
  extractSources(context) {
    const sources = []
    
    if (context.leads?.length > 0) sources.push('leads_database')
    if (context.quotations?.length > 0) sources.push('quotations_database')
    if (context.tasks?.length > 0) sources.push('tasks_database')
    if (context.employees?.length > 0) sources.push('employees_database')
    
    return sources
  }

  /**
   * Generate suggested actions based on response and context
   */
  generateSuggestedActions(response, context) {
    const actions = []
    
    if (context.leads?.length > 0) {
      actions.push('Review and follow up with recent leads')
    }
    
    if (context.quotations?.some(q => q.status === 'pending')) {
      actions.push('Follow up on pending quotations')
    }
    
    if (context.tasks?.some(t => t.status !== 'completed')) {
      actions.push('Complete pending tasks')
    }
    
    return actions
  }

  /**
   * Record performance metrics
   */
  recordPerformance(provider, processingTime, success) {
    if (!this.performanceMetrics.has(provider)) {
      this.performanceMetrics.set(provider, {
        total_requests: 0,
        successful_requests: 0,
        total_time: 0,
        average_time: 0
      })
    }
    
    const metrics = this.performanceMetrics.get(provider)
    metrics.total_requests++
    if (success) metrics.successful_requests++
    metrics.total_time += processingTime
    metrics.average_time = metrics.total_time / metrics.total_requests
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      active_model: this.activeConfig?.name || 'None',
      fallback_model: this.fallbackConfig?.name || 'None',
      connections: Object.fromEntries(this.connectionStatus),
      performance: Object.fromEntries(this.performanceMetrics),
      business_ai_settings: AI_MODEL_CONFIG.BUSINESS_AI
    }
  }

  /**
   * Switch to different model (for non-technical users)
   */
  async switchModel(modelId) {
    console.log(`🔄 Switching to model: ${modelId}`)
    
    // Update configuration
    AI_MODEL_CONFIG.ACTIVE.PRIMARY = modelId
    
    // Reinitialize with new model
    await this.initialize()
    
    console.log(`✅ Successfully switched to: ${this.activeConfig.name}`)
  }

  /**
   * Configure GPU server (for migration)
   */
  async configureGPUServer(endpoint, model, apiKey) {
    console.log(`🚀 Configuring GPU server: ${endpoint}`)
    
    // Update custom GPU configuration
    AI_MODEL_CONFIG.REMOTE_MODELS.custom_gpu_server.endpoint = endpoint
    AI_MODEL_CONFIG.REMOTE_MODELS.custom_gpu_server.model = model
    
    // Set environment variable if provided
    if (apiKey) {
      process.env.CUSTOM_GPU_API_KEY = apiKey
    }
    
    // Switch to custom GPU server
    await this.switchModel('custom_gpu_server')
    
    console.log(`✅ GPU server configured and activated`)
  }
}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService()

export default unifiedAIService 