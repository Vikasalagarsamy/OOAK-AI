// Universal Business AI - Message Orchestration System
// ====================================================
// Records ALL communications for client journey mapping and AI orchestration

import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface ClientMessage {
  id: string
  timestamp: string
  direction: 'incoming' | 'outgoing'
  platform: 'whatsapp' | 'instagram' | 'email' | 'calls' | 'website'
  client_phone: string
  client_name?: string
  client_email?: string
  message_content: string
  message_type: 'text' | 'image' | 'video' | 'document' | 'audio'
  context: {
    session_id: string
    conversation_stage: 'inquiry' | 'negotiation' | 'booking' | 'service' | 'follow_up'
    business_intent: 'photography' | 'pricing' | 'availability' | 'portfolio' | 'support'
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
  }
  ai_response?: {
    should_respond: boolean
    response_type: 'auto' | 'human_required' | 'scheduled'
    suggested_response?: string
    urgency_level: 1 | 2 | 3 | 4 | 5
  }
  metadata: {
    raw_data: any
    client_journey_stage: string
    previous_interactions: number
    last_interaction: string
  }
}

interface ClientJourney {
  client_id: string
  client_phone: string
  client_name: string
  client_email?: string
  first_contact: string
  last_contact: string
  total_interactions: number
  journey_stage: 'discovery' | 'consideration' | 'booking' | 'service' | 'retention'
  business_value: 'high' | 'medium' | 'low'
  messages: ClientMessage[]
  ai_insights: {
    preferences: string[]
    pain_points: string[]
    budget_signals: string[]
    urgency_indicators: string[]
    next_best_action: string
  }
}

// **PERSISTENT STORAGE**
const STORAGE_DIR = path.join(process.cwd(), 'data')
const MESSAGES_FILE = path.join(STORAGE_DIR, 'all_messages.json')
const JOURNEYS_FILE = path.join(STORAGE_DIR, 'client_journeys.json')

let allMessages: ClientMessage[] = []
let clientJourneys: Map<string, ClientJourney> = new Map()

// **INITIALIZE ORCHESTRATOR**
async function initOrchestrator() {
  try {
    if (!existsSync(STORAGE_DIR)) {
      await mkdir(STORAGE_DIR, { recursive: true })
    }
    
    // Load existing messages
    if (existsSync(MESSAGES_FILE)) {
      const data = await readFile(MESSAGES_FILE, 'utf-8')
      allMessages = JSON.parse(data)
      console.log(`🎯 Loaded ${allMessages.length} messages for AI orchestration`)
    }
    
    // Load client journeys
    if (existsSync(JOURNEYS_FILE)) {
      const data = await readFile(JOURNEYS_FILE, 'utf-8')
      const journeyData = JSON.parse(data)
      clientJourneys = new Map(Object.entries(journeyData))
      console.log(`🗺️ Loaded ${clientJourneys.size} client journeys`)
    }
    
  } catch (error) {
    console.error('❌ Error initializing orchestrator:', error)
  }
}

// **RECORD MESSAGE (INCOMING/OUTGOING)**
export async function recordMessage(
  direction: 'incoming' | 'outgoing',
  platform: string,
  clientPhone: string,
  messageContent: string,
  metadata: any = {}
) {
  console.log(`📝 RECORDING ${direction.toUpperCase()} MESSAGE from ${clientPhone}`)
  
  const messageId = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // **AI ANALYSIS OF MESSAGE**
  const aiAnalysis = await analyzeMessageWithAI(messageContent, direction, clientPhone)
  
  const message: ClientMessage = {
    id: messageId,
    timestamp: new Date().toISOString(),
    direction,
    platform: platform as any,
    client_phone: clientPhone,
    client_name: metadata.client_name,
    client_email: metadata.client_email,
    message_content: messageContent,
    message_type: metadata.message_type || 'text',
    context: {
      session_id: getOrCreateSessionId(clientPhone),
      conversation_stage: aiAnalysis.conversation_stage,
      business_intent: aiAnalysis.business_intent,
      sentiment: aiAnalysis.sentiment
    },
    ai_response: aiAnalysis.response_recommendation,
    metadata: {
      raw_data: metadata,
      client_journey_stage: getClientJourneyStage(clientPhone),
      previous_interactions: getClientInteractionCount(clientPhone),
      last_interaction: getLastInteractionTime(clientPhone)
    }
  }
  
  // **STORE MESSAGE**
  allMessages.push(message)
  await saveMessages()
  
  // **UPDATE CLIENT JOURNEY**
  await updateClientJourney(message)
  
  // **AI ORCHESTRATION DECISION**
  if (direction === 'incoming') {
    await orchestrateResponse(message)
  }
  
  return message
}

// **AI MESSAGE ANALYSIS**
async function analyzeMessageWithAI(content: string, direction: string, clientPhone: string) {
  // Simple pattern matching for now - can be enhanced with actual LLM
  let analysis: {
    conversation_stage: 'inquiry' | 'negotiation' | 'booking' | 'service' | 'follow_up'
    business_intent: 'photography' | 'pricing' | 'availability' | 'portfolio' | 'support'
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
    response_recommendation: {
      should_respond: boolean
      response_type: 'auto' | 'human_required' | 'scheduled'
      urgency_level: 1 | 2 | 3 | 4 | 5
    }
  } = {
    conversation_stage: 'inquiry',
    business_intent: 'photography',
    sentiment: 'neutral',
    response_recommendation: {
      should_respond: direction === 'incoming',
      response_type: 'auto',
      urgency_level: 3
    }
  }
  
  // **PATTERN DETECTION**
  const lowerContent = content.toLowerCase()
  
  // Business intent detection
  if (lowerContent.includes('price') || lowerContent.includes('cost') || lowerContent.includes('budget')) {
    analysis.business_intent = 'pricing'
    analysis.conversation_stage = 'negotiation'
  } else if (lowerContent.includes('available') || lowerContent.includes('book') || lowerContent.includes('date')) {
    analysis.business_intent = 'availability'
    analysis.conversation_stage = 'booking'
  } else if (lowerContent.includes('portfolio') || lowerContent.includes('work') || lowerContent.includes('photos')) {
    analysis.business_intent = 'portfolio'
  }
  
  // Sentiment detection
  if (lowerContent.includes('urgent') || lowerContent.includes('asap') || lowerContent.includes('immediately')) {
    analysis.sentiment = 'urgent'
    analysis.response_recommendation.urgency_level = 5
  } else if (lowerContent.includes('thank') || lowerContent.includes('great') || lowerContent.includes('love')) {
    analysis.sentiment = 'positive'
  }
  
  // Response urgency
  if (clientPhone === '919677362524') { // Testing number
    analysis.response_recommendation.response_type = 'auto'
  } else {
    analysis.response_recommendation.response_type = 'human_required'
  }
  
  return analysis
}

// **UPDATE CLIENT JOURNEY**
async function updateClientJourney(message: ClientMessage) {
  const clientId = message.client_phone
  
  let journey = clientJourneys.get(clientId)
  
  if (!journey) {
    // **NEW CLIENT JOURNEY**
    journey = {
      client_id: clientId,
      client_phone: message.client_phone,
      client_name: message.client_name || `Client ${clientId}`,
      client_email: message.client_email,
      first_contact: message.timestamp,
      last_contact: message.timestamp,
      total_interactions: 0,
      journey_stage: 'discovery',
      business_value: 'medium',
      messages: [],
      ai_insights: {
        preferences: [],
        pain_points: [],
        budget_signals: [],
        urgency_indicators: [],
        next_best_action: 'Send welcome message and portfolio'
      }
    }
    console.log(`🆕 New client journey created for ${clientId}`)
  }
  
  // **UPDATE JOURNEY**
  journey.last_contact = message.timestamp
  journey.total_interactions += 1
  journey.messages.push(message)
  
  // **AI JOURNEY STAGE PROGRESSION**
  if (message.context.business_intent === 'pricing' && journey.journey_stage === 'discovery') {
    journey.journey_stage = 'consideration'
  } else if (message.context.business_intent === 'availability' && journey.journey_stage === 'consideration') {
    journey.journey_stage = 'booking'
  }
  
  clientJourneys.set(clientId, journey)
  await saveJourneys()
  
  console.log(`🗺️ Client journey updated: ${clientId} -> ${journey.journey_stage} (${journey.total_interactions} interactions)`)
}

// **AI ORCHESTRATION ENGINE**
async function orchestrateResponse(message: ClientMessage) {
  console.log(`🎭 AI ORCHESTRATING RESPONSE for ${message.client_phone}`)
  
  const journey = clientJourneys.get(message.client_phone)
  const shouldAutoRespond = message.ai_response?.should_respond && message.client_phone === '919677362524'
  
  if (shouldAutoRespond) {
    console.log(`🤖 Auto-response triggered for testing number`)
    return true
  } else {
    console.log(`👨‍💼 Human response required for client: ${message.client_phone}`)
    // TODO: Notify human agents, add to queue, etc.
    return false
  }
}

// **HELPER FUNCTIONS**
function getOrCreateSessionId(clientPhone: string): string {
  return `session_${clientPhone}_${new Date().toDateString().replace(/\s/g, '_')}`
}

function getClientJourneyStage(clientPhone: string): string {
  return clientJourneys.get(clientPhone)?.journey_stage || 'discovery'
}

function getClientInteractionCount(clientPhone: string): number {
  return clientJourneys.get(clientPhone)?.total_interactions || 0
}

function getLastInteractionTime(clientPhone: string): string {
  return clientJourneys.get(clientPhone)?.last_contact || 'never'
}

// **STORAGE FUNCTIONS**
async function saveMessages() {
  try {
    await writeFile(MESSAGES_FILE, JSON.stringify(allMessages, null, 2))
    console.log(`💾 Saved ${allMessages.length} messages to orchestrator storage`)
  } catch (error) {
    console.error('❌ Error saving messages:', error)
  }
}

async function saveJourneys() {
  try {
    const journeyObject = Object.fromEntries(clientJourneys)
    await writeFile(JOURNEYS_FILE, JSON.stringify(journeyObject, null, 2))
    console.log(`💾 Saved ${clientJourneys.size} client journeys`)
  } catch (error) {
    console.error('❌ Error saving journeys:', error)
  }
}

// **EXPORT FUNCTIONS FOR AI ACCESS**
export function getAllMessages(): ClientMessage[] {
  return allMessages
}

export function getClientJourney(clientPhone: string): ClientJourney | undefined {
  return clientJourneys.get(clientPhone)
}

export function getAllJourneys(): ClientJourney[] {
  return Array.from(clientJourneys.values())
}

export function getBusinessInsights() {
  return {
    total_clients: clientJourneys.size,
    total_messages: allMessages.length,
    active_conversations: Array.from(clientJourneys.values()).filter(j => {
      const lastContact = new Date(j.last_contact)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return lastContact > oneDayAgo
    }).length,
    journey_stages: Array.from(clientJourneys.values()).reduce((acc, journey) => {
      acc[journey.journey_stage] = (acc[journey.journey_stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

// **INITIALIZE ON IMPORT**
let isInitialized = false

export async function ensureInitialized() {
  if (!isInitialized) {
    await initOrchestrator()
    isInitialized = true
  }
}

// Initialize immediately
initOrchestrator().then(() => {
  isInitialized = true
}) 