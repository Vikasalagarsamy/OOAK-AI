import { query, transaction } from '@/lib/postgresql-client'

interface WhatsAppConfig {
  businessPhoneNumberId: string
  accessToken: string
  webhookVerifyToken: string
  webhookUrl: string
}

interface WhatsAppMessage {
  userId: number
  phoneNumber: string
  templateId?: string
  messageContent: string
  notificationId?: string
  aiTimingScore?: number
  aiPersonalizationScore?: number
}

interface WhatsAppTemplate {
  templateName: string
  templateType: 'notification' | 'marketing' | 'follow_up' | 'reminder'
  templateContent: string
  variables: string[]
  languageCode?: string
}

export class WhatsAppService {
  private config: WhatsAppConfig | null = null

  async getConfig(): Promise<WhatsAppConfig | null> {
    if (this.config) return this.config

    try {
      const result = await query(
        'SELECT business_phone_number_id, access_token, webhook_verify_token, webhook_url FROM whatsapp_config WHERE is_active = $1 LIMIT 1',
        [true]
      )

      if (!result.rows.length) {
        console.error('WhatsApp config not found')
        return null
      }

      const data = result.rows[0]
      this.config = {
        businessPhoneNumberId: data.business_phone_number_id,
        accessToken: data.access_token,
        webhookVerifyToken: data.webhook_verify_token,
        webhookUrl: data.webhook_url
      }

      return this.config
    } catch (error) {
      console.error('❌ Error fetching WhatsApp config:', error)
      return null
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean, messageId?: string, error?: string }> {
    try {
      const config = await this.getConfig()
      if (!config) {
        return { success: false, error: 'WhatsApp not configured' }
      }

      // Get AI timing optimization
      const optimalTiming = await this.getAITimingRecommendation(message.userId)
      
      // Get personalization recommendations
      const personalization = await this.getPersonalizationRecommendations(message.userId)

      // Apply AI optimizations to message
      const optimizedMessage = await this.applyAIOptimizations(
        message.messageContent, 
        personalization
      )

      // Send via WhatsApp Business API
      const whatsappResponse = await this.sendToWhatsApp(
        config,
        message.phoneNumber,
        optimizedMessage
      )

      if (whatsappResponse.success) {
        // Store message in database
        await this.storeMessage({
          ...message,
          messageContent: optimizedMessage,
          aiTimingScore: optimalTiming.confidence,
          aiPersonalizationScore: personalization.confidence
        }, whatsappResponse.messageId!)

        // Track analytics
        await this.trackEngagement({
          userId: message.userId,
          notificationId: message.notificationId,
          channel: 'whatsapp',
          engagementType: 'sent',
          aiScores: {
            timing: optimalTiming.confidence,
            personalization: personalization.confidence
          }
        })

        return { success: true, messageId: whatsappResponse.messageId }
      } else {
        return { success: false, error: whatsappResponse.error }
      }

    } catch (error) {
      console.error('❌ WhatsApp send error:', error)
      return { success: false, error: 'Failed to send WhatsApp message' }
    }
  }

  private async sendToWhatsApp(
    config: WhatsAppConfig, 
    phoneNumber: string, 
    message: string
  ): Promise<{ success: boolean, messageId?: string, error?: string }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.businessPhoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: {
              body: message
            }
          })
        }
      )

      const data = await response.json()

      if (response.ok && data.messages?.[0]?.id) {
        return { success: true, messageId: data.messages[0].id }
      } else {
        return { success: false, error: data.error?.message || 'WhatsApp API error' }
      }

    } catch (error) {
      return { success: false, error: 'Network error sending to WhatsApp' }
    }
  }

  private async getAITimingRecommendation(userId: number): Promise<{ confidence: number, reasoning: string }> {
    try {
      // Get user behavior patterns
      const result = await query(
        'SELECT engagement_patterns, response_time_patterns FROM user_ai_profiles WHERE user_id = $1',
        [userId]
      )

      if (!result.rows.length) {
        return { confidence: 0.5, reasoning: 'No user profile data available' }
      }

      const profile = result.rows[0]
      
      // Simulate AI timing analysis
      const currentHour = new Date().getHours()
      const engagementPatterns = profile.engagement_patterns || {}
      const hourlyEngagement = engagementPatterns[currentHour] || 0.5

      return {
        confidence: Math.min(0.95, hourlyEngagement + 0.1),
        reasoning: `Based on user activity patterns, current time has ${Math.round(hourlyEngagement * 100)}% engagement probability`
      }

    } catch (error) {
      console.error('❌ Error analyzing timing patterns:', error)
      return { confidence: 0.5, reasoning: 'Error analyzing timing patterns' }
    }
  }

  private async getPersonalizationRecommendations(userId: number): Promise<{
    confidence: number,
    style: string,
    tone: string,
    length: string
  }> {
    try {
      const result = await query(
        'SELECT personality_type, communication_style, preferred_content_length, content_preferences FROM user_ai_profiles WHERE user_id = $1',
        [userId]
      )

      if (!result.rows.length) {
        return {
          confidence: 0.5,
          style: 'formal',
          tone: 'professional',
          length: 'medium'
        }
      }

      const profile = result.rows[0]

      return {
        confidence: 0.85,
        style: profile.communication_style || 'formal',
        tone: profile.personality_type === 'analytical' ? 'professional' : 'friendly',
        length: profile.preferred_content_length || 'medium'
      }

    } catch (error) {
      console.error('❌ Error getting personalization recommendations:', error)
      return {
        confidence: 0.5,
        style: 'formal',
        tone: 'professional',
        length: 'medium'
      }
    }
  }

  private async applyAIOptimizations(
    originalMessage: string,
    personalization: { style: string, tone: string, length: string }
  ): Promise<string> {
    // AI-powered message optimization based on user preferences
    let optimizedMessage = originalMessage

    // Apply style adjustments
    if (personalization.style === 'casual') {
      optimizedMessage = optimizedMessage.replace(/Dear/gi, 'Hi')
      optimizedMessage = optimizedMessage.replace(/Regards/gi, 'Thanks')
    }

    // Apply tone adjustments
    if (personalization.tone === 'friendly') {
      optimizedMessage = optimizedMessage.replace(/Please be informed/gi, 'Just wanted to let you know')
    }

    // Apply length adjustments
    if (personalization.length === 'short') {
      // Truncate to essential information only
      const sentences = optimizedMessage.split('.')
      optimizedMessage = sentences.slice(0, 2).join('.') + '.'
    }

    return optimizedMessage
  }

  private async storeMessage(message: WhatsAppMessage, messageId: string): Promise<void> {
    try {
      await query(
        `INSERT INTO whatsapp_messages (
          user_id, phone_number, template_id, message_content, message_id, 
          notification_id, ai_timing_score, ai_personalization_score, status, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          message.userId,
          message.phoneNumber,
          message.templateId,
          message.messageContent,
          messageId,
          message.notificationId,
          message.aiTimingScore,
          message.aiPersonalizationScore,
          'sent',
          new Date().toISOString()
        ]
      )

    } catch (error) {
      console.error('❌ Error storing WhatsApp message:', error)
    }
  }

  private async trackEngagement(data: {
    userId: number
    notificationId?: string
    channel: string
    engagementType: string
    aiScores: { timing: number, personalization: number }
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO user_engagement_analytics (
          user_id, notification_id, engagement_type, channel, context_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.userId,
          data.notificationId,
          data.engagementType,
          data.channel,
          JSON.stringify({
            ai_timing_score: data.aiScores.timing,
            ai_personalization_score: data.aiScores.personalization
          }),
          new Date().toISOString()
        ]
      )

    } catch (error) {
      console.error('❌ Error tracking engagement:', error)
    }
  }

  // Template management
  async getTemplate(templateName: string): Promise<WhatsAppTemplate | null> {
    try {
      const result = await query(
        'SELECT template_name, template_type, template_content, variables, language_code FROM whatsapp_templates WHERE template_name = $1 AND status = $2',
        [templateName, 'approved']
      )

      if (!result.rows.length) return null

      const data = result.rows[0]
      return {
        templateName: data.template_name,
        templateType: data.template_type,
        templateContent: data.template_content,
        variables: data.variables || [],
        languageCode: data.language_code
      }

    } catch (error) {
      console.error('❌ Error getting template:', error)
      return null
    }
  }

  async createTemplate(template: WhatsAppTemplate): Promise<{ success: boolean, error?: string }> {
    try {
      await query(
        `INSERT INTO whatsapp_templates (
          template_name, template_type, template_content, variables, language_code, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          template.templateName,
          template.templateType,
          template.templateContent,
          JSON.stringify(template.variables),
          template.languageCode || 'en',
          new Date().toISOString()
        ]
      )

      return { success: true }

    } catch (error) {
      console.error('❌ Error creating template:', error)
      return { success: false, error: 'Failed to create template' }
    }
  }

  // Webhook handling for delivery status
  async handleWebhook(payload: any): Promise<void> {
    try {
      if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
        const statuses = payload.entry[0].changes[0].value.statuses

        for (const status of statuses) {
          await this.updateMessageStatus(status.id, status.status, status.timestamp)
        }
      }

    } catch (error) {
      console.error('❌ Error handling WhatsApp webhook:', error)
    }
  }

  private async updateMessageStatus(messageId: string, status: string, timestamp: string): Promise<void> {
    try {
      let updateQuery = 'UPDATE whatsapp_messages SET status = $1'
      let params = [status, messageId]

      if (status === 'delivered') {
        updateQuery += ', delivered_at = $3'
        params.splice(2, 0, new Date(parseInt(timestamp) * 1000).toISOString())
      } else if (status === 'read') {
        updateQuery += ', read_at = $3'
        params.splice(2, 0, new Date(parseInt(timestamp) * 1000).toISOString())
      }

      updateQuery += ' WHERE message_id = $2'

      await query(updateQuery, params)

    } catch (error) {
      console.error('❌ Error updating message status:', error)
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService() 