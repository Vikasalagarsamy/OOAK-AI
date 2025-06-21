import { NextRequest, NextResponse } from 'next/server'
import { gatherCompleteClientIntelligence } from '../../../lib/comprehensive-business-ai'

// **COMPREHENSIVE BUSINESS INTELLIGENCE DASHBOARD**
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientPhone = searchParams.get('client_phone')
    
    if (clientPhone) {
      // **DETAILED CLIENT ANALYSIS**
      console.log(`📊 Generating comprehensive client analysis for ${clientPhone}`)
      
      const clientProfile = await gatherCompleteClientIntelligence(clientPhone)
      
      return NextResponse.json({
        success: true,
        client_analysis: clientProfile,
        analysis_timestamp: new Date().toISOString(),
        data_completeness: {
          basic_info: !!clientProfile.name,
          conversation_history: clientProfile.conversations.length > 0,
          quotation_history: clientProfile.quotations.length > 0,
          service_history: clientProfile.services_booked.length > 0,
          business_intelligence: clientProfile.ai_recommendations.length > 0
        }
      })
    } else {
      // **OVERALL BUSINESS DASHBOARD**
      return NextResponse.json({
        success: true,
        message: 'Comprehensive Business Intelligence Dashboard',
        endpoints: {
          client_analysis: '/api/comprehensive-insights?client_phone=919677362524',
          all_insights: '/api/business-insights',
          ai_chat: '/api/ai-chat'
        },
        capabilities: [
          'Complete client history analysis',
          'Quotation and service tracking',
          'AI-powered recommendations',
          'Zero-error business intelligence',
          'Real-time data aggregation'
        ]
      })
    }
    
  } catch (error: any) {
    console.error('❌ Comprehensive insights error:', error.message)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// **POST: ANALYZE SPECIFIC CLIENT**
export async function POST(request: NextRequest) {
  try {
    const { client_phone, analysis_type } = await request.json()
    
    console.log(`🔍 Deep analysis requested for ${client_phone} (${analysis_type})`)
    
    const startTime = Date.now()
    const clientProfile = await gatherCompleteClientIntelligence(client_phone)
    const analysisTime = Date.now() - startTime
    
    // Generate detailed insights based on analysis type
    let insights = {}
    
    switch (analysis_type) {
      case 'sales_potential':
        insights = {
          type: 'Sales Potential Analysis',
          conversion_probability: `${(clientProfile.conversion_probability * 100).toFixed(1)}%`,
          recommended_approach: clientProfile.client_value === 'high' 
            ? 'VIP treatment with personalized service'
            : 'Standard sales approach with portfolio showcase',
          next_steps: clientProfile.pending_actions,
          urgency: clientProfile.urgency_level >= 4 ? 'HIGH' : 'NORMAL'
        }
        break
        
      case 'service_recommendations':
        insights = {
          type: 'Service Recommendations',
          preferred_services: clientProfile.preferred_services,
          budget_range: clientProfile.budget_range,
          suitable_packages: getSuitablePackages(clientProfile),
          upsell_opportunities: getUpsellOpportunities(clientProfile)
        }
        break
        
      case 'relationship_health':
        insights = {
          type: 'Client Relationship Health',
          communication_frequency: `${clientProfile.conversations.length} total interactions`,
          last_contact: clientProfile.last_contact_date,
          sentiment_trend: analyzeSentimentTrend(clientProfile.conversations),
          relationship_status: clientProfile.client_value === 'high' ? 'Strong' : 'Developing'
        }
        break
        
      default:
        insights = {
          type: 'Complete Analysis',
          summary: `${clientProfile.name} is a ${clientProfile.client_value} value client with ${clientProfile.quotations.length} quotations and ${clientProfile.services_booked.length} completed services`,
          recommendations: clientProfile.ai_recommendations
        }
    }
    
    return NextResponse.json({
      success: true,
      client_phone,
      analysis_type,
      analysis_time_ms: analysisTime,
      insights,
      full_profile: clientProfile
    })
    
  } catch (error: any) {
    console.error('❌ Client analysis error:', error.message)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// **HELPER FUNCTIONS**
function getSuitablePackages(profile: any): string[] {
  const packages = []
  
  if (profile.budget_range.includes('premium')) {
    packages.push('Luxury Wedding Package (₹2,00,000)')
    packages.push('Premium Wedding Package (₹1,25,000)')
  } else if (profile.budget_range.includes('standard')) {
    packages.push('Premium Wedding Package (₹1,25,000)')
    packages.push('Essential Wedding Package (₹75,000)')
  } else {
    packages.push('Essential Wedding Package (₹75,000)')
    packages.push('Custom Portrait Sessions (₹15,000+)')
  }
  
  return packages
}

function getUpsellOpportunities(profile: any): string[] {
  const opportunities = []
  
  if (profile.preferred_services.includes('wedding')) {
    opportunities.push('Pre-wedding photo session')
    opportunities.push('Drone photography add-on')
    opportunities.push('Second photographer')
  }
  
  if (profile.lifetime_value > 100000) {
    opportunities.push('Premium album upgrade')
    opportunities.push('Canvas prints package')
  }
  
  return opportunities
}

function analyzeSentimentTrend(conversations: any[]): string {
  const recentConversations = conversations.slice(-5)
  const positiveCount = recentConversations.filter(c => c.sentiment === 'positive').length
  const negativeCount = recentConversations.filter(c => c.sentiment === 'negative').length
  
  if (positiveCount > negativeCount) return 'Positive trend'
  if (negativeCount > positiveCount) return 'Needs attention'
  return 'Neutral'
} 