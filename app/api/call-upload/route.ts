import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// PostgreSQL connection pool
// Using centralized PostgreSQL client;

// Debug logging
console.log('Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Call upload and processing - PostgreSQL Migration
export async function POST(request: NextRequest) {
  let client
  try {
    console.log('📤 Processing call upload with PostgreSQL...');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const clientName = formData.get('clientName') as string || 'Unknown Client';
    const taskId = formData.get('taskId') as string || '';
    const notes = formData.get('notes') as string || '';
    
    if (!audioFile) {
      return NextResponse.json({ 
        error: 'No audio file provided',
        
      }, { status: 400 });
    }

    // Generate unique call ID (proper UUID format)
    const callId = uuidv4();
    console.log('Generated callId:', callId);
    
    // Save uploaded file
    const uploadsDir = path.join(process.cwd(), 'uploads', 'call-recordings');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const fileExtension = audioFile.name.split('.').pop() || 'mp3';
    const fileName = `${uuidv4()}_${Date.now()}_${audioFile.name}`;
    const audioFilePath = path.join(uploadsDir, fileName);
    
    const arrayBuffer = await audioFile.arrayBuffer();
    await fs.writeFile(audioFilePath, Buffer.from(arrayBuffer));
    
    console.log(`✅ File saved: ${fileName} (${audioFile.size} bytes)`);

    // Create proper accessible URL for recording_url
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const accessibleRecordingUrl = `${baseUrl}/api/call-recordings/file/${fileName}`;
    
    console.log(`🎵 Recording URL: ${accessibleRecordingUrl}`);

    // Insert initial call record in PostgreSQL
    client = await pool.connect();
    
    const insertQuery = `
      INSERT INTO call_transcriptions (
        id, call_id, client_name, sales_agent, phone_number, transcript, 
        duration, recording_url, confidence_score, created_at, status, 
        notes, task_id, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const callRecord = await client.query(insertQuery, [
      callId,
      callId,
      clientName,
      'Photography AI Assistant',
      '+91-UNKNOWN',
      'Processing...',
      0,
      accessibleRecordingUrl,
      0.0,
      new Date().toISOString(),
      'processing',
      notes,
      taskId || null,
      new Date().toISOString()
    ]);

    console.log('✅ Call record saved to PostgreSQL:', callRecord.rows[0].id);

    // Record in communications table for business intelligence
    const communicationQuery = `
      INSERT INTO communications (
        channel_type, message_id, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type, content_text,
        content_metadata, business_context, ai_processed, ai_priority_score,
        sent_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING id
    `;
    
    await client.query(communicationQuery, [
      'call',
      callId,
      'client',
      '+91-UNKNOWN',
      clientName,
      'employee',
      'Photography AI Assistant',
      'Photography AI Assistant',
      'audio',
      `Call upload: ${audioFile.name}`,
      JSON.stringify({
        file_name: audioFile.name,
        file_size: audioFile.size,
        recording_url: accessibleRecordingUrl,
        task_id: taskId
      }),
      'call_upload',
      false,
      0.8,
      new Date().toISOString()
    ]);

    // Trigger background processing (don't wait for it)
    processCallInBackground(callId, audioFilePath, accessibleRecordingUrl, clientName).catch(error => {
      console.error('Background processing error:', error);
    });

    // Return immediate success
    return NextResponse.json({
      success: true,
      callId,
      message: `Call uploaded successfully! Processing will continue in the background.`,
      data: {
        client_name: clientName,
        file_name: audioFile.name,
        file_size: audioFile.size,
        status: 'uploaded',
        recording_url: accessibleRecordingUrl,
        task_id: taskId
      },
      
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Background processing function (runs async) - PostgreSQL Migration
async function processCallInBackground(callId: string, audioFilePath: string, recordingUrl: string, clientName: string) {
  let client
  try {
    console.log(`🔄 Starting background processing for call ${callId}`);
    console.log(`🎵 Audio file path: ${audioFilePath}`);
    console.log(`🌐 Recording URL: ${recordingUrl}`);
    
    client = await pool.connect();
    
    // Update status to processing
    await client.query(
      'UPDATE call_transcriptions SET status = $1, updated_at = NOW() WHERE id = $2',
      ['transcribing', callId]
    );

    // Import the services dynamically to avoid blocking the main response
    const { LocalCallAnalyticsTranslationService } = await import('@/services/local-call-analytics-service-translation');
    const { SpeakerDiarizationService } = await import('@/services/speaker-diarization-service');
    const { AIConversationMemoryService } = await import('@/services/ai-conversation-memory-service');
    const analyticsService = new LocalCallAnalyticsTranslationService();

    console.log(`🤖 Processing call recording with Whisper...`);

    // Process the call with Whisper + AI (use the local file path for processing)
    const result = await analyticsService.processCallRecording(
      audioFilePath,
      clientName,
      0,
      'large-v3'
    );

    const translationResult = result.translationResult;
    const analytics = result.analytics;
    const rawTranscript = translationResult.english_translation || '';

    console.log(`📝 Transcript generated: ${rawTranscript.substring(0, 100)}...`);

    // Add speaker identification to the raw transcript
    const labeledTranscript = SpeakerDiarizationService.addSpeakerLabels(rawTranscript, clientName);
    
    // Extract business information from the labeled transcript
    const businessInfo = SpeakerDiarizationService.extractBusinessInfo(labeledTranscript);
    
    // Get speaker statistics
    const speakerStats = SpeakerDiarizationService.analyzeSpeakerStats(labeledTranscript);

    console.log(`📊 Business Info Extracted:`, {
      prices: businessInfo.pricesMentioned,
      venues: businessInfo.venuesMentioned,
      times: businessInfo.timesMentioned,
      talkRatio: speakerStats.talkTimeRatio.toFixed(2)
    });

    // AI LEARNING: Process conversation for autonomous AI training
    const businessOutcome: 'positive' | 'negative' | 'neutral' = 
      analytics.overall_sentiment > 0.3 ? 'positive' : 
      analytics.overall_sentiment < -0.3 ? 'negative' : 'neutral';

    const aiLearning = await AIConversationMemoryService.processConversationForLearning(
      callId,
      labeledTranscript,
      businessOutcome,
      businessInfo.pricesMentioned.length > 0 ? 25000 : undefined // Estimated deal value
    );

    console.log(`🤖 AI LEARNED FROM CONVERSATION:`, {
      client_patterns: aiLearning.clientPatterns.length,
      agent_patterns: aiLearning.agentPatterns.length,
      insights: aiLearning.learningInsights,
      business_outcome: businessOutcome
    });

    // Update call record with results (use labeled transcript with speaker identification)
    const updateQuery = `
      UPDATE call_transcriptions 
      SET transcript = $1,
          duration = $2,
          confidence_score = $3,
          detected_language = $4,
          status = $5,
          call_direction = $6,
          call_status = $7,
          language = $8,
          updated_at = NOW()
      WHERE id = $9
    `;
    
    await client.query(updateQuery, [
      labeledTranscript, // Real transcript with [AGENT] and [CLIENT] labels
      translationResult.duration || 0,
      translationResult.language_confidence || 0.0,
      translationResult.detected_language || 'unknown',
      'completed',
      'inbound',
      'completed',
      translationResult.detected_language || 'en',
      callId
    ]);

    // Store AI analytics in call_analytics table if it exists
    try {
      const analyticsQuery = `
        INSERT INTO call_analytics (
          call_id, sentiment_score, talk_time_ratio, business_outcome,
          prices_mentioned, venues_mentioned, ai_insights, 
          speaker_stats, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (call_id) DO UPDATE SET
          sentiment_score = EXCLUDED.sentiment_score,
          talk_time_ratio = EXCLUDED.talk_time_ratio,
          business_outcome = EXCLUDED.business_outcome,
          updated_at = NOW()
      `;
      
      await client.query(analyticsQuery, [
        callId,
        analytics.overall_sentiment,
        speakerStats.talkTimeRatio,
        businessOutcome,
        JSON.stringify(businessInfo.pricesMentioned),
        JSON.stringify(businessInfo.venuesMentioned),
        JSON.stringify(aiLearning.learningInsights),
        JSON.stringify(speakerStats)
      ]);
    } catch (analyticsError) {
      console.log('Analytics table not available, skipping analytics storage');
    }

    // Update communication record with AI processing results
    await client.query(`
      UPDATE communications 
      SET ai_processed = true,
          ai_intent = $1,
          ai_sentiment = $2,
          ai_keywords = $3,
          ai_entities = $4,
          business_context = $5,
          updated_at = NOW()
      WHERE message_id = $6
    `, [
      'call_transcription',
      businessOutcome,
      businessInfo.pricesMentioned.concat(businessInfo.venuesMentioned),
      JSON.stringify({
        client_name: clientName,
        prices: businessInfo.pricesMentioned,
        venues: businessInfo.venuesMentioned,
        times: businessInfo.timesMentioned
      }),
      `call_completed_${businessOutcome}`,
      callId
    ]);

    console.log(`✅ Call transcription and AI processing completed for ${callId}`);

  } catch (error) {
    console.error(`❌ Background processing failed for call ${callId}:`, error);
    
    if (client) {
      try {
        await client.query(`
          UPDATE call_transcriptions 
          SET status = $1, 
              transcript = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [
          'error',
          `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          callId
        ]);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }
  } finally {
    if (client) {
      client.release();
    }
  }
} 