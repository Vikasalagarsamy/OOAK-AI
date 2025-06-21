// 🎯 MIGRATED: Communication Sync Service - PostgreSQL Version
// Original: services/communication-sync-service.ts (Supabase)
// Migrated: Direct PostgreSQL queries for communication synchronization

import { query, transaction } from "@/lib/postgresql-client"
import { businessIntelligenceService } from './universal-business-intelligence-service'
import { enhancedAIService } from './enhanced-ai-service'

// Platform-specific interfaces
interface WhatsAppWebhookData {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: { phone_number_id: string }
        messages?: Array<{
          id: string
          from: string
          timestamp: string
          text: { body: string }
          type: string
        }>
        statuses?: Array<{
          id: string
          status: string
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

interface InstagramWebhookData {
  object: string
  entry: Array<{
    id: string
    messaging: Array<{
      sender: { id: string }
      recipient: { id: string }
      timestamp: number
      message?: {
        mid: string
        text: string
      }
    }>
  }>
}

interface EmailData {
  messageId: string
  from: string
  to: string[]
  subject: string
  body: string
  timestamp: string
  threadId?: string
}

interface CallData {
  callId: string
  from: string
  to: string
  duration: number
  timestamp: string
  transcript?: string
  recording_url?: string
}

export class CommunicationSyncService {

  // ============================
  // WHATSAPP INTEGRATION
  // ============================

  async processWhatsAppWebhook(webhookData: WhatsAppWebhookData): Promise<{
    processed: boolean
    messages_count: number
    errors: string[]
  }> {
    console.log('📱 Processing WhatsApp webhook data with PostgreSQL')
    
    const errors: string[] = []
    let messagesCount = 0

    try {
      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              try {
                await this.processWhatsAppMessage(message, change.value.metadata.phone_number_id)
                messagesCount++
              } catch (error) {
                console.error('❌ Error processing WhatsApp message:', error)
                errors.push(`Message ${message.id}: ${error instanceof Error ? error.message : String(error)}`)
              }
            }
          }

          if (change.value.statuses) {
            for (const status of change.value.statuses) {
              await this.updateWhatsAppMessageStatus(status)
            }
          }
        }
      }

      // Update sync status
      await this.updateSyncStatus('whatsapp', 'success', messagesCount)

      return {
        processed: true,
        messages_count: messagesCount,
        errors
      }

    } catch (error) {
      console.error('❌ WhatsApp webhook processing failed:', error)
      await this.updateSyncStatus('whatsapp', 'failed', 0, error instanceof Error ? error.message : String(error))
      
      return {
        processed: false,
        messages_count: messagesCount,
        errors: [error.toString()]
      }
    }
  }

  private async processWhatsAppMessage(message: any, businessPhoneId: string): Promise<void> {
    console.log('💬 Processing WhatsApp message:', message.id)

    // Determine if message is from client or employee
    const isFromClient = !await this.isBusinessNumber(message.from, businessPhoneId)

    // Record in universal system
    await businessIntelligenceService.recordWhatsAppMessage({
      messageId: message.id,
      from: message.from,
      to: businessPhoneId,
      text: message.text?.body || '',
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      isFromClient
    })

    // Process with enhanced AI if from client
    if (isFromClient) {
      await enhancedAIService.processIncomingMessage('whatsapp', {
        from: message.from,
        to: businessPhoneId,
        content: message.text?.body || '',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        messageId: message.id
      })
    }
  }

  private async updateWhatsAppMessageStatus(status: any): Promise<void> {
    console.log('📊 Updating WhatsApp message status:', status.id, status.status)

    try {
      // Update communication record with delivery/read status using PostgreSQL
      const updateQuery = `
        UPDATE communications 
        SET 
          delivered_at = CASE WHEN $2 = 'delivered' THEN $3 ELSE delivered_at END,
          read_at = CASE WHEN $2 = 'read' THEN $3 ELSE read_at END,
          updated_at = $4
        WHERE message_id = $1
      `
      
      await query(updateQuery, [
        status.id,
        status.status,
        new Date(parseInt(status.timestamp) * 1000).toISOString(),
        new Date().toISOString()
      ])

      console.log('✅ Message status updated successfully')
    } catch (error) {
      console.error('❌ Error updating message status:', error)
    }
  }

  // ============================
  // INSTAGRAM INTEGRATION
  // ============================

  async processInstagramWebhook(webhookData: InstagramWebhookData): Promise<{
    processed: boolean
    messages_count: number
    errors: string[]
  }> {
    console.log('📸 Processing Instagram webhook data')
    
    const errors: string[] = []
    let messagesCount = 0

    try {
      for (const entry of webhookData.entry) {
        if (entry.messaging) {
          for (const messaging of entry.messaging) {
            if (messaging.message) {
              try {
                await this.processInstagramMessage(messaging)
                messagesCount++
              } catch (error) {
                console.error('❌ Error processing Instagram message:', error)
                errors.push(`Message ${messaging.message.mid}: ${error}`)
              }
            }
          }
        }
      }

      await this.updateSyncStatus('instagram', 'success', messagesCount)

      return {
        processed: true,
        messages_count: messagesCount,
        errors
      }

    } catch (error) {
      console.error('❌ Instagram webhook processing failed:', error)
      await this.updateSyncStatus('instagram', 'failed', 0, error.toString())
      
      return {
        processed: false,
        messages_count: messagesCount,
        errors: [error.toString()]
      }
    }
  }

  private async processInstagramMessage(messaging: any): Promise<void> {
    console.log('📱 Processing Instagram message:', messaging.message.mid)

    const isFromClient = !await this.isBusinessInstagramId(messaging.sender.id)

    // Record in universal system
    await businessIntelligenceService.recordInstagramMessage({
      messageId: messaging.message.mid,
      from: messaging.sender.id,
      to: messaging.recipient.id,
      text: messaging.message.text || '',
      timestamp: new Date(messaging.timestamp).toISOString(),
      isFromClient
    })

    // Process with enhanced AI if from client
    if (isFromClient) {
      await enhancedAIService.processIncomingMessage('instagram', {
        from: messaging.sender.id,
        to: messaging.recipient.id,
        content: messaging.message.text || '',
        timestamp: new Date(messaging.timestamp).toISOString(),
        messageId: messaging.message.mid
      })
    }
  }

  // ============================
  // EMAIL INTEGRATION
  // ============================

  async syncEmails(emailProvider: 'gmail' | 'outlook', accessToken: string): Promise<{
    synced: boolean
    emails_count: number
    errors: string[]
  }> {
    console.log(`📧 Syncing emails from ${emailProvider}`)
    
    const errors: string[] = []
    let emailsCount = 0

    try {
      const emails = await this.fetchEmailsFromProvider(emailProvider, accessToken)
      
      for (const email of emails) {
        try {
          await this.processEmail(email)
          emailsCount++
        } catch (error) {
          console.error('❌ Error processing email:', error)
          errors.push(`Email ${email.messageId}: ${error}`)
        }
      }

      await this.updateSyncStatus(emailProvider, 'success', emailsCount)

      return {
        synced: true,
        emails_count: emailsCount,
        errors
      }

    } catch (error) {
      console.error(`❌ ${emailProvider} sync failed:`, error)
      await this.updateSyncStatus(emailProvider, 'failed', 0, error.toString())
      
      return {
        synced: false,
        emails_count: emailsCount,
        errors: [error.toString()]
      }
    }
  }

  private async fetchEmailsFromProvider(provider: 'gmail' | 'outlook', accessToken: string): Promise<EmailData[]> {
    // This would integrate with Gmail API or Outlook API
    console.log(`🔗 Fetching emails from ${provider} API`)
    
    // Placeholder - implement actual API calls
    if (provider === 'gmail') {
      return await this.fetchGmailEmails(accessToken)
    } else {
      return await this.fetchOutlookEmails(accessToken)
    }
  }

  private async fetchGmailEmails(accessToken: string): Promise<EmailData[]> {
    // Implement Gmail API integration
    console.log('📬 Fetching from Gmail API')
    
    // Placeholder implementation
    return []
  }

  private async fetchOutlookEmails(accessToken: string): Promise<EmailData[]> {
    // Implement Outlook API integration
    console.log('📬 Fetching from Outlook API')
    
    // Placeholder implementation
    return []
  }

  private async processEmail(email: EmailData): Promise<void> {
    console.log('📧 Processing email:', email.messageId)

    const isFromClient = !await this.isBusinessEmail(email.from)

    // Record in universal system
    await businessIntelligenceService.recordEmailMessage({
      messageId: email.messageId,
      from: email.from,
      to: email.to[0], // Primary recipient
      subject: email.subject,
      body: email.body,
      timestamp: email.timestamp,
      isFromClient
    })

    // Process with enhanced AI if from client
    if (isFromClient) {
      await enhancedAIService.processIncomingMessage('email', {
        from: email.from,
        to: email.to[0],
        content: `Subject: ${email.subject}\n\n${email.body}`,
        timestamp: email.timestamp,
        messageId: email.messageId
      })
    }
  }

  // ============================
  // CALL INTEGRATION
  // ============================

  async processCallRecord(callData: CallData): Promise<{
    processed: boolean
    transcript_generated: boolean
    error?: string
  }> {
    console.log('📞 Processing call record:', callData.callId)

    try {
      // Generate transcript if not provided
      let transcript = callData.transcript
      if (!transcript && callData.recording_url) {
        transcript = await this.generateCallTranscript(callData.recording_url)
      }

      if (transcript) {
        const isFromClient = !await this.isBusinessNumber(callData.from)

        // Record in universal system
        await businessIntelligenceService.recordCallTranscript({
          callId: callData.callId,
          from: callData.from,
          to: callData.to,
          transcript: transcript,
          duration: callData.duration,
          timestamp: callData.timestamp,
          isFromClient
        })

        // Process with enhanced AI if from client
        if (isFromClient) {
          await enhancedAIService.processIncomingMessage('call', {
            from: callData.from,
            to: callData.to,
            content: transcript,
            timestamp: callData.timestamp,
            messageId: callData.callId
          })
        }

        await this.updateSyncStatus('calls', 'success', 1)

        return {
          processed: true,
          transcript_generated: !callData.transcript // True if we generated it
        }
      } else {
        throw new Error('Could not generate transcript')
      }

    } catch (error) {
      console.error('❌ Call processing failed:', error)
      await this.updateSyncStatus('calls', 'failed', 0, error.toString())
      
      return {
        processed: false,
        transcript_generated: false,
        error: error.toString()
      }
    }
  }

  private async generateCallTranscript(recordingUrl: string): Promise<string> {
    console.log('🎵 Generating call transcript from recording')
    
    // This would integrate with speech-to-text service
    // Placeholder implementation
    try {
      // Could use services like:
      // - OpenAI Whisper API
      // - Google Speech-to-Text
      // - Azure Speech Services
      // - AWS Transcribe
      
      // For now, return placeholder
      return 'Call transcript generation in progress. Will be updated when processing completes.'
    } catch (error) {
      console.error('❌ Transcript generation failed:', error)
      throw error
    }
  }

  // ============================
  // FILE & DOCUMENT SYNC
  // ============================

  async syncDocuments(source: 'google_drive' | 'dropbox' | 'local_upload', documents: any[]): Promise<{
    synced: boolean
    documents_count: number
    errors: string[]
  }> {
    console.log(`📁 Syncing documents from ${source}`)
    
    const errors: string[] = []
    let documentsCount = 0

    try {
      for (const doc of documents) {
        try {
          await this.processDocument(doc, source)
          documentsCount++
        } catch (error) {
          console.error('❌ Error processing document:', error)
          errors.push(`Document ${doc.id}: ${error}`)
        }
      }

      await this.updateSyncStatus(`documents_${source}`, 'success', documentsCount)

      return {
        synced: true,
        documents_count: documentsCount,
        errors
      }

    } catch (error) {
      console.error(`❌ Document sync from ${source} failed:`, error)
      await this.updateSyncStatus(`documents_${source}`, 'failed', 0, error.toString())
      
      return {
        synced: false,
        documents_count: documentsCount,
        errors: [error.toString()]
      }
    }
  }

  private async processDocument(doc: any, source: string): Promise<void> {
    console.log('📄 Processing document:', doc.name)

    // Extract text content from document (OCR, etc.)
    const extractedText = await this.extractDocumentText(doc)
    
    // Add to knowledge base
    await businessIntelligenceService.addToKnowledgeBase({
      content_type: 'document',
      source_type: source,
      source_id: doc.id,
      title: doc.name,
      content: extractedText,
      summary: extractedText.substring(0, 200) + '...',
      business_area: 'documents',
      relevance_tags: await this.extractDocumentTags(doc.name, extractedText),
      importance_score: 0.6,
      visibility: 'internal'
    })
  }

  private async extractDocumentText(doc: any): Promise<string> {
    // Implement document text extraction
    // Could use OCR services, PDF parsers, etc.
    console.log('🔍 Extracting text from document')
    
    // Placeholder implementation
    return `Document content extracted from ${doc.name}. Full text extraction in progress.`
  }

  private async extractDocumentTags(name: string, content: string): Promise<string[]> {
    const tags: string[] = []
    
    // Extract tags based on filename and content
    if (name.toLowerCase().includes('contract')) tags.push('contract')
    if (name.toLowerCase().includes('quotation') || name.toLowerCase().includes('quote')) tags.push('quotation')
    if (name.toLowerCase().includes('invoice')) tags.push('invoice')
    if (name.toLowerCase().includes('agreement')) tags.push('agreement')
    
    // Add more intelligent tag extraction based on content
    const contentLower = content.toLowerCase()
    if (contentLower.includes('wedding')) tags.push('wedding')
    if (contentLower.includes('photography')) tags.push('photography')
    if (contentLower.includes('videography')) tags.push('videography')
    
    return tags
  }

  // ============================
  // SYNC STATUS MANAGEMENT
  // ============================

  private async updateSyncStatus(
    platform: string,
    status: 'success' | 'failed',
    itemsCount: number,
    error?: string
  ): Promise<void> {
    console.log(`📊 Updating sync status for ${platform}: ${status}`)

    const now = new Date().toISOString()
    const updateData: any = {
      last_sync_at: now,
      updated_at: now
    }

    if (status === 'success') {
      updateData.last_successful_sync_at = now
      updateData.total_items_synced = itemsCount
      updateData.items_synced_today = itemsCount
      updateData.last_sync_error = null
    } else {
      updateData.last_sync_error = error
    }

    const { data: existing } = await query('SELECT id FROM data_sync_status WHERE platform = $1', [platform])

    if (existing) {
      await query('UPDATE data_sync_status SET last_sync_at = $1, last_successful_sync_at = $2, total_items_synced = $3, items_synced_today = $4, last_sync_error = $5, updated_at = $6 WHERE platform = $7', [
        updateData.last_sync_at,
        updateData.last_successful_sync_at,
        updateData.total_items_synced,
        updateData.items_synced_today,
        updateData.last_sync_error,
        updateData.updated_at,
        platform
      ])
    } else {
      await query('INSERT INTO data_sync_status (platform, account_id, last_sync_at, last_successful_sync_at, total_items_synced, items_synced_today, last_sync_error, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
        platform,
        'default',
        updateData.last_sync_at,
        updateData.last_successful_sync_at,
        updateData.total_items_synced,
        updateData.items_synced_today,
        updateData.last_sync_error,
        updateData.updated_at
      ])
    }
  }

  async getSyncStatus(): Promise<Record<string, any>> {
    const { data, error } = await query('SELECT * FROM data_sync_status')

    if (error) {
      console.error('❌ Error fetching sync status:', error)
      return {}
    }

    const status: Record<string, any> = {}
    for (const item of data || []) {
      status[item.platform] = {
        last_sync: item.last_sync_at,
        last_successful_sync: item.last_successful_sync_at,
        total_synced: item.total_items_synced,
        today_synced: item.items_synced_today,
        last_error: item.last_sync_error,
        sync_enabled: item.sync_enabled
      }
    }

    return status
  }

  // ============================
  // HELPER METHODS
  // ============================

  private async isBusinessNumber(phoneNumber: string, businessPhoneId?: string): Promise<boolean> {
    // Check if the phone number belongs to business
    if (businessPhoneId && phoneNumber === businessPhoneId) return true
    
    // Check against known employee phone numbers
    const employees = await businessIntelligenceService.getAllEntities('employee')
    return employees.some(emp => emp.primary_phone === phoneNumber || emp.whatsapp_number === phoneNumber)
  }

  private async isBusinessInstagramId(instagramId: string): Promise<boolean> {
    // Check against known business Instagram accounts
    const employees = await businessIntelligenceService.getAllEntities('employee')
    return employees.some(emp => emp.instagram_handle === instagramId)
  }

  private async isBusinessEmail(email: string): Promise<boolean> {
    // Check against known business email addresses
    const employees = await businessIntelligenceService.getAllEntities('employee')
    return employees.some(emp => emp.email === email)
  }

  // ============================
  // REAL-TIME SYNC MANAGEMENT
  // ============================

  async startContinuousSync(): Promise<void> {
    console.log('🔄 Starting continuous sync for all platforms')

    // Set up intervals for different platforms
    setInterval(() => this.syncPlatform('whatsapp'), 5 * 60 * 1000) // Every 5 minutes
    setInterval(() => this.syncPlatform('instagram'), 10 * 60 * 1000) // Every 10 minutes
    setInterval(() => this.syncPlatform('gmail'), 15 * 60 * 1000) // Every 15 minutes
    setInterval(() => this.syncPlatform('outlook'), 15 * 60 * 1000) // Every 15 minutes
  }

  private async syncPlatform(platform: string): Promise<void> {
    console.log(`🔄 Running scheduled sync for ${platform}`)

    try {
      switch (platform) {
        case 'whatsapp':
          // WhatsApp uses webhooks primarily, but could check for missed messages
          break
        case 'instagram':
          // Instagram uses webhooks primarily, but could check for missed messages
          break
        case 'gmail':
          // Sync recent Gmail messages
          break
        case 'outlook':
          // Sync recent Outlook messages
          break
      }
    } catch (error) {
      console.error(`❌ Scheduled sync failed for ${platform}:`, error)
    }
  }

  async getSystemHealth(): Promise<{
    overall_status: 'healthy' | 'degraded' | 'offline'
    platform_status: Record<string, 'connected' | 'error' | 'offline'>
    last_sync_times: Record<string, string>
    error_count: number
  }> {
    console.log('🏥 Checking communication sync system health')

    const syncStatus = await this.getSyncStatus()
    const platformStatus: Record<string, 'connected' | 'error' | 'offline'> = {}
    const lastSyncTimes: Record<string, string> = {}
    let errorCount = 0

    for (const [platform, status] of Object.entries(syncStatus)) {
      if (status.last_error) {
        platformStatus[platform] = 'error'
        errorCount++
      } else if (status.last_successful_sync) {
        const timeSinceSync = Date.now() - new Date(status.last_successful_sync).getTime()
        platformStatus[platform] = timeSinceSync < 30 * 60 * 1000 ? 'connected' : 'offline' // 30 minutes
      } else {
        platformStatus[platform] = 'offline'
      }

      lastSyncTimes[platform] = status.last_sync || 'Never'
    }

    const overallStatus = errorCount === 0 ? 'healthy' : errorCount < 2 ? 'degraded' : 'offline'

    return {
      overall_status: overallStatus,
      platform_status: platformStatus,
      last_sync_times: lastSyncTimes,
      error_count: errorCount
    }
  }
}

// Export singleton instance
export const communicationSyncService = new CommunicationSyncService() 