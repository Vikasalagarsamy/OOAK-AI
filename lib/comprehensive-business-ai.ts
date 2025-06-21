// Comprehensive Business Intelligence AI System
// =============================================
// ZERO MARGIN FOR ERROR - Complete data analysis before every response

import { query } from '@/lib/postgresql-client'
import { getAllMessages, getClientJourney, getAllJourneys } from './message-orchestrator'
import { getAllKnowledge, getBusinessProfile, getPricingPackages } from './business-knowledge-base'

// **COMPREHENSIVE CLIENT PROFILE**
interface ComprehensiveClientProfile {
  // Basic Information
  client_id: string
  phone_number: string
  name: string
  email?: string
  
  // Lead Information
  lead_status: 'new' | 'contacted' | 'qualified' | 'quoted' | 'booked' | 'completed' | 'cancelled'
  lead_source: string
  first_contact_date: string
  last_contact_date: string
  
  // Quotation History
  quotations: {
    id: string
    quotation_number?: string
    client_name?: string
    bride_name?: string
    groom_name?: string
    amount: number
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'approved'
    workflow_status?: string
    default_package?: string
    service_type: string
    created_date: string
    valid_until: string
    events?: any[]
    phone_numbers?: any
    package_details?: any
    items?: QuotationItem[]
  }[]
  
  // Service History
  services_booked: {
    id: string
    service_type: string
    date: string
    status: 'upcoming' | 'completed' | 'cancelled'
    amount_paid: number
    deliverables_status: string
  }[]
  
  // Communication History
  conversations: {
    timestamp: string
    direction: 'incoming' | 'outgoing'
    platform: string
    content: string
    intent: string
    sentiment: string
    response_quality: number
  }[]
  
  // Business Intelligence
  client_value: 'high' | 'medium' | 'low'
  lifetime_value: number
  conversion_probability: number
  preferred_services: string[]
  budget_range: string
  urgency_level: number
  
  // Current Context
  active_inquiries: string[]
  pending_actions: string[]
  next_follow_up: string
  ai_recommendations: string[]
}

interface QuotationItem {
  service: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

// **COMPREHENSIVE DATA AGGREGATION**
export async function gatherCompleteClientIntelligence(clientPhone: string): Promise<ComprehensiveClientProfile> {
  console.log(`🔍 GATHERING COMPLETE BUSINESS INTELLIGENCE for ${clientPhone}...`)
  
  try {
    // **1. BASIC CLIENT INFORMATION**
    const basicInfo = await getBasicClientInfo(clientPhone)
    
    // **2. LEAD INFORMATION**
    const leadInfo = await getLeadInformation(clientPhone)
    
    // **3. QUOTATION HISTORY**
    const quotationHistory = await getQuotationHistory(clientPhone)
    
    // **4. SERVICE HISTORY**
    const serviceHistory = await getServiceHistory(clientPhone)
    
    // **5. COMPLETE CONVERSATION HISTORY**
    const conversationHistory = await getCompleteConversationHistory(clientPhone)
    
    // **6. BUSINESS INTELLIGENCE ANALYSIS**
    const businessIntelligence = await calculateBusinessIntelligence(clientPhone, quotationHistory, serviceHistory, conversationHistory)
    
    const profile: ComprehensiveClientProfile = {
      ...basicInfo,
      ...leadInfo,
      quotations: quotationHistory,
      services_booked: serviceHistory,
      conversations: conversationHistory,
      ...businessIntelligence
    }
    
    console.log(`✅ COMPLETE PROFILE ASSEMBLED: ${profile.conversations.length} conversations, ${profile.quotations.length} quotations, ${profile.services_booked.length} services`)
    
    return profile
    
  } catch (error: any) {
    console.error('❌ Error gathering client intelligence:', error.message)
    
    // **FALLBACK TO AVAILABLE DATA**
    return await getFallbackClientProfile(clientPhone)
  }
}

// **1. BASIC CLIENT INFORMATION**
async function getBasicClientInfo(clientPhone: string) {
  // Try multiple sources for client information
  const sources = [
    // Source 1: Message orchestrator
    () => {
      const journey = getClientJourney(clientPhone)
      if (journey) {
        return {
          client_id: journey.client_id,
          phone_number: journey.client_phone,
          name: journey.client_name,
          email: journey.client_email
        }
      }
      return null
    },
    
    // Source 2: PostgreSQL leads table
    async () => {
      const data = await query(`SELECT * FROM leads WHERE phone = $1 LIMIT 1`, [clientPhone])
      
      if (data.rows && data.rows.length > 0) {
        const lead = data.rows[0]
        return {
          client_id: lead.id,
          phone_number: lead.phone,
          name: lead.name,
          email: lead.email
        }
      }
      return null
    },
    
    // Source 3: Communications table
    async () => {
      const data = await query(`SELECT * FROM communications WHERE from_phone = $1 ORDER BY timestamp DESC LIMIT 1`, [clientPhone])
      
      if (data.rows && data.rows.length > 0) {
        const comm = data.rows[0]
        return {
          client_id: clientPhone,
          phone_number: comm.from_phone,
          name: `Client ${clientPhone}`,
          email: null
        }
      }
      return null
    }
  ]
  
  // Try each source until we get data
  for (const source of sources) {
    try {
      const result = await source()
      if (result) {
        console.log(`📋 Found basic info from source`)
        return result
      }
    } catch (error) {
      console.log(`⚠️ Source failed, trying next...`)
    }
  }
  
  // Fallback
  return {
    client_id: clientPhone,
    phone_number: clientPhone,
    name: `Client ${clientPhone}`,
    email: null
  }
}

// **2. LEAD INFORMATION**
async function getLeadInformation(clientPhone: string) {
  try {
    const data = await query(`SELECT * FROM leads WHERE phone = $1 LIMIT 1`, [clientPhone])
    
    if (data.rows && data.rows.length > 0) {
      const leadData = data.rows[0]
      return {
        lead_status: leadData.status || 'new',
        lead_source: leadData.source || 'whatsapp',
        first_contact_date: leadData.created_at,
        last_contact_date: leadData.updated_at
      }
    }
  } catch (error) {
    console.log('📝 No lead data found, using defaults')
  }
  
  return {
    lead_status: 'new' as const,
    lead_source: 'whatsapp',
    first_contact_date: new Date().toISOString(),
    last_contact_date: new Date().toISOString()
  }
}

// **3. QUOTATION HISTORY**
async function getQuotationHistory(clientPhone: string) {
  try {
    // Use the new WhatsApp messages mapping to find quotations
    const messageData = await query(`SELECT quotation_id FROM whatsapp_messages WHERE client_phone = $1 AND quotation_id IS NOT NULL`, [clientPhone])
    
    if (messageData.rows && messageData.rows.length > 0) {
      const quotationIds = [...new Set(messageData.rows.map(m => m.quotation_id))]
      
      const quotationsData = await query(`
        SELECT q.*, 
               json_agg(qe.*) FILTER (WHERE qe.id IS NOT NULL) as quotation_events
        FROM quotations q
        LEFT JOIN quotation_events qe ON q.id = qe.quotation_id
        WHERE q.id = ANY($1)
        GROUP BY q.id
        ORDER BY q.created_at DESC
      `, [quotationIds])
      
      if (quotationsData.rows && quotationsData.rows.length > 0) {
        console.log(`💰 Found ${quotationsData.rows.length} quotations via WhatsApp mapping`)
        
        return quotationsData.rows.map(q => ({
          id: q.id,
          quotation_number: q.quotation_number,
          client_name: q.client_name,
          bride_name: q.bride_name,
          groom_name: q.groom_name,
          amount: q.total_amount || 0,
          status: q.status || 'draft',
          workflow_status: q.workflow_status || 'draft',
          service_type: 'wedding_photography',
          created_date: q.created_at,
          valid_until: q.valid_until || q.created_at,
          events: q.quotation_events || [],
          phone_numbers: {
            mobile: q.mobile,
            whatsapp: q.whatsapp,
            alternate_mobile: q.alternate_mobile,
            alternate_whatsapp: q.alternate_whatsapp
          },
          package_details: q.quotation_data || {}
        }))
      }
    }
    
    // Fallback: Try direct phone number matching across all quotation phone columns
    const cleanPhone = clientPhone.replace(/^\+?91/, '').replace(/\s+/g, '')
    
    const directData = await query(`
      SELECT q.*, 
             json_agg(qe.*) FILTER (WHERE qe.id IS NOT NULL) as quotation_events
      FROM quotations q
      LEFT JOIN quotation_events qe ON q.id = qe.quotation_id
      WHERE q.mobile ILIKE $1 OR q.whatsapp ILIKE $1 OR q.alternate_mobile ILIKE $1 OR q.alternate_whatsapp ILIKE $1
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `, [`%${cleanPhone}%`])
    
    if (directData.rows && directData.rows.length > 0) {
      console.log(`💰 Found ${directData.rows.length} quotations via direct phone matching`)
      
      return directData.rows.map(q => ({
        id: q.id,
        quotation_number: q.quotation_number,
        client_name: q.client_name,
        bride_name: q.bride_name,
        groom_name: q.groom_name,
        amount: q.total_amount || 0,
        status: q.status || 'draft',
        workflow_status: q.workflow_status || 'draft',
        service_type: 'wedding_photography',
        created_date: q.created_at,
        valid_until: q.valid_until || q.created_at,
        events: q.quotation_events || [],
        phone_numbers: {
          mobile: q.mobile,
          whatsapp: q.whatsapp,
          alternate_mobile: q.alternate_mobile,
          alternate_whatsapp: q.alternate_whatsapp
        },
        package_details: q.quotation_data || {}
      }))
    }
  } catch (error: any) {
    console.log(`💰 Error accessing quotation data: ${error.message}`)
  }
  
  return []
}

// **4. SERVICE HISTORY**
async function getServiceHistory(clientPhone: string) {
  try {
    const data = await query(`SELECT * FROM services WHERE client_phone = $1 ORDER BY service_date DESC`, [clientPhone])
    
    if (data.rows && data.rows.length > 0) {
      console.log(`📸 Found ${data.rows.length} service records`)
      
      return data.rows.map(s => ({
        id: s.id,
        service_type: s.service_type,
        date: s.service_date,
        status: s.status,
        amount_paid: s.amount_paid || 0,
        deliverables_status: s.deliverables_status || 'pending'
      }))
    }
  } catch (error) {
    console.log('📸 No service history accessible')
  }
  
  return []
}

// **5. COMPLETE CONVERSATION HISTORY**
async function getCompleteConversationHistory(clientPhone: string) {
  // Primary source: WhatsApp messages table (most complete and current)
  try {
    const data = await query(`SELECT * FROM whatsapp_messages WHERE client_phone = $1 ORDER BY timestamp ASC`, [clientPhone])
    
    if (data.rows && data.rows.length > 0) {
      console.log(`💬 Found ${data.rows.length} WhatsApp messages`)
      
      const conversations = data.rows.map(msg => ({
        timestamp: msg.timestamp,
        direction: msg.message_type as 'incoming' | 'outgoing',
        platform: 'whatsapp',
        content: msg.message_text || '',
        intent: detectMessageIntent(msg.message_text || ''),
        sentiment: 'neutral', // Can be enhanced with AI analysis
        response_quality: 5,
        quotation_linked: !!msg.quotation_id
      }))
      
      return conversations
    }
  } catch (error: any) {
    console.log(`💬 Error accessing WhatsApp messages: ${error.message}`)
  }
  
  // Fallback: Message orchestrator
  const journey = getClientJourney(clientPhone)
  if (journey && journey.messages.length > 0) {
    console.log(`💬 Found ${journey.messages.length} orchestrator messages`)
    
    return journey.messages.map(msg => ({
      timestamp: msg.timestamp,
      direction: msg.direction as 'incoming' | 'outgoing',
      platform: msg.platform,
      content: msg.message_content,
      intent: msg.context.business_intent,
      sentiment: msg.context.sentiment,
      response_quality: 5,
      quotation_linked: false
    }))
  }
  
  // Final fallback: Communications table
  try {
    const data = await query(`SELECT * FROM communications WHERE from_phone = $1 ORDER BY timestamp ASC`, [clientPhone])
    
    if (data.rows && data.rows.length > 0) {
      console.log(`💬 Found ${data.rows.length} database messages`)
      
      return data.rows.map(comm => ({
        timestamp: comm.timestamp,
        direction: (comm.is_from_client ? 'incoming' : 'outgoing') as 'incoming' | 'outgoing',
        platform: comm.platform || 'whatsapp',
        content: comm.content,
        intent: 'general',
        sentiment: 'neutral',
        response_quality: 3,
        quotation_linked: false
      }))
    }
  } catch (error) {
    console.log('💬 No communication history accessible')
  }
  
  return []
}

// **6. BUSINESS INTELLIGENCE CALCULATION**
async function calculateBusinessIntelligence(
  clientPhone: string, 
  quotations: any[], 
  services: any[], 
  conversations: any[]
) {
  // Calculate lifetime value
  const lifetimeValue = quotations.reduce((sum, q) => sum + q.amount, 0) + 
                       services.reduce((sum, s) => sum + s.amount_paid, 0)
  
  // Determine client value tier
  let clientValue: 'high' | 'medium' | 'low' = 'low'
  if (lifetimeValue > 150000) clientValue = 'high'
  else if (lifetimeValue > 50000) clientValue = 'medium'
  
  // Calculate conversion probability
  const quotationCount = quotations.length
  const acceptedQuotations = quotations.filter(q => q.status === 'accepted').length
  const conversionProbability = quotationCount > 0 ? (acceptedQuotations / quotationCount) : 0.5
  
  // Analyze preferred services
  const serviceTypes = [...quotations.map(q => q.service_type), ...services.map(s => s.service_type)]
  const preferredServices = [...new Set(serviceTypes)]
  
  // Determine budget range
  const avgQuotation = quotations.length > 0 ? lifetimeValue / quotations.length : 0
  let budgetRange = 'unknown'
  if (avgQuotation > 150000) budgetRange = 'premium (₹1.5L+)'
  else if (avgQuotation > 75000) budgetRange = 'standard (₹75K-₹1.5L)'
  else if (avgQuotation > 0) budgetRange = 'budget (under ₹75K)'
  
  // Calculate urgency level
  const recentMessages = conversations.filter(c => 
    new Date(c.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )
  const urgencyLevel = recentMessages.length > 5 ? 5 : Math.max(1, recentMessages.length)
  
  // Generate AI recommendations
  const aiRecommendations = generateAIRecommendations(
    quotations, services, conversations, clientValue, conversionProbability
  )
  
  return {
    client_value: clientValue,
    lifetime_value: lifetimeValue,
    conversion_probability: conversionProbability,
    preferred_services: preferredServices,
    budget_range: budgetRange,
    urgency_level: urgencyLevel,
    active_inquiries: getActiveInquiries(conversations),
    pending_actions: getPendingActions(quotations, services),
    next_follow_up: calculateNextFollowUp(conversations, quotations),
    ai_recommendations: aiRecommendations
  }
}

// **HELPER FUNCTIONS**
function generateAIRecommendations(quotations: any[], services: any[], conversations: any[], clientValue: string, conversionProbability: number): string[] {
  const recommendations: string[] = []
  
  if (quotations.length > 0 && quotations[0].status === 'sent') {
    recommendations.push('📋 Follow up on pending quotation')
  }
  
  if (conversionProbability > 0.7) {
    recommendations.push('🎯 High conversion probability - prioritize this client')
  }
  
  if (clientValue === 'high') {
    recommendations.push('💎 VIP client - offer premium services and personal attention')
  }
  
  if (conversations.length > 0) {
    const lastMessage = conversations[conversations.length - 1]
    if (lastMessage.direction === 'incoming' && new Date(lastMessage.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      recommendations.push('⚡ Recent inquiry - respond promptly')
    }
  }
  
  return recommendations
}

function getActiveInquiries(conversations: any[]): string[] {
  return conversations
    .filter(c => c.direction === 'incoming' && c.intent !== 'general')
    .slice(-3)
    .map(c => c.intent)
}

function getPendingActions(quotations: any[], services: any[]): string[] {
  const actions: string[] = []
  
  quotations.forEach(q => {
    if (q.status === 'sent') actions.push(`Follow up on quotation #${q.id}`)
    if (q.status === 'accepted') actions.push(`Process booking for quotation #${q.id}`)
  })
  
  services.forEach(s => {
    if (s.status === 'upcoming') actions.push(`Prepare for ${s.service_type} service`)
    if (s.deliverables_status === 'pending') actions.push(`Complete deliverables for service #${s.id}`)
  })
  
  return actions
}

function calculateNextFollowUp(conversations: any[], quotations: any[]): string {
  const lastConversation = conversations[conversations.length - 1]
  const pendingQuotation = quotations.find(q => q.status === 'sent')
  
  if (pendingQuotation) {
    const quotationDate = new Date(pendingQuotation.created_date)
    const followUpDate = new Date(quotationDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    return followUpDate.toISOString()
  }
  
  if (lastConversation && lastConversation.direction === 'incoming') {
    const lastMessageDate = new Date(lastConversation.timestamp)
    const followUpDate = new Date(lastMessageDate.getTime() + 24 * 60 * 60 * 1000)
    return followUpDate.toISOString()
  }
  
  return 'No immediate follow-up needed'
}

// **FALLBACK CLIENT PROFILE**
async function getFallbackClientProfile(clientPhone: string): Promise<ComprehensiveClientProfile> {
  return {
    client_id: clientPhone,
    phone_number: clientPhone,
    name: `Client ${clientPhone}`,
    email: undefined,
    lead_status: 'new',
    lead_source: 'whatsapp',
    first_contact_date: new Date().toISOString(),
    last_contact_date: new Date().toISOString(),
    quotations: [],
    services_booked: [],
    conversations: [],
    client_value: 'medium',
    lifetime_value: 0,
    conversion_probability: 0.5,
    preferred_services: [],
    budget_range: 'unknown',
    urgency_level: 3,
    active_inquiries: [],
    pending_actions: [],
    next_follow_up: 'No immediate follow-up needed',
    ai_recommendations: ['🆕 New client - gather requirements and send portfolio']
  }
}

// **COMPREHENSIVE AI RESPONSE GENERATION**
export async function generateComprehensiveAIResponse(
  clientPhone: string, 
  userMessage: string, 
  persona: 'business_partner' | 'customer_support' = 'customer_support'
): Promise<{
  response: string
  confidence: number
  data_sources: string[]
  processing_time: number
}> {
  const startTime = Date.now()
  console.log(`🧠 COMPREHENSIVE AI ANALYSIS STARTING for ${clientPhone}...`)
  
  try {
    // **DETECT MESSAGE INTENT FOR CONTEXT**
    const messageIntent = detectMessageIntent(userMessage)
    console.log(`🎯 Message intent detected: ${messageIntent}`)
    
    // **ALWAYS USE COMPREHENSIVE PATH - ANALYZE ALL DATA**
    console.log(`🔍 USING COMPREHENSIVE PATH - Complete data analysis required for: "${userMessage}"`)
    
    // **STEP 1: GATHER ALL BUSINESS INTELLIGENCE**
    console.log('🔍 Step 1: Gathering complete client intelligence...')
    const clientProfile = await gatherCompleteClientIntelligence(clientPhone)
    
    // **STEP 2: GET BUSINESS KNOWLEDGE**
    console.log('📚 Step 2: Loading business knowledge base...')
    const businessKnowledge = getAllKnowledge()
    
    // **STEP 3: BUILD COMPREHENSIVE CONTEXT**
    console.log('🔗 Step 3: Building comprehensive context...')
    const comprehensiveContext = buildComprehensiveContext(clientProfile, businessKnowledge, userMessage, persona)
    
    // **STEP 4: GENERATE AI RESPONSE WITH TIMEOUT**
    console.log('🤖 Step 4: Generating AI response with complete context...')
    const aiResponse = await callLLMWithCompleteContext(comprehensiveContext)
    
    const processingTime = Date.now() - startTime
    
    console.log(`✅ COMPREHENSIVE AI RESPONSE GENERATED in ${processingTime}ms`)
    
    return {
      response: aiResponse,
      confidence: calculateResponseConfidence(clientProfile, businessKnowledge),
      data_sources: getDataSources(clientProfile),
      processing_time: processingTime
    }
    
  } catch (error: any) {
    console.error('❌ Comprehensive AI response failed:', error.message)
    
    // **FALLBACK to simple response on error**
    console.log('🔄 Using fallback simple response...')
    return await generateSimpleResponse(clientPhone, userMessage, 'fallback', startTime)
  }
}

// **DETECT MESSAGE INTENT**
function detectMessageIntent(message: string): 'greeting' | 'casual' | 'pricing' | 'availability' | 'portfolio' | 'booking' | 'service_inquiry' | 'services' | 'general' {
  const lowerMessage = message.toLowerCase().trim()
  
  // Greeting patterns
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|namaste|greetings?)[\s!]*$/i.test(lowerMessage)) {
    return 'greeting'
  }
  
  // Casual messages
  if (lowerMessage.length < 20 && /^(thanks?|thank\s*you|ok|okay|alright|cool|great|nice|bye|goodbye|talk\s*soon)[\s!]*$/i.test(lowerMessage)) {
    return 'casual'
  }
  
  // Business inquiries
  if (/price|cost|rate|charge|fee|budget|package|quote/i.test(message)) {
    return 'pricing'
  }
  
  if (/service|what.*do.*you.*offer|what.*you.*do|services/i.test(message)) {
    return 'services'
  }
  
  if (/available|availability|date|schedule|book|slot/i.test(message)) {
    return 'availability'
  }
  
  if (/portfolio|work|photo|picture|sample|gallery|previous/i.test(message)) {
    return 'portfolio'
  }
  
  if (/book|confirm|proceed|wedding|event|shoot/i.test(message)) {
    return 'service_inquiry'
  }
  
  return 'general'
}

// **GENERATE SIMPLE RESPONSE (Fast path) - Using YOUR REAL COMMUNICATION STYLE**
async function generateSimpleResponse(
  clientPhone: string, 
  userMessage: string, 
  intent: string,
  startTime: number
): Promise<{
  response: string
  confidence: number
  data_sources: string[]
  processing_time: number
}> {
  
  // Get basic client info for personalization
  const clientJourney = getClientJourney(clientPhone)
  const clientName = clientJourney?.client_name || 'there'
  
  let response = ''
  
  // ANSWER QUESTIONS DIRECTLY with real information, then use Vikas style
  switch (intent) {
    case 'greeting':
      response = `Hello ${clientName}! Thank you for contacting OOAK.`
      break
      
    case 'casual':
      response = `Thank you. Changes noted.`
      break
      
    case 'pricing':
      // ACTUALLY PROVIDE PACKAGE INFO
      if (/package/i.test(userMessage)) {
        response = `Yes. Essential ₹75k, Premium ₹1.25L, Luxury ₹2L. Which interests you?`
      } else if (/price|cost|rate/i.test(userMessage)) {
        response = `Wedding packages start from ₹75k. Will share details.`
      } else {
        response = `Thank you for sharing your details. We'll get back to you shortly.`
      }
      break
      
    case 'availability':
      // CHECK IF SPECIFIC DATE MENTIONED
      const dateMatch = userMessage.match(/(\w+\s*\d{1,2}(st|nd|rd|th)?|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})/i)
      if (dateMatch) {
        response = `Let me check calendar for ${dateMatch[0]}. Will confirm by tomorrow.`
      } else {
        response = `Could you please share your event details and date?`
      }
      break
      
    case 'services':
      response = `Wedding photography, pre-wedding shoots, portraits, events. Which interests you?`
      break
      
    case 'portfolio':
      response = `Portfolio: https://www.ooak.photography | Instagram: @ooak.photography`
      break
      
    case 'fallback':
      response = `Got it. Will update.`
      break
      
    default:
      response = `Hello! Thank you for contacting OOAK.`
  }
  
  const processingTime = Date.now() - startTime
  
  return {
    response,
    confidence: 0.9, // High confidence - these are your REAL response patterns
    data_sources: ['vikas_conversation_analysis'],
    processing_time: processingTime
  }
}

// **BUILD HUMAN-LIKE CONTEXT WITH COMPLETE DATA ANALYSIS**
function buildComprehensiveContext(
  clientProfile: ComprehensiveClientProfile, 
  businessKnowledge: any, 
  userMessage: string, 
  persona: string
): string {
  
  // Get complete conversation history
  const conversationHistory = clientProfile.conversations.map(c => 
    `${c.timestamp} | ${c.direction.toUpperCase()}: ${c.content}`
  ).join('\n')
  
  // Get detailed quotation information
  const quotationDetails = clientProfile.quotations.map(q => {
    console.log(`🔍 QUOTATION DATA BEING SENT TO AI:`, {
      quotation_number: q.quotation_number,
      id: q.id,
      bride_name: q.bride_name,
      groom_name: q.groom_name,
      amount: q.amount,
      status: q.status,
      workflow_status: q.workflow_status
    })
    return `Quotation ${q.quotation_number || q.id}: Client: ${q.client_name} | Bride: ${q.bride_name} | Groom: ${q.groom_name} | Package: ${q.default_package || q.service_type} | Amount: ₹${q.amount} | Status: ${q.status} | Workflow Status: ${q.workflow_status || 'N/A'} | Created: ${q.created_date}`
  }).join('\n')
  
  // Get recent interactions analysis
  const recentMessages = clientProfile.conversations.slice(-10)
  const incomingMessages = recentMessages.filter(c => c.direction === 'incoming').map(c => c.content)
  const outgoingMessages = recentMessages.filter(c => c.direction === 'outgoing').map(c => c.content)

  return `You are Vikas from OOAK Photography. You MUST analyze ALL available data before responding.

CRITICAL INSTRUCTIONS:
1. READ and ANALYZE all the data below COMPLETELY
2. SEARCH for relevant information to answer the user's question
3. If you find specific data (dates, amounts, names), USE IT in your response
4. NEVER give generic responses when you have actual data
5. Respond in Vikas's style: short, direct, factual

===============================================
CURRENT USER MESSAGE: "${userMessage}"
===============================================

🔍 COMPLETE DATA ANALYSIS REQUIRED:

📋 CLIENT PROFILE SUMMARY:
- Name: ${clientProfile.name || 'Not specified'}
- Phone: ${clientProfile.phone_number}
- Client Value: ${clientProfile.client_value} (₹${clientProfile.lifetime_value} lifetime value)
- Conversion Probability: ${(clientProfile.conversion_probability * 100).toFixed(1)}%
- Budget Range: ${clientProfile.budget_range}

💰 QUOTATION DATA (CHECK THIS FOR PRICING/PACKAGE QUESTIONS):
${quotationDetails || 'No quotations found'}

📱 COMPLETE CONVERSATION HISTORY (CHECK FOR CONTEXT):
${conversationHistory || 'No conversation history'}

🎯 ACTIVE BUSINESS CONTEXT:
- Active Inquiries: ${clientProfile.active_inquiries.join(', ') || 'None'}
- Pending Actions: ${clientProfile.pending_actions.join(', ') || 'None'}
- Next Follow-up: ${clientProfile.next_follow_up || 'Not scheduled'}

📊 RECENT MESSAGE PATTERNS:
Recent incoming questions: ${incomingMessages.slice(-3).join(' | ') || 'None'}
Recent responses given: ${outgoingMessages.slice(-3).join(' | ') || 'None'}

🤖 AI RECOMMENDATIONS:
${clientProfile.ai_recommendations.join('\n') || 'No specific recommendations'}

===============================================
RESPONSE STRATEGY ANALYSIS:
===============================================

STEP 1: ANALYZE THE QUESTION
- What is the user asking about? (pricing, dates, services, status, etc.)
- Is this information available in the data above?

STEP 2: FIND RELEVANT DATA
- Search quotation data for pricing/package information
- Search conversation history for previous discussions
- Check active inquiries for ongoing topics

STEP 3: PROVIDE SPECIFIC ANSWER
If you found specific data:
✅ USE THE ACTUAL DATA (exact amounts, dates, names, workflow_status)
✅ Reference specific quotation numbers (like QT-2025-0001) not just ID numbers
✅ Use workflow_status for current status, not the status field
✅ Answer questions completely (if asked for bride and groom, provide both)
✅ Mention previous conversations if relevant

If no specific data found:
⚠️ Clearly state what information you need
⚠️ Ask specific follow-up questions

EXAMPLES OF REQUIRED ANALYSIS:

❓ "What's my package amount?"
🔍 ANALYZE: Check quotation data for amount and quotation_number
✅ CORRECT: "Your Elite package quotation QT-2025-0001 is ₹2,45,000. Still pending approval."
❌ WRONG: "Your Elite package quotation #1 is ₹245,000. Status: approved."

❓ "What's bride and groom name?"
🔍 ANALYZE: Check quotation data for bride_name and groom_name
✅ CORRECT: "Bride is Ramya and groom is Noble."
❌ WRONG: "Bride: Ramya | Workflow Status: pending_approval"

❓ "When is my wedding?"
🔍 ANALYZE: Check quotation events or conversation history
✅ CORRECT: "Your wedding is June 24th as per quotation QT-2025-0001."
❌ WRONG: "Could you please share your event date?"

❓ "What did we discuss before?"
🔍 ANALYZE: Check conversation history
✅ CORRECT: "We discussed candid photography and your portfolio questions."
❌ WRONG: "Thank you for contacting OOAK..."

===============================================
RESPONSE REQUIREMENTS:
===============================================

1. ALWAYS analyze the data above FIRST
2. Use Vikas's communication style: short, direct, factual
3. Include specific data when available (amounts, dates, names)
4. Reference quotation numbers or conversation history when relevant
5. Keep responses under 25 words unless complex data needed
6. End with action if needed (confirmation, next steps)

NOW ANALYZE ALL THE DATA ABOVE AND RESPOND TO: "${userMessage}"`
}

// **CALL LLM WITH COMPLETE CONTEXT AND FORCE DATA ANALYSIS**
async function callLLMWithCompleteContext(context: string): Promise<string> {
  // **TIMEOUT CONTROLLER - Max 45 seconds for thorough analysis**
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
    console.log('⏰ LLM request timed out after 45 seconds')
  }, 45000) // 45 second timeout for comprehensive analysis
  
  try {
    console.log('🧠 Sending comprehensive context for analysis...')
    
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        prompt: context,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more factual, data-driven responses
          max_tokens: 500, // More tokens for detailed analysis
          top_p: 0.8,
          repeat_penalty: 1.1,
          num_ctx: 4096 // Larger context window for complete data analysis
        }
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const result = await response.json()
    const aiResponse = result.response?.trim() || ''
    
    console.log(`✅ LLM analysis complete. Response length: ${aiResponse.length} chars`)
    
    return aiResponse
    
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error('LLM analysis timed out - using fallback response')
    }
    
    throw error
  }
}

// **CALCULATE RESPONSE CONFIDENCE**
function calculateResponseConfidence(clientProfile: ComprehensiveClientProfile, businessKnowledge: any): number {
  let confidence = 0.5 // Base confidence
  
  // More data = higher confidence
  if (clientProfile.conversations.length > 0) confidence += 0.2
  if (clientProfile.quotations.length > 0) confidence += 0.2
  if (clientProfile.services_booked.length > 0) confidence += 0.1
  
  return Math.min(confidence, 1.0)
}

// **GET DATA SOURCES**
function getDataSources(clientProfile: ComprehensiveClientProfile): string[] {
  const sources: string[] = ['business_knowledge_base']
  
  if (clientProfile.conversations.length > 0) sources.push('conversation_history')
  if (clientProfile.quotations.length > 0) sources.push('quotation_records')
  if (clientProfile.services_booked.length > 0) sources.push('service_history')
  
  return sources
} 