import { createClient } from '@/lib/supabase/server'

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
  private supabase = createClient()

  async getConfig(): Promise<WhatsAppConfig | null> {
    if (this.config) return this.config

    const { data, error } = await this.supabase
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('WhatsApp config not found:', error)
      return null
    }

    this.config = {
      businessPhoneNumberId: data.business_phone_number_id,
      accessToken: data.access_token,
      webhookVerifyToken: data.webhook_verify_token,
      webhookUrl: data.webhook_url
    }

    return this.config
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
      console.error('WhatsApp send error:', error)
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
      const { data: profile } = await this.supabase
        .from('user_ai_profiles')
        .select('engagement_patterns, response_time_patterns')
        .eq('user_id', userId)
        .single()

      if (!profile) {
        return { confidence: 0.5, reasoning: 'No user profile data available' }
      }

      // Simulate AI timing analysis
      const currentHour = new Date().getHours()
      const engagementPatterns = profile.engagement_patterns || {}
      const hourlyEngagement = engagementPatterns[currentHour] || 0.5

      return {
        confidence: Math.min(0.95, hourlyEngagement + 0.1),
        reasoning: `Based on user activity patterns, current time has ${Math.round(hourlyEngagement * 100)}% engagement probability`
      }

    } catch (error) {
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
      const { data: profile } = await this.supabase
        .from('user_ai_profiles')
        .select('personality_type, communication_style, preferred_content_length, content_preferences')
        .eq('user_id', userId)
        .single()

      if (!profile) {
        return {
          confidence: 0.5,
          style: 'formal',
          tone: 'professional',
          length: 'medium'
        }
      }

      return {
        confidence: 0.85,
        style: profile.communication_style || 'formal',
        tone: profile.personality_type === 'analytical' ? 'professional' : 'friendly',
        length: profile.preferred_content_length || 'medium'
      }

    } catch (error) {
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
      await this.supabase
        .from('whatsapp_messages')
        .insert({
          user_id: message.userId,
          phone_number: message.phoneNumber,
          template_id: message.templateId,
          message_content: message.messageContent,
          message_id: messageId,
          notification_id: message.notificationId,
          ai_timing_score: message.aiTimingScore,
          ai_personalization_score: message.aiPersonalizationScore,
          status: 'sent',
          sent_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error storing WhatsApp message:', error)
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
      await this.supabase
        .from('user_engagement_analytics')
        .insert({
          user_id: data.userId,
          notification_id: data.notificationId,
          engagement_type: data.engagementType,
          channel: data.channel,
          context_data: {
            ai_timing_score: data.aiScores.timing,
            ai_personalization_score: data.aiScores.personalization
          }
        })

    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  }

  // Template management
  async getTemplate(templateName: string): Promise<WhatsAppTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('template_name', templateName)
        .eq('status', 'approved')
        .single()

      if (error || !data) return null

      return {
        templateName: data.template_name,
        templateType: data.template_type,
        templateContent: data.template_content,
        variables: data.variables || [],
        languageCode: data.language_code
      }

    } catch (error) {
      console.error('Error getting template:', error)
      return null
    }
  }

  async createTemplate(template: WhatsAppTemplate): Promise<{ success: boolean, error?: string }> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_templates')
        .insert({
          template_name: template.templateName,
          template_type: template.templateType,
          template_content: template.templateContent,
          variables: template.variables,
          language_code: template.languageCode || 'en'
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (error) {
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
      console.error('Error handling WhatsApp webhook:', error)
    }
  }

  private async updateMessageStatus(messageId: string, status: string, timestamp: string): Promise<void> {
    try {
      const updateData: any = { status }

      if (status === 'delivered') {
        updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString()
      } else if (status === 'read') {
        updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString()
      }

      await this.supabase
        .from('whatsapp_messages')
        .update(updateData)
        .eq('message_id', messageId)

    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService() 