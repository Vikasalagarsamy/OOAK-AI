import { NextRequest, NextResponse } from 'next/server'
import { getAllMessages, getAllJourneys, getBusinessInsights, ensureInitialized } from '../../../lib/message-orchestrator'

// **BUSINESS INTELLIGENCE API**
// Provides AI insights about client communications and business performance
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generating business insights from AI orchestrator...')
    
    // **ENSURE ORCHESTRATOR IS LOADED**
    await ensureInitialized()
    
    // **GET ALL DATA FROM ORCHESTRATOR**
    const allMessages = getAllMessages()
    const allJourneys = getAllJourneys()
    const basicInsights = getBusinessInsights()
    
    // **ADVANCED AI ANALYSIS**
    const insights = {
      // Basic Stats
      overview: {
        total_clients: basicInsights.total_clients,
        total_messages: basicInsights.total_messages,
        active_conversations: basicInsights.active_conversations,
        journey_distribution: basicInsights.journey_stages
      },
      
      // Message Analysis
      communication_patterns: {
        messages_by_direction: {
          incoming: allMessages.filter(m => m.direction === 'incoming').length,
          outgoing: allMessages.filter(m => m.direction === 'outgoing').length
        },
        platforms_used: [...new Set(allMessages.map(m => m.platform))],
        average_response_time: calculateAverageResponseTime(allMessages),
        peak_communication_hours: getPeakHours(allMessages)
      },
      
      // Business Intelligence
      business_analysis: {
        intent_distribution: getIntentDistribution(allMessages),
        sentiment_analysis: getSentimentAnalysis(allMessages),
        conversion_funnel: getConversionFunnel(allJourneys),
        urgent_requests: allMessages.filter(m => m.context.sentiment === 'urgent').length
      },
      
      // Client Journey Insights
      client_insights: {
        new_clients_today: getNewClientsToday(allJourneys),
        retention_rate: calculateRetentionRate(allJourneys),
        high_value_clients: allJourneys.filter(j => j.business_value === 'high').length,
        journey_completion_rate: calculateJourneyCompletion(allJourneys)
      },
      
      // AI Recommendations
      ai_recommendations: generateAIRecommendations(allMessages, allJourneys),
      
      // Recent Activity
      recent_activity: {
        latest_messages: allMessages.slice(-10).map(m => ({
          timestamp: m.timestamp,
          client: m.client_name || `Client ${m.client_phone}`,
          direction: m.direction,
          intent: m.context.business_intent,
          sentiment: m.context.sentiment
        })),
        pending_responses: allMessages.filter(m => 
          m.direction === 'incoming' && 
          m.ai_response?.response_type === 'human_required'
        ).length
      }
    }
    
    console.log(`📈 Generated insights for ${insights.overview.total_clients} clients`)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      insights
    })
    
  } catch (error: any) {
    console.error('❌ Error generating business insights:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// **HELPER FUNCTIONS FOR AI ANALYSIS**

function calculateAverageResponseTime(messages: any[]): string {
  // Simple implementation - can be enhanced
  return "< 2 minutes (testing mode)"
}

function getPeakHours(messages: any[]): string[] {
  const hours = messages.map(m => new Date(m.timestamp).getHours())
  const hourCounts = hours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const peakHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`)
  
  return peakHours
}

function getIntentDistribution(messages: any[]): Record<string, number> {
  return messages.reduce((acc, msg) => {
    const intent = msg.context.business_intent
    acc[intent] = (acc[intent] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function getSentimentAnalysis(messages: any[]): Record<string, number> {
  return messages.reduce((acc, msg) => {
    const sentiment = msg.context.sentiment
    acc[sentiment] = (acc[sentiment] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function getConversionFunnel(journeys: any[]): Record<string, number> {
  return journeys.reduce((acc, journey) => {
    const stage = journey.journey_stage
    acc[stage] = (acc[stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function getNewClientsToday(journeys: any[]): number {
  const today = new Date().toDateString()
  return journeys.filter(j => 
    new Date(j.first_contact).toDateString() === today
  ).length
}

function calculateRetentionRate(journeys: any[]): string {
  // Simple calculation - can be enhanced
  const activeClients = journeys.filter(j => {
    const lastContact = new Date(j.last_contact)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return lastContact > weekAgo
  }).length
  
  const totalClients = journeys.length
  const rate = totalClients > 0 ? (activeClients / totalClients * 100).toFixed(1) : '0'
  return `${rate}%`
}

function calculateJourneyCompletion(journeys: any[]): string {
  const completedJourneys = journeys.filter(j => 
    j.journey_stage === 'booking' || j.journey_stage === 'service'
  ).length
  
  const totalJourneys = journeys.length
  const rate = totalJourneys > 0 ? (completedJourneys / totalJourneys * 100).toFixed(1) : '0'
  return `${rate}%`
}

function generateAIRecommendations(messages: any[], journeys: any[]): string[] {
  const recommendations: string[] = []
  
  // Analysis-based recommendations
  const urgentMessages = messages.filter(m => m.context.sentiment === 'urgent')
  if (urgentMessages.length > 0) {
    recommendations.push(`⚡ ${urgentMessages.length} urgent messages need immediate attention`)
  }
  
  const discoveryClients = journeys.filter(j => j.journey_stage === 'discovery')
  if (discoveryClients.length > 3) {
    recommendations.push(`📈 ${discoveryClients.length} clients in discovery phase - send portfolio samples`)
  }
  
  const considerationClients = journeys.filter(j => j.journey_stage === 'consideration')
  if (considerationClients.length > 2) {
    recommendations.push(`💰 ${considerationClients.length} clients considering pricing - send customized quotes`)
  }
  
  if (recommendations.length === 0) {
    recommendations.push("✅ All communications are up to date - great job!")
  }
  
  return recommendations
} 