// Universal Business Knowledge Base
// ================================
// Centralized repository of ALL business knowledge for AI training

import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// **BUSINESS KNOWLEDGE STRUCTURE**
interface BusinessKnowledge {
  // Core Business Information
  business_profile: {
    name: string
    owner: string
    specializations: string[]
    years_experience: number
    location: string
    contact: {
      phone: string
      email: string
      website: string
      social: Record<string, string>
    }
  }

  // Service Portfolio
  services: {
    wedding_photography: ServiceDetails
    portrait_sessions: ServiceDetails
    commercial_photography: ServiceDetails
    event_coverage: ServiceDetails
  }

  // Pricing Intelligence
  pricing: {
    wedding_packages: PricingPackage[]
    portrait_packages: PricingPackage[]
    commercial_rates: PricingPackage[]
    add_ons: AddOnService[]
  }

  // Availability Management
  availability: {
    busy_dates: string[]
    preferred_months: string[]
    booking_lead_time: string
    peak_season: string
    off_season: string
  }

  // Client Communication Patterns
  communication_templates: {
    pricing_inquiries: ResponseTemplate[]
    availability_requests: ResponseTemplate[]
    portfolio_requests: ResponseTemplate[]
    booking_confirmations: ResponseTemplate[]
    follow_ups: ResponseTemplate[]
  }

  // AI Personas
  ai_personas: {
    business_partner: AIPersona
    customer_support: AIPersona
  }

  // Training Data
  training_conversations: TrainingConversation[]
  
  // Business Rules
  business_rules: BusinessRule[]
}

interface ServiceDetails {
  description: string
  typical_duration: string
  deliverables: string[]
  starting_price: number
  popular_add_ons: string[]
}

interface PricingPackage {
  name: string
  price: number
  includes: string[]
  duration: string
  deliverables: string[]
  popular: boolean
}

interface AddOnService {
  name: string
  price: number
  description: string
}

interface ResponseTemplate {
  intent: string
  context: string
  template: string
  personality_notes: string
}

interface AIPersona {
  name: string
  role: string
  personality: string[]
  communication_style: string
  knowledge_access: string[]
  response_guidelines: string[]
}

interface TrainingConversation {
  id: string
  context: string
  user_message: string
  ai_response: string
  persona: 'business_partner' | 'customer_support'
  rating: number
  notes: string
}

interface BusinessRule {
  rule_id: string
  condition: string
  action: string
  priority: number
  active: boolean
}

// **OOAK PHOTOGRAPHY KNOWLEDGE BASE**
const OOAK_KNOWLEDGE: BusinessKnowledge = {
  business_profile: {
    name: "OOAK Photography",
    owner: "Vikas Alagarsamy",
    specializations: ["Wedding Photography", "Portrait Sessions", "Commercial Photography", "Event Coverage"],
    years_experience: 8,
    location: "Bangalore, India",
    contact: {
      phone: "+91 96773 62524",
      email: "vikas@ooak.photography", 
      website: "ooak.photography",
      social: {
        instagram: "@ooak.photography",
        facebook: "OOAK Photography"
      }
    }
  },

  services: {
    wedding_photography: {
      description: "Complete wedding photography coverage from pre-wedding to reception",
      typical_duration: "12-16 hours",
      deliverables: ["500+ edited photos", "Online gallery", "USB drive", "Print release"],
      starting_price: 75000,
      popular_add_ons: ["Second photographer", "Drone shots", "Same day highlights"]
    },
    portrait_sessions: {
      description: "Professional portrait photography for individuals, couples, and families",
      typical_duration: "2-3 hours",
      deliverables: ["50+ edited photos", "Online gallery", "Print release"],
      starting_price: 15000,
      popular_add_ons: ["Additional outfits", "Location change", "Hair & makeup"]
    },
    commercial_photography: {
      description: "Product, corporate, and brand photography for businesses",
      typical_duration: "4-8 hours",
      deliverables: ["High-res images", "Commercial license", "Multiple formats"],
      starting_price: 25000,
      popular_add_ons: ["Video content", "Social media packages", "Retouching"]
    },
    event_coverage: {
      description: "Corporate events, parties, and special occasions",
      typical_duration: "4-6 hours", 
      deliverables: ["200+ edited photos", "Online gallery", "Same day previews"],
      starting_price: 20000,
      popular_add_ons: ["Live photo sharing", "Photo booth", "Prints on site"]
    }
  },

  pricing: {
    wedding_packages: [
      {
        name: "Essential Wedding Package",
        price: 75000,
        includes: ["8 hours coverage", "500+ edited photos", "Online gallery", "USB drive"],
        duration: "8 hours",
        deliverables: ["Digital gallery", "USB with all photos", "Print release"],
        popular: true
      },
      {
        name: "Premium Wedding Package", 
        price: 125000,
        includes: ["12 hours coverage", "800+ edited photos", "Second photographer", "Same day highlights", "Print album"],
        duration: "12 hours",
        deliverables: ["Everything in Essential", "Physical album", "Drone shots", "Second photographer"],
        popular: true
      },
      {
        name: "Luxury Wedding Package",
        price: 200000,
        includes: ["Full day coverage", "1000+ edited photos", "Two photographers", "Videography", "Premium album", "Canvas prints"],
        duration: "16 hours",
        deliverables: ["Complete coverage", "Video highlights", "Premium deliverables"],
        popular: false
      }
    ],
    portrait_packages: [
      {
        name: "Individual Portrait Session",
        price: 15000,
        includes: ["2 hour session", "50+ edited photos", "Online gallery"],
        duration: "2 hours",
        deliverables: ["Digital gallery", "Print release"],
        popular: true
      },
      {
        name: "Couple Portrait Session",
        price: 20000,
        includes: ["3 hour session", "75+ edited photos", "Two locations"],
        duration: "3 hours", 
        deliverables: ["Digital gallery", "Print release", "Social media sizes"],
        popular: true
      }
    ],
    commercial_rates: [
      {
        name: "Product Photography",
        price: 2500,
        includes: ["Per product", "Multiple angles", "Basic retouching"],
        duration: "Per product",
        deliverables: ["High-res images", "Commercial license"],
        popular: true
      }
    ],
    add_ons: [
      {
        name: "Second Photographer",
        price: 15000,
        description: "Additional photographer for different angles and candid moments"
      },
      {
        name: "Drone Photography",
        price: 10000,
        description: "Aerial shots and unique perspectives"
      },
      {
        name: "Same Day Highlights",
        price: 8000,
        description: "20-30 edited photos delivered within 24 hours"
      }
    ]
  },

  availability: {
    busy_dates: ["2025-02-14", "2025-12-25", "2025-12-31"], // Valentine's, Christmas, New Year
    preferred_months: ["October", "November", "December", "January", "February"],
    booking_lead_time: "2-3 months minimum",
    peak_season: "October to February (wedding season)",
    off_season: "June to September (monsoon)"
  },

  communication_templates: {
    pricing_inquiries: [
      {
        intent: "wedding_pricing",
        context: "Client asking about wedding photography prices",
        template: "Hi {name}! I'd love to help with your wedding photography. My wedding packages start at ₹75,000 for essential coverage and go up to ₹2,00,000 for complete luxury coverage. Each package includes professional editing, online gallery, and print rights. Would you like me to share detailed package information based on your specific needs?",
        personality_notes: "Warm, professional, specific pricing mentioned upfront"
      },
      {
        intent: "portrait_pricing",
        context: "Client asking about portrait session prices", 
        template: "Hi {name}! Portrait sessions start at ₹15,000 for individual sessions and ₹20,000 for couples. This includes 2-3 hours of shooting, 50+ professionally edited photos, and an online gallery. What type of portrait session were you thinking about?",
        personality_notes: "Direct, friendly, asks for clarification"
      }
    ],
    availability_requests: [
      {
        intent: "wedding_availability",
        context: "Client asking about wedding date availability",
        template: "Hi {name}! I'd love to check my availability for your special day. Could you please share your wedding date and venue location? I typically book 2-3 months in advance, and {month} is {season_info}. Let me see what we can arrange!",
        personality_notes: "Enthusiastic, asks for specific details, mentions booking timeline"
      }
    ],
    portfolio_requests: [
      {
        intent: "portfolio_sharing",
        context: "Client wants to see work samples",
        template: "Hi {name}! I'm excited to share my work with you. You can view my complete portfolio at ooak.photography, and I'd be happy to send you specific examples that match your style preferences. What type of photography are you most interested in - weddings, portraits, or commercial work?",
        personality_notes: "Excited, provides website, asks for specifics"
      }
    ],
    booking_confirmations: [],
    follow_ups: []
  },

  ai_personas: {
    business_partner: {
      name: "Business Intelligence Vikas",
      role: "Internal business partner and advisor",
      personality: ["Analytical", "Strategic", "Data-driven", "Experienced"],
      communication_style: "Professional colleague who knows every detail of the business",
      knowledge_access: ["Full financial data", "Client analytics", "Market insights", "Operational metrics"],
      response_guidelines: [
        "Speak as an experienced business partner",
        "Provide detailed analytics and insights", 
        "Suggest strategic improvements",
        "Use business terminology",
        "Reference specific data and metrics"
      ]
    },
    customer_support: {
      name: "Customer Support Vikas",
      role: "Expert customer support representative",
      personality: ["Warm", "Professional", "Knowledgeable", "Solution-oriented"],
      communication_style: "Friendly expert who represents Vikas and knows everything about OOAK services",
      knowledge_access: ["Service details", "Pricing information", "Availability", "Portfolio examples"],
      response_guidelines: [
        "Always identify as representing Vikas/OOAK Photography",
        "Be warm but professional",
        "Provide specific, actionable information",
        "Ask relevant follow-up questions",
        "Guide toward booking or consultation",
        "Use photography terminology naturally"
      ]
    }
  },

  training_conversations: [],
  business_rules: [
    {
      rule_id: "pricing_disclosure",
      condition: "Client asks about pricing",
      action: "Always provide starting prices and package options",
      priority: 1,
      active: true
    },
    {
      rule_id: "availability_check",
      condition: "Client asks about dates",
      action: "Ask for specific date and location, mention booking timeline",
      priority: 1,
      active: true
    }
  ]
}

// **PERSISTENT STORAGE**
const KNOWLEDGE_DIR = path.join(process.cwd(), 'data', 'knowledge')
const KNOWLEDGE_FILE = path.join(KNOWLEDGE_DIR, 'business_knowledge.json')
const TRAINING_FILE = path.join(KNOWLEDGE_DIR, 'training_conversations.json')

let businessKnowledge: BusinessKnowledge = OOAK_KNOWLEDGE

// **ENSURE INITIALIZATION**
let isKnowledgeInitialized = false

export async function ensureInitialized() {
  if (!isKnowledgeInitialized) {
    await initKnowledgeBase()
    isKnowledgeInitialized = true
  }
}

// **INITIALIZE KNOWLEDGE BASE**
async function initKnowledgeBase() {
  try {
    if (!existsSync(KNOWLEDGE_DIR)) {
      await mkdir(KNOWLEDGE_DIR, { recursive: true })
    }

    // Load existing knowledge
    if (existsSync(KNOWLEDGE_FILE)) {
      const data = await readFile(KNOWLEDGE_FILE, 'utf-8')
      businessKnowledge = { ...OOAK_KNOWLEDGE, ...JSON.parse(data) }
      console.log('📚 Loaded business knowledge base')
    } else {
      // Save initial knowledge
      await saveKnowledgeBase()
      console.log('🆕 Created new business knowledge base')
    }

    // Load training conversations
    if (existsSync(TRAINING_FILE)) {
      const trainingData = await readFile(TRAINING_FILE, 'utf-8')
      businessKnowledge.training_conversations = JSON.parse(trainingData)
      console.log(`🧠 Loaded ${businessKnowledge.training_conversations.length} training conversations`)
    }

  } catch (error) {
    console.error('❌ Error initializing knowledge base:', error)
  }
}

// **SAVE KNOWLEDGE BASE**
async function saveKnowledgeBase() {
  try {
    await writeFile(KNOWLEDGE_FILE, JSON.stringify(businessKnowledge, null, 2))
    console.log('💾 Saved business knowledge base')
  } catch (error) {
    console.error('❌ Error saving knowledge base:', error)
  }
}

// **KNOWLEDGE ACCESS FUNCTIONS**
export function getBusinessProfile() {
  return businessKnowledge.business_profile
}

export function getServiceDetails(service: keyof typeof businessKnowledge.services) {
  return businessKnowledge.services[service]
}

export function getPricingPackages(category: keyof typeof businessKnowledge.pricing) {
  return businessKnowledge.pricing[category]
}

export function getAvailabilityInfo() {
  return businessKnowledge.availability
}

export function getResponseTemplate(category: string, intent: string) {
  return businessKnowledge.communication_templates[category as keyof typeof businessKnowledge.communication_templates]
    ?.find(template => template.intent === intent)
}

export function getAIPersona(persona: 'business_partner' | 'customer_support') {
  return businessKnowledge.ai_personas[persona]
}

export function getAllKnowledge() {
  return businessKnowledge
}

// **TRAINING DATA MANAGEMENT**
export async function addTrainingConversation(conversation: Omit<TrainingConversation, 'id'>) {
  const trainingConversation: TrainingConversation = {
    id: `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...conversation
  }
  
  businessKnowledge.training_conversations.push(trainingConversation)
  
  // Save training data separately for easy export
  await writeFile(TRAINING_FILE, JSON.stringify(businessKnowledge.training_conversations, null, 2))
  console.log(`📚 Added training conversation: ${trainingConversation.id}`)
  
  return trainingConversation.id
}

export function getTrainingData(persona?: 'business_partner' | 'customer_support') {
  if (persona) {
    return businessKnowledge.training_conversations.filter(conv => conv.persona === persona)
  }
  return businessKnowledge.training_conversations
}

// **KNOWLEDGE-BASED RESPONSE GENERATION**
export function generateKnowledgeContext(intent: string, userMessage: string, persona: 'business_partner' | 'customer_support') {
  const personaInfo = getAIPersona(persona)
  const businessProfile = getBusinessProfile()
  
  let relevantKnowledge = `Business: ${businessProfile.name} (${businessProfile.owner})\n`
  relevantKnowledge += `Specializations: ${businessProfile.specializations.join(', ')}\n`
  relevantKnowledge += `Contact: ${businessProfile.contact.phone}, ${businessProfile.contact.email}\n\n`

  // Add specific knowledge based on intent
  if (intent.includes('pricing') || intent.includes('cost') || intent.includes('budget')) {
    const weddingPrices = getPricingPackages('wedding_packages') as PricingPackage[]
    const portraitPrices = getPricingPackages('portrait_packages') as PricingPackage[]
    
    relevantKnowledge += "PRICING INFORMATION:\n"
    relevantKnowledge += "Wedding Packages:\n"
    weddingPrices.forEach(pkg => {
      relevantKnowledge += `- ${pkg.name}: ₹${pkg.price} (${pkg.includes.join(', ')})\n`
    })
    relevantKnowledge += "\nPortrait Sessions:\n"
    portraitPrices.forEach(pkg => {
      relevantKnowledge += `- ${pkg.name}: ₹${pkg.price} (${pkg.includes.join(', ')})\n`
    })
  }

  if (intent.includes('available') || intent.includes('book') || intent.includes('date')) {
    const availability = getAvailabilityInfo()
    relevantKnowledge += "\nAVAILABILITY INFO:\n"
    relevantKnowledge += `Booking lead time: ${availability.booking_lead_time}\n`
    relevantKnowledge += `Peak season: ${availability.peak_season}\n`
    relevantKnowledge += `Preferred months: ${availability.preferred_months.join(', ')}\n`
  }

  return {
    persona: personaInfo,
    knowledge: relevantKnowledge,
    response_guidelines: personaInfo.response_guidelines
  }
}

// **INITIALIZE ON IMPORT**
initKnowledgeBase().then(() => {
  isKnowledgeInitialized = true
}) 