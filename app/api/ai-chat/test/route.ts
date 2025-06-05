import { NextRequest, NextResponse } from 'next/server'
import { LocalLLMService, LLMConfigBuilder, getLLMConfigFromEnv } from '@/services/local-llm-service'

export async function GET() {
  try {
    console.log("🧪 Testing Local LLM connections...")
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        configured: false,
        config: null as any,
        status: 'Not configured'
      },
      ollama: {
        status: 'Not tested',
        message: '',
        model: 'llama3.2'
      },
      lmstudio: {
        status: 'Not tested', 
        message: '',
        model: 'local-model'
      }
    }

    // Test environment configuration
    const envConfig = getLLMConfigFromEnv()
    if (envConfig) {
      results.environment.configured = true
      results.environment.config = envConfig
      
      try {
        const envService = new LocalLLMService(envConfig)
        const envTest = await envService.testConnection()
        results.environment.status = envTest.success ? '✅ Connected' : `❌ ${envTest.message}`
      } catch (error) {
        results.environment.status = `❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`
      }
    }

    // Test Ollama
    try {
      const ollamaConfig = LLMConfigBuilder.ollama('llama3.2')
      const ollamaService = new LocalLLMService(ollamaConfig)
      const ollamaTest = await ollamaService.testConnection()
      results.ollama.status = ollamaTest.success ? '✅ Connected' : '❌ Failed'
      results.ollama.message = ollamaTest.message
    } catch (error) {
      results.ollama.status = '❌ Error'
      results.ollama.message = error instanceof Error ? error.message : 'Connection failed'
    }

    // Test LM Studio
    try {
      const lmstudioConfig = LLMConfigBuilder.lmStudio('local-model')
      const lmstudioService = new LocalLLMService(lmstudioConfig)
      const lmstudioTest = await lmstudioService.testConnection()
      results.lmstudio.status = lmstudioTest.success ? '✅ Connected' : '❌ Failed'
      results.lmstudio.message = lmstudioTest.message
    } catch (error) {
      results.lmstudio.status = '❌ Error'
      results.lmstudio.message = error instanceof Error ? error.message : 'Connection failed'
    }

    return NextResponse.json({
      success: true,
      results,
      recommendations: getRecommendations(results),
      setup: {
        instructions: "Add these to your .env.local file:",
        variables: {
          ollama: [
            "LOCAL_LLM_PROVIDER=ollama",
            "LOCAL_LLM_API_URL=http://localhost:11434/api/generate", 
            "LOCAL_LLM_MODEL=llama3.2"
          ],
          lmstudio: [
            "LOCAL_LLM_PROVIDER=lmstudio",
            "LOCAL_LLM_API_URL=http://localhost:1234/v1/chat/completions",
            "LOCAL_LLM_MODEL=local-model"
          ]
        }
      }
    })

  } catch (error) {
    console.error("❌ LLM test error:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      help: {
        message: "Failed to test LLM connections",
        setup_guide: "See LOCAL_LLM_SETUP.md for detailed setup instructions",
        quick_start: [
          "1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh",
          "2. Pull model: ollama pull llama3.2", 
          "3. Add config to .env.local",
          "4. Restart your dev server"
        ]
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, apiUrl, model, apiKey, testMessage } = await request.json()
    
    if (!provider || !apiUrl || !model) {
      return NextResponse.json(
        { error: 'provider, apiUrl, and model are required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing custom LLM config: ${provider}`)
    
    const customConfig = {
      provider,
      apiUrl,
      model,
      apiKey
    }

    const llmService = new LocalLLMService(customConfig)
    const testResult = await llmService.testConnection()
    
    // If basic test passes, try with business context
    let businessTest = null
    if (testResult.success) {
      try {
        const businessResponse = await llmService.generateIntelligentResponse(
          testMessage || "Give me a brief business overview"
        )
        businessTest = {
          success: true,
          response: businessResponse.substring(0, 200) + "...",
          length: businessResponse.length
        }
      } catch (error) {
        businessTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: testResult.success,
      connection: testResult,
      businessTest,
      config: customConfig,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Custom LLM test error:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getRecommendations(results: any): string[] {
  const recommendations = []
  
  if (results.environment.configured && results.environment.status.includes('✅')) {
    recommendations.push("✅ Your environment is configured and working!")
  } else if (results.ollama.status.includes('✅')) {
    recommendations.push("🎯 Ollama is working! Add Ollama config to your .env.local")
  } else if (results.lmstudio.status.includes('✅')) {
    recommendations.push("🎯 LM Studio is working! Add LM Studio config to your .env.local")
  } else {
    recommendations.push("❌ No working LLM found. Install Ollama or LM Studio first")
    recommendations.push("📖 See LOCAL_LLM_SETUP.md for detailed instructions")
  }
  
  if (results.ollama.status.includes('❌') && results.ollama.message.includes('ECONNREFUSED')) {
    recommendations.push("🔧 Ollama: Run 'ollama serve' to start the server")
  }
  
  if (results.lmstudio.status.includes('❌') && results.lmstudio.message.includes('ECONNREFUSED')) {
    recommendations.push("🔧 LM Studio: Start the local server in LM Studio app")
  }
  
  return recommendations
} 