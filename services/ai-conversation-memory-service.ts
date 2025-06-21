// 🎯 MIGRATED: AI Conversation Memory Service - PostgreSQL Version
// Original: services/ai-conversation-memory-service.ts (Supabase)
// Migrated: Direct PostgreSQL queries for conversation learning and memory

import { query, transaction } from "@/lib/postgresql-client"

export interface ConversationPattern {
  id: string;
  speaker_type: 'CLIENT' | 'AGENT';
  intent_category: string;
  original_text: string;
  normalized_pattern: string;
  response_effectiveness: number;
  context_tags: string[];
  business_outcome: 'positive' | 'negative' | 'neutral';
  frequency_count: number;
  last_seen: string;
  created_at: string;
}

export interface ClientBehaviorPattern {
  objection_type: string;
  typical_phrases: string[];
  successful_agent_responses: string[];
  conversion_rate: number;
  price_sensitivity_level: number;
}

export interface AgentResponsePattern {
  situation_type: string;
  successful_responses: string[];
  effectiveness_score: number;
  closing_rate: number;
  avg_deal_value: number;
}

export class AIConversationMemoryService {
  
  /**
   * Processes a labeled transcript to extract learning patterns
   */
  static async processConversationForLearning(
    callId: string,
    labeledTranscript: string,
    businessOutcome: 'positive' | 'negative' | 'neutral',
    dealValue?: number
  ): Promise<{
    clientPatterns: ConversationPattern[];
    agentPatterns: ConversationPattern[];
    learningInsights: string[];
  }> {
    console.log('🧠 Processing conversation for AI learning with PostgreSQL...')
    
    const lines = labeledTranscript.split('\n').filter(line => line.trim());
    const clientPatterns: ConversationPattern[] = [];
    const agentPatterns: ConversationPattern[] = [];
    const learningInsights: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || '';
      
      if (line.startsWith('[CLIENT]:')) {
        const clientText = line.replace('[CLIENT]:', '').trim();
        const pattern = await this.analyzeClientSpeech(clientText, nextLine, businessOutcome);
        if (pattern) {
          clientPatterns.push(pattern);
        }
      }
      
      if (line.startsWith('[AGENT]:')) {
        const agentText = line.replace('[AGENT]:', '').trim();
        const pattern = await this.analyzeAgentSpeech(agentText, nextLine, businessOutcome, dealValue);
        if (pattern) {
          agentPatterns.push(pattern);
        }
      }
    }

    // Generate learning insights
    learningInsights.push(...this.generateLearningInsights(clientPatterns, agentPatterns, businessOutcome));

    // Store patterns for AI learning in PostgreSQL
    await this.storeConversationPatterns(callId, [...clientPatterns, ...agentPatterns]);

    console.log(`✅ Processed ${clientPatterns.length + agentPatterns.length} conversation patterns`)

    return { clientPatterns, agentPatterns, learningInsights };
  }

  /**
   * Analyzes client speech to identify patterns, objections, buying signals
   */
  private static async analyzeClientSpeech(
    clientText: string,
    agentResponse: string,
    outcome: 'positive' | 'negative' | 'neutral'
  ): Promise<ConversationPattern | null> {
    const text = clientText.toLowerCase();
    
    let intentCategory = 'unknown';
    const contextTags: string[] = [];

    // Price objections
    if (text.includes('expensive') || text.includes('costly') || text.includes('budget') || text.includes('cheaper')) {
      intentCategory = 'price_objection';
      contextTags.push('price_sensitive');
    }
    // Time concerns  
    else if (text.includes('time') || text.includes('schedule') || text.includes('busy') || text.includes('later')) {
      intentCategory = 'timing_concern';
      contextTags.push('scheduling_issue');
    }
    // Venue/location discussion
    else if (text.includes('venue') || text.includes('location') || text.includes('place') || text.includes('hall')) {
      intentCategory = 'venue_discussion';
      contextTags.push('venue_planning');
    }
    // Positive buying signals
    else if (text.includes('yes') || text.includes('okay') || text.includes('good') || text.includes('interested')) {
      intentCategory = 'buying_signal';
      contextTags.push('positive_response');
    }
    // Questions (need for information)
    else if (text.includes('?') || text.includes('what') || text.includes('how') || text.includes('when')) {
      intentCategory = 'information_request';
      contextTags.push('seeking_info');
    }

    if (text.length < 5 && !['yes', 'no', 'okay', 'good'].some(word => text.includes(word))) {
      return null;
    }

    return {
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      speaker_type: 'CLIENT',
      intent_category: intentCategory,
      original_text: clientText,
      normalized_pattern: this.normalizeText(clientText),
      response_effectiveness: outcome === 'positive' ? 0.8 : outcome === 'negative' ? 0.2 : 0.5,
      context_tags: contextTags,
      business_outcome: outcome,
      frequency_count: 1,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
  }

  /**
   * Analyzes agent speech to identify successful response patterns
   */
  private static async analyzeAgentSpeech(
    agentText: string,
    clientResponse: string,
    outcome: 'positive' | 'negative' | 'neutral',
    dealValue?: number
  ): Promise<ConversationPattern | null> {
    const text = agentText.toLowerCase();
    
    let intentCategory = 'unknown';
    const contextTags: string[] = [];
    let effectiveness = 0.5;

    // Pricing discussions
    if (text.includes('₹') || text.includes('price') || text.includes('cost') || text.includes('package')) {
      intentCategory = 'pricing_discussion';
      contextTags.push('pricing');
      
      if (clientResponse.toLowerCase().includes('okay') || clientResponse.toLowerCase().includes('yes')) {
        effectiveness = 0.9;
        contextTags.push('price_accepted');
      }
    }
    // Follow-up and scheduling
    else if (text.includes('call you') || text.includes('follow up') || text.includes('schedule') || text.includes('meet')) {
      intentCategory = 'follow_up_scheduling';
      contextTags.push('follow_up');
      effectiveness = outcome === 'positive' ? 0.8 : 0.6;
    }
    // Closing techniques
    else if (text.includes('would you like') || text.includes('shall we') || text.includes('ready to')) {
      intentCategory = 'closing_attempt';
      contextTags.push('closing');
      
      const clientResp = clientResponse.toLowerCase();
      if (clientResp.includes('yes') || clientResp.includes('sure') || clientResp.includes('okay')) {
        effectiveness = 0.9;
        contextTags.push('successful_close');
      }
    }

    if (text.length < 10) {
      return null;
    }

    return {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      speaker_type: 'AGENT',
      intent_category: intentCategory,
      original_text: agentText,
      normalized_pattern: this.normalizeText(agentText),
      response_effectiveness: effectiveness,
      context_tags: contextTags,
      business_outcome: outcome,
      frequency_count: 1,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
  }

  /**
   * Generates autonomous AI response based on learned patterns from PostgreSQL
   */
  static async generateAutonomousResponse(
    clientInput: string,
    conversationContext: string[]
  ): Promise<{
    suggestedResponse: string;
    confidence: number;
    learningSource: string;
    alternativeResponses: string[];
  }> {
    console.log('🤖 Generating AI response from learned patterns...')
    
    const clientIntent = this.classifyClientIntent(clientInput);
    
    try {
      // Query PostgreSQL for learned patterns
      const result = await query(`
        SELECT 
          original_text,
          response_effectiveness,
          context_tags,
          business_outcome
        FROM conversation_patterns 
        WHERE intent_category = $1 
        AND speaker_type = 'AGENT'
        AND response_effectiveness > 0.7
        ORDER BY response_effectiveness DESC, last_seen DESC
        LIMIT 5
      `, [clientIntent])

      const learnedResponses = result.rows

      if (learnedResponses.length > 0) {
        const bestResponse = learnedResponses[0]
        const alternativeResponses = learnedResponses.slice(1).map(r => r.original_text)
        
        return {
          suggestedResponse: bestResponse.original_text,
          confidence: bestResponse.response_effectiveness,
          learningSource: `learned_from_database_${clientIntent}`,
          alternativeResponses
        }
      }
    } catch (error) {
      console.error('❌ Error fetching learned patterns:', error)
    }

    // Fallback to predefined responses
    const responseMap: { [key: string]: { response: string; confidence: number } } = {
      'price_objection': {
        response: "I understand your concern about pricing. Let me explain the value you get with our premium package - it includes 200+ edited photos, same-day highlights, and a professional album. We also have flexible payment options. Would you like to discuss a customized package within your budget?",
        confidence: 0.85
      },
      'venue_discussion': {
        response: "I'll personally visit the venue to understand the lighting and space requirements. We've covered many events at similar locations like Padmavathi Palace. Our team will do a site survey to ensure perfect coverage. When would be a good time to schedule the venue visit?",
        confidence: 0.8
      },
      'timing_concern': {
        response: "I completely understand your time constraints. Let me work around your schedule. I can call you in the evening or we can have a quick 10-minute discussion whenever it's convenient for you. What works best?",
        confidence: 0.75
      },
      'buying_signal': {
        response: "That's wonderful! I'm excited to work with you on this special event. Let me prepare a detailed proposal with all the specifics we discussed. I'll also include some sample work from similar events. Shall we finalize the booking today?",
        confidence: 0.9
      }
    };

    const response = responseMap[clientIntent] || {
      response: "I understand. Let me help you with that. Can you tell me more about your specific requirements?",
      confidence: 0.3
    };

    return {
      suggestedResponse: response.response,
      confidence: response.confidence,
      learningSource: `fallback_pattern_${clientIntent}`,
      alternativeResponses: []
    };
  }

  private static generateLearningInsights(
    clientPatterns: ConversationPattern[],
    agentPatterns: ConversationPattern[],
    outcome: 'positive' | 'negative' | 'neutral'
  ): string[] {
    const insights: string[] = [];

    const priceObjections = clientPatterns.filter(p => p.intent_category === 'price_objection');
    const agentPricingResponses = agentPatterns.filter(p => p.intent_category === 'pricing_discussion');

    if (priceObjections.length > 0 && agentPricingResponses.length > 0) {
      if (outcome === 'positive') {
        insights.push(`✅ SUCCESSFUL PATTERN: Agent's pricing approach worked despite client price concerns`);
        insights.push(`💡 LEARN: "${agentPricingResponses[0].original_text}" - effective pricing response`);
      } else {
        insights.push(`❌ IMPROVEMENT NEEDED: Pricing objection not handled effectively`);
      }
    }

    return insights;
  }

  /**
   * Store conversation patterns in PostgreSQL for AI learning
   */
  private static async storeConversationPatterns(callId: string, patterns: ConversationPattern[]): Promise<void> {
    try {
      console.log(`💾 Storing ${patterns.length} conversation patterns in PostgreSQL...`)

      if (patterns.length === 0) return

      // Use transaction for atomicity
      await transaction(async (client) => {
        for (const pattern of patterns) {
          // Check if similar pattern exists
          const existingResult = await client.query(`
            SELECT id, frequency_count 
            FROM conversation_patterns 
            WHERE normalized_pattern = $1 
            AND intent_category = $2 
            AND speaker_type = $3
            LIMIT 1
          `, [pattern.normalized_pattern, pattern.intent_category, pattern.speaker_type])

          if (existingResult.rows.length > 0) {
            // Update existing pattern
            const existing = existingResult.rows[0]
            await client.query(`
              UPDATE conversation_patterns 
              SET 
                frequency_count = $1,
                last_seen = $2,
                response_effectiveness = (response_effectiveness + $3) / 2,
                context_tags = $4,
                business_outcome = $5
              WHERE id = $6
            `, [
              existing.frequency_count + 1,
              pattern.last_seen,
              pattern.response_effectiveness,
              JSON.stringify(pattern.context_tags),
              pattern.business_outcome,
              existing.id
            ])
          } else {
            // Insert new pattern
            await client.query(`
              INSERT INTO conversation_patterns (
                id,
                speaker_type,
                intent_category,
                original_text,
                normalized_pattern,
                response_effectiveness,
                context_tags,
                business_outcome,
                frequency_count,
                last_seen,
                created_at,
                call_id
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              pattern.id,
              pattern.speaker_type,
              pattern.intent_category,
              pattern.original_text,
              pattern.normalized_pattern,
              pattern.response_effectiveness,
              JSON.stringify(pattern.context_tags),
              pattern.business_outcome,
              pattern.frequency_count,
              pattern.last_seen,
              pattern.created_at,
              callId
            ])
          }
        }
      })

      console.log(`✅ Successfully stored ${patterns.length} conversation patterns in PostgreSQL`)
      
      // Log sample learning for development
      console.log('🧠 AI LEARNING FROM CONVERSATION:', {
        call_id: callId,
        total_patterns: patterns.length,
        client_patterns: patterns.filter(p => p.speaker_type === 'CLIENT').length,
        agent_patterns: patterns.filter(p => p.speaker_type === 'AGENT').length,
        sample_learning: patterns.slice(0, 3).map(p => ({
          speaker: p.speaker_type,
          intent: p.intent_category,
          effectiveness: p.response_effectiveness,
          text: p.original_text.substring(0, 50) + '...'
        }))
      })

    } catch (error) {
      console.error('❌ Error storing conversation patterns in PostgreSQL:', error)
    }
  }

  private static classifyClientIntent(clientInput: string): string {
    const text = clientInput.toLowerCase();
    
    if (text.includes('price') || text.includes('cost') || text.includes('expensive') || text.includes('budget')) {
      return 'price_objection';
    }
    if (text.includes('venue') || text.includes('location') || text.includes('where') || text.includes('place')) {
      return 'venue_discussion';
    }
    if (text.includes('time') || text.includes('schedule') || text.includes('when') || text.includes('busy')) {
      return 'timing_concern';
    }
    if (text.includes('yes') || text.includes('interested') || text.includes('sounds good') || text.includes('okay')) {
      return 'buying_signal';
    }
    
    return 'general_inquiry';
  }

  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get learned behavior patterns for analytics
   */
  static async getClientBehaviorPatterns(): Promise<ClientBehaviorPattern[]> {
    try {
      console.log('📊 Fetching client behavior patterns from PostgreSQL...')

      const result = await query(`
        SELECT 
          intent_category as objection_type,
          array_agg(DISTINCT original_text) as typical_phrases,
          avg(response_effectiveness) as conversion_rate,
          count(*) as frequency
        FROM conversation_patterns 
        WHERE speaker_type = 'CLIENT'
        AND intent_category != 'unknown'
        GROUP BY intent_category
        ORDER BY count(*) DESC
      `)

      return result.rows.map(row => ({
        objection_type: row.objection_type,
        typical_phrases: row.typical_phrases || [],
        successful_agent_responses: [], // Would need additional query
        conversion_rate: parseFloat(row.conversion_rate) || 0,
        price_sensitivity_level: row.objection_type === 'price_objection' ? 0.8 : 0.3
      }))
    } catch (error) {
      console.error('❌ Error fetching client behavior patterns:', error)
      return []
    }
  }

  /**
   * Get successful agent response patterns
   */
  static async getAgentResponsePatterns(): Promise<AgentResponsePattern[]> {
    try {
      console.log('🎯 Fetching agent response patterns from PostgreSQL...')

      const result = await query(`
        SELECT 
          intent_category as situation_type,
          array_agg(original_text ORDER BY response_effectiveness DESC) as successful_responses,
          avg(response_effectiveness) as effectiveness_score,
          count(*) as frequency
        FROM conversation_patterns 
        WHERE speaker_type = 'AGENT'
        AND response_effectiveness > 0.7
        GROUP BY intent_category
        ORDER BY avg(response_effectiveness) DESC
      `)

      return result.rows.map(row => ({
        situation_type: row.situation_type,
        successful_responses: row.successful_responses || [],
        effectiveness_score: parseFloat(row.effectiveness_score) || 0,
        closing_rate: parseFloat(row.effectiveness_score) || 0,
        avg_deal_value: 50000 // Would need to join with deal data
      }))
    } catch (error) {
      console.error('❌ Error fetching agent response patterns:', error)
      return []
    }
  }
} 