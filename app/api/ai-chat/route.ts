import { NextRequest, NextResponse } from 'next/server'
import { AIBusinessIntelligenceService } from '@/services/ai-business-intelligence-service'
import { LocalLLMService, getLLMConfigFromEnv, LLMConfigBuilder } from '@/services/local-llm-service'
import { AITaskManagementService } from '@/services/ai-task-management-service'
import { 
  getAllKnowledge, 
  generateKnowledgeContext, 
  addTrainingConversation,
  getBusinessProfile 
} from '../../../lib/business-knowledge-base'
import { getAllMessages, getAllJourneys, getBusinessInsights } from '../../../lib/message-orchestrator'

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id } = await request.json()
    
    console.log('🤝 Business partner AI chat request:', message.substring(0, 100))
    
    // **GATHER COMPLETE BUSINESS CONTEXT**
    const businessKnowledge = getAllKnowledge()
    const allMessages = getAllMessages()
    const allJourneys = getAllJourneys()
    const businessInsights = getBusinessInsights()
    
    // **BUILD COMPREHENSIVE BUSINESS INTELLIGENCE CONTEXT**
    const businessContext = `
COMPLETE BUSINESS OVERVIEW:
===========================

BUSINESS PROFILE:
- Name: ${businessKnowledge.business_profile.name}
- Owner: ${businessKnowledge.business_profile.owner}
- Experience: ${businessKnowledge.business_profile.years_experience} years
- Location: ${businessKnowledge.business_profile.location}
- Specializations: ${businessKnowledge.business_profile.specializations.join(', ')}

CURRENT METRICS:
- Total Clients: ${businessInsights.total_clients}
- Total Messages: ${businessInsights.total_messages}
- Active Conversations: ${businessInsights.active_conversations}
- Journey Distribution: ${JSON.stringify(businessInsights.journey_stages)}

PRICING STRUCTURE:
Wedding Packages:
${businessKnowledge.pricing.wedding_packages.map(pkg => 
  `- ${pkg.name}: ₹${pkg.price} (${pkg.duration})`
).join('\n')}

Portrait Sessions:
${businessKnowledge.pricing.portrait_packages.map(pkg => 
  `- ${pkg.name}: ₹${pkg.price} (${pkg.duration})`
).join('\n')}

RECENT CLIENT ACTIVITY:
${allMessages.slice(-5).map(msg => 
  `${msg.timestamp}: ${msg.direction} - ${msg.context.business_intent} (${msg.context.sentiment})`
).join('\n')}

AVAILABILITY STATUS:
- Booking Lead Time: ${businessKnowledge.availability.booking_lead_time}
- Peak Season: ${businessKnowledge.availability.peak_season}
- Preferred Months: ${businessKnowledge.availability.preferred_months.join(', ')}
`

    // **BUSINESS PARTNER AI PERSONA**
    const persona = businessKnowledge.ai_personas.business_partner
    
    const systemPrompt = `You are an experienced business intelligence partner for OOAK Photography. You have complete access to all business data, metrics, and strategic insights.

YOUR ROLE: ${persona.role}
PERSONALITY: ${persona.personality.join(', ')}
COMMUNICATION STYLE: ${persona.communication_style}

CURRENT BUSINESS CONTEXT:
${businessContext}

RESPONSE GUIDELINES:
${persona.response_guidelines.join('\n')}

Human Query: "${message}"

Provide strategic, data-driven insights as an experienced business partner. Use specific numbers, trends, and actionable recommendations. Speak as a colleague who understands the photography business deeply.`

    // **CALL LLM FOR BUSINESS INTELLIGENCE**
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.6, // Slightly more focused for business analysis
          max_tokens: 300,
          top_p: 0.9
        }
      })
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const result = await response.json()
    let aiResponse = result.response?.trim() || ''
    
    // **CLEAN UP BUSINESS RESPONSE**
    aiResponse = aiResponse
      .replace(/^(Assistant:|AI:|Bot:|Response:)/i, '')
      .trim()
    
    if (aiResponse && aiResponse.length > 20) {
      // **SAVE BUSINESS CONVERSATION FOR LEARNING**
      await addTrainingConversation({
        context: 'Business Intelligence Chat',
        user_message: message,
        ai_response: aiResponse,
        persona: 'business_partner',
        rating: 5,
        notes: 'Business strategy conversation'
      })
      
      console.log(`✅ Business AI response generated: ${aiResponse.substring(0, 100)}...`)
      
      return NextResponse.json({
        success: true,
        response: aiResponse,
        conversation_id,
        insights: {
          total_clients: businessInsights.total_clients,
          total_messages: businessInsights.total_messages,
          active_conversations: businessInsights.active_conversations
        }
      })
    } else {
      throw new Error('Invalid business AI response')
    }
    
  } catch (error: any) {
    console.error('❌ Business AI chat error:', error.message)
    
    // **FALLBACK BUSINESS RESPONSE**
    const fallbackResponse = `I understand you're looking for business insights. Based on our current data, we have ${getAllMessages().length} total messages and ${getAllJourneys().length} clients. Our main focus areas are wedding photography (₹75,000+ packages), portraits (₹15,000+), and commercial work. What specific business area would you like me to analyze?`
    
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      fallback: true,
      error: error.message
    })
  }
}

export async function GET() {
  // Test LLM connection status
  const llmConfig = getLLMConfigFromEnv() || LLMConfigBuilder.ollama()
  let connectionStatus = "Not configured"
  
  try {
    const llmService = new LocalLLMService(llmConfig)
    const testResult = await llmService.testConnection()
    connectionStatus = testResult.success ? "✅ Connected" : `❌ ${testResult.message}`
  } catch (error) {
    connectionStatus = `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
  
  return NextResponse.json({
    message: "AI Business Intelligence Chat API",
    localLLM: {
      configured: !!getLLMConfigFromEnv(),
      status: connectionStatus,
      provider: llmConfig?.provider || 'none',
      model: llmConfig?.model || 'none'
    },
    endpoints: {
      POST: "/api/ai-chat - Send a message to get AI business insights",
      GET: "/api/ai-chat - Check LLM connection status"
    },
    setup: {
      instructions: "Set environment variables to configure your local LLM",
      variables: [
        "LOCAL_LLM_PROVIDER=ollama|lmstudio|openai-compatible",
        "LOCAL_LLM_API_URL=http://localhost:11434/api/generate",
        "LOCAL_LLM_MODEL=llama3.2",
        "LOCAL_LLM_API_KEY=optional"
      ]
    }
  })
} 