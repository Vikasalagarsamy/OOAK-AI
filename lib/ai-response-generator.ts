// AI Response Generator - Enhanced with Business Knowledge
// ======================================================
// Generates intelligent responses using centralized business knowledge

import { getClientJourney, getAllMessages } from './message-orchestrator'
import { 
  generateKnowledgeContext, 
  getResponseTemplate, 
  addTrainingConversation,
  getBusinessProfile 
} from './business-knowledge-base'

interface ResponseContext {
  clientPhone: string
  clientName?: string
  messageContent: string
  conversationHistory: string[]
  businessIntent: string
  sentiment: string
  journeyStage: string
}

// **ENHANCED LLM RESPONSE GENERATION**
export async function generateAIResponse(context: ResponseContext): Promise<string> {
  console.log(`🧠 Generating AI response for ${context.clientPhone}...`)
  
  try {
    // **DETECT INTENT AND EXTRACT KNOWLEDGE**
    const intent = analyzeMessageIntent(context.messageContent)
    const knowledgeContext = generateKnowledgeContext(intent, context.messageContent, 'customer_support')
    
    // **BUILD COMPREHENSIVE CONTEXT FOR LLM**
    const clientJourney = getClientJourney(context.clientPhone)
    const recentMessages = clientJourney?.messages.slice(-5) || []
    
    const conversationContext = recentMessages
      .map(msg => `${msg.direction === 'incoming' ? 'Client' : 'OOAK'}: ${msg.message_content}`)
      .join('\n')
    
    // **ENHANCED SYSTEM PROMPT WITH BUSINESS KNOWLEDGE**
    const systemPrompt = `You are a customer support representative for OOAK Photography. You represent Vikas Alagarsamy, the owner and lead photographer.

BUSINESS KNOWLEDGE:
${knowledgeContext.knowledge}

YOUR PERSONA:
${knowledgeContext.persona.personality.join(', ')} 
Communication Style: ${knowledgeContext.persona.communication_style}

GUIDELINES:
${knowledgeContext.response_guidelines.join('\n')}

CURRENT CONVERSATION CONTEXT:
Client: ${context.clientName || 'Valued client'}
Phone: ${context.clientPhone}
Journey Stage: ${context.journeyStage}
Previous Messages:
${conversationContext}

Current Message: "${context.messageContent}"

INTENT DETECTED: ${intent}

Generate a natural, helpful response that:
1. Addresses their specific question directly
2. Provides relevant pricing/availability information when asked
3. Shows deep knowledge of OOAK services
4. Maintains Vikas's warm, professional personality
5. Includes specific next steps or questions
6. Uses natural photography terminology

Keep response conversational, under 200 words, and include relevant emojis sparingly.`

    // **CALL LOCAL OLLAMA LLM**
    console.log('🔄 Calling Ollama LLM with enhanced business context...')
    
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5:7b', // Available model in Ollama
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 200,
          top_p: 0.9,
          stop: ['\n\nUser:', '\n\nClient:', 'Human:']
        }
      })
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} - ${response.statusText}`)
    }

    const result = await response.json()
    let aiResponse = result.response?.trim() || ''
    
    // **CLEAN UP RESPONSE**
    aiResponse = cleanUpResponse(aiResponse, context.clientName)
    
    if (aiResponse && aiResponse.length > 20) {
      console.log(`✅ AI generated response: ${aiResponse.substring(0, 100)}...`)
      
      // **SAVE AS TRAINING DATA**
      await addTrainingConversation({
        context: `Intent: ${intent}, Journey: ${context.journeyStage}`,
        user_message: context.messageContent,
        ai_response: aiResponse,
        persona: 'customer_support',
        rating: 5, // Default good rating, can be adjusted later
        notes: `Auto-generated response for ${intent} intent`
      })
      
      return aiResponse
    } else {
      throw new Error('Invalid or too short response from LLM')
    }
    
  } catch (error: any) {
    console.error('❌ LLM Response generation failed:', error.message)
    
    // **FALLBACK TO KNOWLEDGE-BASED TEMPLATE**
    return generateKnowledgeBasedFallback(context)
  }
}

// **INTENT ANALYSIS**
function analyzeMessageIntent(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Pricing intents
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget') || lowerMessage.includes('charge')) {
    if (lowerMessage.includes('wedding')) return 'wedding_pricing'
    if (lowerMessage.includes('portrait')) return 'portrait_pricing'
    return 'general_pricing'
  }
  
  // Availability intents
  if (lowerMessage.includes('available') || lowerMessage.includes('book') || lowerMessage.includes('date') || lowerMessage.includes('schedule')) {
    return 'availability_check'
  }
  
  // Portfolio intents
  if (lowerMessage.includes('portfolio') || lowerMessage.includes('work') || lowerMessage.includes('photos') || lowerMessage.includes('examples')) {
    return 'portfolio_request'
  }
  
  // Service inquiries
  if (lowerMessage.includes('wedding')) return 'wedding_inquiry'
  if (lowerMessage.includes('portrait')) return 'portrait_inquiry'
  if (lowerMessage.includes('commercial')) return 'commercial_inquiry'
  if (lowerMessage.includes('event')) return 'event_inquiry'
  
  return 'general_inquiry'
}

// **KNOWLEDGE-BASED FALLBACK**
function generateKnowledgeBasedFallback(context: ResponseContext): string {
  const intent = analyzeMessageIntent(context.messageContent)
  const businessProfile = getBusinessProfile()
  const name = context.clientName || 'there'
  
  switch (intent) {
    case 'wedding_pricing':
      return `Hi ${name}! Thanks for your interest in wedding photography. Our wedding packages start at ₹75,000 for essential coverage (8 hours, 500+ edited photos) and go up to ₹2,00,000 for complete luxury coverage (full day, videography, multiple photographers). Each package includes professional editing, online gallery, and print rights. Would you like detailed information about a specific package that matches your vision? 📸`
    
    case 'portrait_pricing':
      return `Hi ${name}! Our portrait sessions start at ₹15,000 for individual sessions and ₹20,000 for couples. This includes 2-3 hours of shooting, 50+ professionally edited photos, and a beautiful online gallery. What type of portrait session were you thinking about? ✨`
    
    case 'availability_check':
      return `Hi ${name}! I'd love to check availability for your special day. Could you please share your event date and location? We typically book 2-3 months in advance, and our peak wedding season (October-February) tends to fill up quickly. Let me see what we can arrange! 📅`
    
    case 'portfolio_request':
      return `Hi ${name}! I'm excited to share our work with you. You can view our complete portfolio at ${businessProfile.contact.website}, and I'd be happy to send specific examples that match your style preferences. Are you interested in wedding photography, portraits, or commercial work? 📷`
    
    case 'wedding_inquiry':
      return `Hi ${name}! Congratulations on your upcoming wedding! I'm Vikas from OOAK Photography, and I'd love to capture your special day. We specialize in storytelling through photography, creating timeless memories that you'll treasure forever. Could you tell me about your wedding date and vision? 💕`
    
    default:
      return `Hi ${name}! Thanks for reaching out to OOAK Photography. I'm Vikas, and I'm here to help with all your photography needs. We specialize in weddings, portraits, and commercial photography. How can I assist you today? Feel free to ask about our services, pricing, or availability! 📸✨`
  }
}

// **RESPONSE CLEANUP**
function cleanUpResponse(response: string, clientName?: string): string {
  // Remove any unwanted prefixes or artifacts
  let cleaned = response
    .replace(/^(Assistant:|AI:|Bot:|Response:)/i, '')
    .replace(/^["\s]+|["\s]+$/g, '') // Remove quotes and extra spaces
    .trim()
  
  // Ensure it starts properly
  if (!cleaned.toLowerCase().startsWith('hi') && !cleaned.toLowerCase().startsWith('hello')) {
    const name = clientName || 'there'
    cleaned = `Hi ${name}! ${cleaned}`
  }
  
  return cleaned
}

// **RESPONSE ENHANCEMENT**
export function enhanceResponseForDelivery(baseResponse: string, context: ResponseContext): string {
  let enhanced = baseResponse
  
  // Add urgency handling
  if (context.sentiment === 'urgent') {
    enhanced = `⚡ ${enhanced}\n\nI understand this is urgent - I'll prioritize your request!`
  }
  
  // Add call-to-action based on journey stage
  if (context.journeyStage === 'discovery' && !enhanced.includes('call')) {
    enhanced += `\n\n📱 Feel free to call me directly at +91 96773 62524 for a quick chat!`
  }
  
  return enhanced
} 