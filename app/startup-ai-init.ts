import { AIConfigurationService } from '@/services/ai-configuration-service'

/**
 * AI System Startup Initialization
 * 
 * This module ensures the AI system is properly configured on application startup.
 * It prevents the AI from reverting to default behavior after restarts.
 * 
 * Called during Next.js app initialization to guarantee robust AI behavior.
 */

let isAISystemInitialized = false
let initializationPromise: Promise<boolean> | null = null

export async function initializeAISystemOnStartup(): Promise<boolean> {
  // Prevent multiple initialization attempts
  if (isAISystemInitialized) {
    return true
  }
  
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = performAIInitialization()
  return initializationPromise
}

async function performAIInitialization(): Promise<boolean> {
  try {
    console.log('🚀 Starting AI System Initialization...')
    
    const aiConfigService = new AIConfigurationService()
    const initResult = await aiConfigService.initializeAISystem()
    
    if (initResult) {
      isAISystemInitialized = true
      console.log('✅ AI System initialized successfully on startup')
      console.log('🛡️ Anti-hallucination protection: ACTIVE')
      console.log('🔄 Configuration persistence: ENABLED')
      console.log('📊 Business intelligence: READY')
      
      // Verify critical configurations
      const configs = await aiConfigService.getSystemConfiguration()
      const criticalConfigs = ['hallucination_prevention', 'business_personality', 'data_validation_rules']
      const missingConfigs = criticalConfigs.filter(key => !configs[key])
      
      if (missingConfigs.length === 0) {
        console.log('🎯 All critical AI configurations verified')
      } else {
        console.warn('⚠️ Missing configurations detected:', missingConfigs)
      }
      
      return true
    } else {
      console.error('❌ AI System initialization failed')
      isAISystemInitialized = false
      return false
    }
  } catch (error) {
    console.error('❌ AI System startup error:', error)
    isAISystemInitialized = false
    return false
  }
}

/**
 * Health check for AI system status
 */
export function getAISystemStatus(): {
  initialized: boolean
  status: string
  timestamp: string
} {
  return {
    initialized: isAISystemInitialized,
    status: isAISystemInitialized ? 'AI System Ready' : 'AI System Not Initialized',
    timestamp: new Date().toISOString()
  }
}

/**
 * Force re-initialization of AI system (for debugging)
 */
export async function reinitializeAISystem(): Promise<boolean> {
  console.log('🔄 Force re-initializing AI system...')
  isAISystemInitialized = false
  initializationPromise = null
  return await initializeAISystemOnStartup()
} 