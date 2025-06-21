import { NextRequest, NextResponse } from 'next/server'

// Dynamic import for ES modules
let unifiedAIService: any = null
let AI_MODEL_CONFIG: any = null

const getServices = async () => {
  if (!unifiedAIService || !AI_MODEL_CONFIG) {
    const aiModule = await import('../../../services/unified-ai-service.js')
    const configModule = await import('../../../config/ai-model-config.js')
    
    unifiedAIService = aiModule.unifiedAIService
    AI_MODEL_CONFIG = configModule.AI_MODEL_CONFIG
  }
  return { unifiedAIService, AI_MODEL_CONFIG }
}

export async function POST(request: NextRequest) {
  try {
    const { model_id, gpu_server } = await request.json()
    
    console.log(`🔄 AI Model Switch Request: ${model_id}`)
    
    const { unifiedAIService, AI_MODEL_CONFIG } = await getServices()
    
    // If switching to GPU server
    if (gpu_server) {
      const { endpoint, model, api_key } = gpu_server
      
      if (!endpoint || !model) {
        return NextResponse.json({
          success: false,
          error: 'GPU server endpoint and model are required'
        }, { status: 400 })
      }
      
      await unifiedAIService.configureGPUServer(endpoint, model, api_key)
      
      return NextResponse.json({
        success: true,
        message: 'Successfully switched to GPU server',
        active_model: 'custom_gpu_server',
        configuration: {
          endpoint,
          model,
          provider: 'custom'
        }
      })
    }
    
    // Regular model switching
    if (!model_id) {
      return NextResponse.json({
        success: false,
        error: 'Model ID is required'
      }, { status: 400 })
    }
    
    // Validate model exists
    const allModels = {
      ...AI_MODEL_CONFIG.LOCAL_MODELS,
      ...AI_MODEL_CONFIG.REMOTE_MODELS,
      ...AI_MODEL_CONFIG.EXTERNAL_MODELS
    }
    
    if (!allModels[model_id]) {
      return NextResponse.json({
        success: false,
        error: `Model '${model_id}' not found`,
        available_models: Object.keys(allModels)
      }, { status: 400 })
    }
    
    // Switch model
    await unifiedAIService.switchModel(model_id)
    
    const newConfig = allModels[model_id]
    
    return NextResponse.json({
      success: true,
      message: `Successfully switched to ${newConfig.name}`,
      active_model: model_id,
      configuration: {
        name: newConfig.name,
        provider: newConfig.provider,
        description: newConfig.description,
        use_case: newConfig.use_case
      }
    })
    
  } catch (error) {
    console.error('❌ Model switch error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { unifiedAIService, AI_MODEL_CONFIG } = await getServices()
    
    // Get current status
    await unifiedAIService.initialize()
    const status = unifiedAIService.getSystemStatus()
    
    // Get all available models
    const allModels = {
      ...AI_MODEL_CONFIG.LOCAL_MODELS,
      ...AI_MODEL_CONFIG.REMOTE_MODELS,
      ...AI_MODEL_CONFIG.EXTERNAL_MODELS
    }
    
    const availableModels = Object.entries(allModels).map(([id, config]: [string, any]) => ({
      id,
      name: config.name,
      provider: config.provider,
      description: config.description,
      use_case: config.use_case,
      is_active: id === AI_MODEL_CONFIG.ACTIVE.PRIMARY,
      is_fallback: id === AI_MODEL_CONFIG.ACTIVE.FALLBACK
    }))
    
    return NextResponse.json({
      message: 'AI Model Management System',
      current_configuration: {
        active_model: status.active_model,
        fallback_model: status.fallback_model,
        connections: status.connections,
        performance: status.performance
      },
      available_models: availableModels,
      model_categories: {
        local: Object.keys(AI_MODEL_CONFIG.LOCAL_MODELS),
        remote_gpu: Object.keys(AI_MODEL_CONFIG.REMOTE_MODELS),
        external: Object.keys(AI_MODEL_CONFIG.EXTERNAL_MODELS)
      },
      quick_switch_examples: {
        'Development (Local)': 'local_ollama',
        'Production (GPU)': 'runpod_llama',
        'Reliable Fallback': 'openai_gpt4',
        'Advanced Reasoning': 'anthropic_claude'
      },
      gpu_server_setup: {
        endpoint: 'POST /api/ai-model-switch',
        body_example: {
          gpu_server: {
            endpoint: 'https://your-gpu-server.com',
            model: 'your-model-name',
            api_key: 'your-api-key'
          }
        }
      },
      migration_ready: true
    })
    
  } catch (error) {
    console.error('❌ Error getting model information:', error)
    
    return NextResponse.json({
      message: 'AI Model Management System',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 