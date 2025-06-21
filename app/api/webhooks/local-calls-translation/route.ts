import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/postgresql-client-unified';
import { LocalCallAnalyticsTranslationService } from '@/services/local-call-analytics-service-translation';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const analyticsService = new LocalCallAnalyticsTranslationService();

export async function POST(request: NextRequest) {
  try {
    console.log('🌍 Processing multilingual call with translation to English...');
    
    const contentType = request.headers.get('content-type') || '';
    let clientName = '';
    let audioFilePath = '';
    let callDuration = 0;
    let modelSize = 'large-v3';
    let englishTranscript = '';
    let isFileUpload = false;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      clientName = formData.get('clientName') as string || 'Unknown Client';
      modelSize = formData.get('modelSize') as string || 'large-v3';
      
      if (!audioFile) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
      }

      // Save uploaded file
      const uploadsDir = path.join(process.cwd(), 'uploads', 'call-recordings');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const fileExtension = audioFile.name.split('.').pop() || 'mp3';
      const fileName = `${uuidv4()}_${Date.now()}_${audioFile.name}`;
      audioFilePath = path.join(uploadsDir, fileName);
      
      const arrayBuffer = await audioFile.arrayBuffer();
      await fs.writeFile(audioFilePath, Buffer.from(arrayBuffer));
      
      callDuration = 0; // Will be detected during translation
      isFileUpload = true;
      
      console.log(`📁 File uploaded: ${fileName} (${audioFile.size} bytes)`);
      
    } else {
      // Handle JSON data (pre-translated or manual input)
      const body = await request.json();
      clientName = body.clientName || 'Unknown Client';
      englishTranscript = body.englishTranscript || '';
      callDuration = body.callDuration || 0;
      
      if (!englishTranscript) {
        return NextResponse.json({ error: 'English transcript is required for JSON input' }, { status: 400 });
      }
      
      console.log(`📝 Processing pre-translated transcript for ${clientName}`);
    }

    // Generate unique call ID
    const callId = uuidv4();

    // Step 1: Insert initial call record
    console.log('🔄 Attempting to create call record with data:', {
      id: callId,
      call_id: callId,
      client_name: clientName,
      sales_agent: 'Photography AI Assistant',
      phone_number: '+91-UNKNOWN',
      transcript: englishTranscript || 'Processing...',
      duration: callDuration,
      recording_url: audioFilePath || null,
      confidence_score: 0.0
    });

    const { data: callRecord, error: insertError } = await supabase
      .from('call_transcriptions')
      .insert({
        id: callId,
        call_id: callId,
        client_name: clientName,
        sales_agent: 'Photography AI Assistant',
        phone_number: '+91-UNKNOWN',
        transcript: englishTranscript || 'Processing...',
        duration: callDuration,
        recording_url: audioFilePath || null,
        confidence_score: 0.0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error details:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return NextResponse.json({ 
        error: 'Failed to create call record', 
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 });
    }

    let translationResult = null;
    let analytics = null;

    try {
      if (isFileUpload) {
        // Step 2: Process audio file with translation
        const result = await analyticsService.processCallRecording(
          audioFilePath,
          clientName,
          callDuration,
          modelSize
        );
        
        translationResult = result.translationResult;
        analytics = result.analytics;
        englishTranscript = translationResult.english_translation || '';
        
        // Update call record with translation results
        const { error: updateError } = await supabase
          .from('call_transcriptions')
          .update({
            transcript: englishTranscript,
            duration: translationResult.duration || callDuration,
            confidence_score: translationResult.language_confidence || 0.0,
            detected_language: translationResult.detected_language || 'unknown'
          })
          .eq('id', callId);

        if (updateError) {
          console.error('Failed to update transcript:', updateError);
        }
        
      } else {
        // Step 2: Analyze pre-translated transcript
        analytics = await analyticsService.analyzeCallWithOllama(englishTranscript);
      }

      // Step 3: Store analytics
      const { error: analyticsError } = await supabase
        .from('call_analytics')
        .insert({
          call_id: callId,
          overall_sentiment: analytics.overall_sentiment,
          client_sentiment: analytics.client_sentiment,
          agent_sentiment: analytics.agent_sentiment,
          agent_professionalism: analytics.agent_professionalism,
          agent_responsiveness: analytics.agent_responsiveness,
          agent_knowledge: analytics.agent_knowledge,
          agent_closing_effectiveness: analytics.agent_closing_effectiveness,
          client_engagement_level: analytics.client_engagement_level,
          client_interest_level: analytics.client_interest_level,
          client_buying_signals: analytics.client_buying_signals,
          client_objections: analytics.client_objections,
          forbidden_words_count: analytics.forbidden_words_count,
          forbidden_words_detected: analytics.forbidden_words_detected,
          compliance_risk_level: analytics.compliance_risk_level,
          compliance_issues: analytics.compliance_issues,
          quote_discussed: analytics.quote_discussed,
          budget_mentioned: analytics.budget_mentioned,
          timeline_discussed: analytics.timeline_discussed,
          next_steps_defined: analytics.next_steps_defined,
          talk_time_ratio: analytics.talk_time_ratio,
          interruptions_count: analytics.interruptions_count,
          call_quality_score: analytics.call_quality_score,
          follow_up_required: analytics.follow_up_required,
          follow_up_priority: analytics.follow_up_priority,
          suggested_actions: analytics.suggested_actions,
          created_at: new Date().toISOString()
        });

      if (analyticsError) {
        console.error('Analytics insert error:', analyticsError);
      }

      // Step 4: Generate insights
      const insights = {
        sentiment_summary: `Overall sentiment: ${analytics.overall_sentiment > 0 ? 'Positive' : analytics.overall_sentiment < 0 ? 'Negative' : 'Neutral'} (${analytics.overall_sentiment.toFixed(2)})`,
        agent_performance: `Agent scored ${analytics.agent_professionalism}/10 for professionalism`,
        compliance_status: analytics.compliance_risk_level === 'high' ? 
          `⚠️ HIGH RISK: ${analytics.forbidden_words_count} forbidden words detected` :
          analytics.compliance_risk_level === 'medium' ? 
          `⚠️ MEDIUM RISK: ${analytics.forbidden_words_count} forbidden words detected` :
          '✅ Low compliance risk',
        business_outcome: analytics.quote_discussed ? 'Quote was discussed' : 'No quote discussed',
        follow_up_needed: analytics.follow_up_required ? `Follow-up required (${analytics.follow_up_priority} priority)` : 'No follow-up needed'
      };

      const { error: insightsError } = await supabase
        .from('call_insights')
        .insert({
          call_id: callId,
          key_insights: [
            insights.sentiment_summary,
            insights.agent_performance,
            insights.compliance_status,
            insights.business_outcome,
            insights.follow_up_needed
          ],
          action_items: analytics.suggested_actions,
          risk_factors: analytics.compliance_issues,
          created_at: new Date().toISOString()
        });

      if (insightsError) {
        console.error('Insights insert error:', insightsError);
      }

      console.log(`✅ Multilingual call processing completed for ${clientName}`);

      return NextResponse.json({
        success: true,
        callId,
        message: 'Multilingual call processed successfully with English translation',
        data: {
          client_name: clientName,
          detected_language: translationResult?.detected_language || 'manual',
          language_confidence: translationResult?.language_confidence || 1.0,
          english_transcript: englishTranscript,
          call_duration: translationResult?.duration || callDuration,
          analytics: analytics,
          insights: insights,
          processing_info: {
            translation_model: translationResult?.model_used || 'manual',
            file_uploaded: isFileUpload,
            audio_file_path: audioFilePath || null
          }
        }
      });

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Update call record with error
      await supabase
        .from('call_transcriptions')
        .update({
          transcript: `Error: ${processingError instanceof Error ? processingError.message : 'Processing failed'}`
        })
        .eq('id', callId);

      return NextResponse.json({
        success: false,
        callId,
        error: 'Processing failed',
        details: processingError instanceof Error ? processingError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 