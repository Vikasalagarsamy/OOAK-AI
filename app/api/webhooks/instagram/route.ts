import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

// Instagram webhook verification - PostgreSQL Migration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('🔍 Instagram webhook verification attempt:', { mode, token })

  // Verify the webhook with Instagram
  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    console.log('✅ Instagram webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  console.log('❌ Instagram webhook verification failed')
  return NextResponse.json({ 
    error: 'Forbidden',
    
  }, { status: 403 })
}

// Instagram message/interaction processing - PostgreSQL Migration
export async function POST(request: NextRequest) {
  let client
  try {
    console.log('📸 Instagram webhook received')
    
    const body = await request.json()
    console.log('📥 Instagram webhook data:', JSON.stringify(body, null, 2))

    client = await pool.connect()
    await client.query('BEGIN')

    let processedCount = 0
    const errors: string[] = []

    // Process each entry in the webhook data
    for (const entry of body.entry || []) {
      // Handle Instagram messages (DMs)
      if (entry.messaging) {
        for (const messagingEvent of entry.messaging) {
          try {
            await processInstagramMessage(messagingEvent, client)
            processedCount++
          } catch (error) {
            console.error('❌ Error processing Instagram message:', error)
            errors.push(`Message error: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // Handle Instagram story mentions, comments, and mentions
      if (entry.changes) {
        for (const change of entry.changes) {
          try {
            if (change.field === 'story_insights') {
              await processStoryMention(change.value, client)
              processedCount++
            } else if (change.field === 'comments') {
              await processComment(change.value, client)
              processedCount++
            } else if (change.field === 'mention') {
              await processMention(change.value, client)
              processedCount++
            }
          } catch (error) {
            console.error(`❌ Error processing Instagram ${change.field}:`, error)
            errors.push(`${change.field} error: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }
    }

    await client.query('COMMIT')

    console.log(`✅ Instagram webhook processed: ${processedCount} items`)

    return NextResponse.json({ 
      status: 'success',
      processed_count: processedCount,
      errors: errors,
      
    }, { status: 200 })

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK')
    }
    console.error('❌ Instagram webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      
    }, { status: 500 })
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Process Instagram Direct Messages - PostgreSQL Migration
async function processInstagramMessage(messagingEvent: any, client: any) {
  console.log('💬 Processing Instagram DM:', messagingEvent)

  // Extract sender and recipient
  const senderId = messagingEvent.sender?.id
  const recipientId = messagingEvent.recipient?.id
  const timestamp = new Date(messagingEvent.timestamp).toISOString()

  // Determine if message is from client (not our business account)
  const isFromClient = senderId !== process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

  let contentText = ''
  let contentType = 'text'
  let contentMetadata = {}

  // Extract message content
  if (messagingEvent.message) {
    const message = messagingEvent.message

    if (message.text) {
      contentText = message.text
      contentType = 'text'
    } else if (message.attachments) {
      const attachment = message.attachments[0]
      contentType = attachment.type || 'document'
      contentText = `${attachment.type} attachment received`
      contentMetadata = {
        attachment_type: attachment.type,
        payload: attachment.payload
      }
    }

    const messageId = message.mid || `ig_${Date.now()}`

    // Record Instagram message in PostgreSQL
    const instagramQuery = `
      INSERT INTO instagram_messages (
        message_id, from_user_id, to_user_id, content, message_type,
        attachment_metadata, is_from_client, timestamp, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `
    
    const instagramResult = await client.query(instagramQuery, [
      messageId,
      senderId,
      recipientId,
      contentText,
      contentType,
      JSON.stringify(contentMetadata),
      isFromClient,
      timestamp
    ])

    // Record in universal communications table
    const communicationQuery = `
      INSERT INTO communications (
        channel_type, message_id, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type, content_text,
        content_metadata, business_context, ai_processed, ai_priority_score,
        sent_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING id
    `
    
    await client.query(communicationQuery, [
      'instagram',
      messageId,
      isFromClient ? 'client' : 'employee',
      senderId,
      isFromClient ? `Instagram User ${senderId}` : 'Business Account',
      isFromClient ? 'employee' : 'client',
      recipientId,
      isFromClient ? 'Business Account' : `Instagram User ${recipientId}`,
      contentType,
      contentText,
      JSON.stringify(contentMetadata),
      isFromClient ? 'instagram_dm' : 'outbound_message',
      false,
      isFromClient ? 0.6 : 0.3,
      timestamp
    ])

    // If this is from a client, try to match with existing leads
    if (isFromClient) {
      await tryMatchInstagramLead(senderId, contentText, client)
    }

    console.log(`✅ Instagram message recorded: ${messageId}`)
  }

  // Handle message reactions
  if (messagingEvent.reaction) {
    console.log('👍 Instagram reaction:', messagingEvent.reaction)
    
    const reactionQuery = `
      INSERT INTO instagram_interactions (
        interaction_type, user_id, target_message_id, content,
        metadata, timestamp, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `
    
    await client.query(reactionQuery, [
      'reaction',
      senderId,
      messagingEvent.reaction.mid,
      messagingEvent.reaction.emoji || '👍',
      JSON.stringify({
        reaction_type: messagingEvent.reaction.action,
        emoji: messagingEvent.reaction.emoji
      }),
      timestamp
    ])
  }
}

// Process Instagram Story Mentions - PostgreSQL Migration
async function processStoryMention(storyData: any, client: any) {
  console.log('📖 Processing Instagram story mention:', storyData)

  const messageId = storyData.id || `story_${Date.now()}`

  // Record story mention in specialized table
  const storyQuery = `
    INSERT INTO instagram_story_mentions (
      mention_id, from_user_id, from_username, story_text, media_id,
      story_url, metadata, timestamp, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id
  `
  
  await client.query(storyQuery, [
    messageId,
    storyData.from?.id,
    storyData.from?.username,
    storyData.text || 'Tagged in story',
    storyData.media?.id,
    storyData.media?.permalink,
    JSON.stringify({
      story_type: 'mention',
      media_info: storyData.media
    }),
    new Date().toISOString()
  ])

  // Record in universal communications
  const communicationQuery = `
    INSERT INTO communications (
      channel_type, message_id, sender_type, sender_id, sender_name,
      recipient_type, recipient_id, recipient_name, content_type, content_text,
      content_metadata, business_context, ai_processed, ai_priority_score,
      sent_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
  `
  
  await client.query(communicationQuery, [
    'instagram',
    messageId,
    'client',
    storyData.from?.id,
    storyData.from?.username,
    'employee',
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
    'Business Account',
    'text',
    `Story mention: ${storyData.text || 'Tagged in story'}`,
    JSON.stringify({
      story_type: 'mention',
      media_id: storyData.media?.id,
      story_url: storyData.media?.permalink
    }),
    'social_mention',
    false,
    0.7,
    new Date().toISOString()
  ])

  console.log(`✅ Instagram story mention recorded: ${messageId}`)
}

// Process Instagram Comments - PostgreSQL Migration
async function processComment(commentData: any, client: any) {
  console.log('💭 Processing Instagram comment:', commentData)

  const isFromClient = commentData.from?.id !== process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  const messageId = commentData.id || `comment_${Date.now()}`

  // Record comment in specialized table
  const commentQuery = `
    INSERT INTO instagram_comments (
      comment_id, post_id, from_user_id, from_username, comment_text,
      parent_comment_id, is_from_client, metadata, created_time, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING id
  `
  
  await client.query(commentQuery, [
    messageId,
    commentData.post_id,
    commentData.from?.id,
    commentData.from?.username,
    commentData.text || commentData.message,
    commentData.parent_id,
    isFromClient,
    JSON.stringify({
      comment_type: 'post_comment',
      post_info: {
        post_id: commentData.post_id,
        parent_id: commentData.parent_id
      }
    }),
    new Date(commentData.created_time || Date.now()).toISOString()
  ])

  // Record in universal communications
  const communicationQuery = `
    INSERT INTO communications (
      channel_type, message_id, sender_type, sender_id, sender_name,
      recipient_type, recipient_id, recipient_name, content_type, content_text,
      content_metadata, business_context, ai_processed, ai_priority_score,
      sent_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
  `
  
  await client.query(communicationQuery, [
    'instagram',
    messageId,
    isFromClient ? 'client' : 'employee',
    commentData.from?.id,
    commentData.from?.username,
    'employee',
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
    'Business Account',
    'text',
    commentData.text || commentData.message,
    JSON.stringify({
      comment_type: 'post_comment',
      post_id: commentData.post_id,
      parent_comment_id: commentData.parent_id
    }),
    'social_engagement',
    false,
    isFromClient ? 0.6 : 0.3,
    new Date(commentData.created_time || Date.now()).toISOString()
  ])

  console.log(`✅ Instagram comment recorded: ${messageId}`)
}

// Process Instagram Mentions - PostgreSQL Migration
async function processMention(mentionData: any, client: any) {
  console.log('🏷️ Processing Instagram mention:', mentionData)

  const messageId = mentionData.id || `mention_${Date.now()}`

  // Record mention in specialized table
  const mentionQuery = `
    INSERT INTO instagram_mentions (
      mention_id, from_user_id, from_username, mention_text, media_id,
      permalink, mention_type, metadata, created_time, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING id
  `
  
  await client.query(mentionQuery, [
    messageId,
    mentionData.from?.id,
    mentionData.from?.username,
    mentionData.text || mentionData.caption || 'Instagram mention',
    mentionData.media_id,
    mentionData.permalink,
    'tag_mention',
    JSON.stringify({
      mention_context: mentionData.text || mentionData.caption,
      media_info: {
        media_id: mentionData.media_id,
        permalink: mentionData.permalink
      }
    }),
    new Date(mentionData.created_time || Date.now()).toISOString()
  ])

  // Record in universal communications
  const communicationQuery = `
    INSERT INTO communications (
      channel_type, message_id, sender_type, sender_id, sender_name,
      recipient_type, recipient_id, recipient_name, content_type, content_text,
      content_metadata, business_context, ai_processed, ai_priority_score,
      sent_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
  `
  
  await client.query(communicationQuery, [
    'instagram',
    messageId,
    'client',
    mentionData.from?.id,
    mentionData.from?.username,
    'employee',
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
    'Business Account',
    'text',
    `Mentioned in: ${mentionData.text || mentionData.caption || 'Instagram mention'}`,
    JSON.stringify({
      mention_type: 'tag_mention',
      media_id: mentionData.media_id,
      permalink: mentionData.permalink
    }),
    'social_mention',
    false,
    0.7,
    new Date(mentionData.created_time || Date.now()).toISOString()
  ])

  console.log(`✅ Instagram mention recorded: ${messageId}`)
}

// Try to match Instagram interactions with existing leads - PostgreSQL Migration
async function tryMatchInstagramLead(instagramUserId: string, messageContent: string, client: any) {
  try {
    // First, check if we have any leads with Instagram handle
    const existingLeadQuery = `
      SELECT id, client_name, status, assigned_to, created_at
      FROM leads
      WHERE instagram_handle = $1 OR instagram_handle LIKE $2
      ORDER BY created_at DESC
      LIMIT 1
    `
    
    const leadResult = await client.query(existingLeadQuery, [
      instagramUserId, 
      `%${instagramUserId}%`
    ])

    if (leadResult.rows.length > 0) {
      const lead = leadResult.rows[0]
      
      // Update the communication with lead context
      await client.query(
        'UPDATE communications SET related_lead_id = $1, business_context = $2 WHERE message_id LIKE $3',
        [lead.id, 'lead_instagram_followup', `%${instagramUserId}%`]
      )
      
      console.log(`🔗 Linked Instagram message to existing lead: ${lead.client_name} (ID: ${lead.id})`)
      return
    }

    // Check if message content suggests business interest
    const businessKeywords = [
      'service', 'quote', 'pricing', 'interested', 'business', 'work',
      'project', 'collaborate', 'partnership', 'hire', 'cost', 'price'
    ]
    
    const hasBusinessIntent = businessKeywords.some(keyword => 
      messageContent.toLowerCase().includes(keyword.toLowerCase())
    )

    if (hasBusinessIntent) {
      // Create a new lead from Instagram interaction
      const newLeadQuery = `
        INSERT INTO leads (
          client_name, instagram_handle, status, source, lead_source_id,
          estimated_value, priority, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id
      `
      
      // Get Instagram lead source ID
      const sourceQuery = 'SELECT id FROM lead_sources WHERE name ILIKE $1 LIMIT 1'
      const sourceResult = await client.query(sourceQuery, ['%instagram%'])
      const leadSourceId = sourceResult.rows[0]?.id || null

      const leadResult = await client.query(newLeadQuery, [
        `Instagram User ${instagramUserId}`,
        instagramUserId,
        'new',
        'Instagram',
        leadSourceId,
        50000, // Default estimated value for Instagram leads
        'medium',
        `Auto-created from Instagram DM: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}"`
      ])

      const newLeadId = leadResult.rows[0].id

      // Update the communication with new lead context
      await client.query(
        'UPDATE communications SET related_lead_id = $1, business_context = $2 WHERE message_id LIKE $3',
        [newLeadId, 'lead_instagram_inquiry', `%${instagramUserId}%`]
      )

      console.log(`🆕 Created new lead from Instagram: ID ${newLeadId}`)
    }

  } catch (error) {
    console.error('❌ Error matching Instagram lead:', error)
    // Don't throw - this is a nice-to-have feature
  }
} 