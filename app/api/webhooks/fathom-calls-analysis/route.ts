import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/postgresql-client-unified';
import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FathomAnalysisRequest {
  clientName: string;
  englishTranscript?: string;
  audioFilePath?: string;
  callDuration?: number;
  useModel?: 'fathom' | 'ollama' | 'hybrid';
}

async function runFathomAnalysis(
  transcript: string, 
  clientName: string, 
  callDuration?: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      'services/fathom-r1-14b-service.py',
      '--transcript', transcript,
      '--client-name', clientName,
      '--call-duration', String(callDuration || 0)
    ], {
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        PATH: process.env.PATH + ':/opt/homebrew/bin',
        PYTHONPATH: process.cwd()
      }
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON output from Python
          const jsonStart = output.indexOf('{');
          const jsonEnd = output.lastIndexOf('}') + 1;
          
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonStr = output.slice(jsonStart, jsonEnd);
            const result = JSON.parse(jsonStr);
            resolve(result);
          } else {
            reject(new Error('No valid JSON found in Python output'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      } else {
        reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error}`));
    });
  });
}

async function runOllamaAnalysis(transcript: string, clientName: string): Promise<any> {
  try {
    const prompt = `
You are an expert call analytics AI for an autonomous photography business. Analyze this client conversation and provide detailed business intelligence.

CLIENT: ${clientName}
TRANSCRIPT: ${transcript}

Provide analysis in this EXACT JSON format:
{
  "overall_sentiment": <number between -1.0 and 1.0>,
  "client_sentiment": <number between -1.0 and 1.0>, 
  "agent_sentiment": <number between -1.0 and 1.0>,
  "agent_professionalism": <number 1-10>,
  "agent_responsiveness": <number 1-10>,
  "agent_knowledge": <number 1-10>,
  "client_engagement_level": <number 1-10>,
  "client_interest_level": <number 1-10>,
  "quote_discussed": <true/false>,
  "budget_mentioned": <true/false>,
  "timeline_discussed": <true/false>,
  "next_steps_defined": <true/false>,
  "follow_up_required": <true/false>,
  "business_priority": "<low/medium/high>",
  "key_insights": [<array of key business insights>],
  "recommended_actions": [<array of specific action items>],
  "estimated_booking_probability": <number 0-100>,
  "service_type": "<wedding/engagement/portrait/commercial/other>",
  "pricing_sensitivity": "<low/medium/high>",
  "decision_timeline": "<immediate/short/medium/long>",
  "potential_revenue": <estimated value in rupees or 0 if unknown>
}

Respond with ONLY the JSON, no other text.`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.response || '';
    
    // Extract JSON from response
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = responseText.slice(jsonStart, jsonEnd);
      return JSON.parse(jsonStr);
    } else {
      throw new Error('No valid JSON found in Ollama response');
    }
  } catch (error) {
    console.error('Ollama analysis error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FathomAnalysisRequest = await request.json();
    const { clientName, englishTranscript, audioFilePath, callDuration, useModel = 'fathom' } = body;

    if (!clientName) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    if (!englishTranscript && !audioFilePath) {
      return NextResponse.json({ 
        error: 'Either englishTranscript or audioFilePath is required' 
      }, { status: 400 });
    }

    // Generate call ID
    const callId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // If audio file provided, we need to transcribe it first (placeholder)
    let transcript = englishTranscript;
    if (audioFilePath && !englishTranscript) {
      // TODO: Add transcription logic here if needed
      return NextResponse.json({ 
        error: 'Audio transcription not implemented yet. Please provide englishTranscript.' 
      }, { status: 400 });
    }

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript available for analysis' }, { status: 400 });
    }

    // Insert initial call record
    const { data: callRecord, error: insertError } = await supabase
      .from('call_transcriptions')
      .insert({
        call_id: callId,
        client_name: clientName,
        english_transcript: transcript,
        duration: callDuration || 0,
        recording_url: audioFilePath || null,
        sales_agent: 'Photography AI Assistant',
        phone_number: '+91-UNKNOWN',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create call record',
        details: insertError.message 
      }, { status: 500 });
    }

    let analysis: any = {};
    let analysisError: string | null = null;

    // Run analysis based on selected model
    if (useModel === 'fathom') {
      try {
        console.log('🧠 Running Fathom-R1-14B analysis...');
        analysis = await runFathomAnalysis(transcript, clientName, callDuration);
        analysis.model_used = 'Fathom-R1-14B';
      } catch (error) {
        console.error('Fathom analysis failed:', error);
        analysisError = error instanceof Error ? error.message : 'Fathom analysis failed';
        
        // Fallback to Ollama
        console.log('🔄 Falling back to Ollama analysis...');
        try {
          analysis = await runOllamaAnalysis(transcript, clientName);
          analysis.model_used = 'Ollama (fallback)';
        } catch (ollamaError) {
          analysisError = `Both models failed. Fathom: ${analysisError}, Ollama: ${ollamaError}`;
        }
      }
    } else if (useModel === 'ollama') {
      try {
        console.log('🦙 Running Ollama analysis...');
        analysis = await runOllamaAnalysis(transcript, clientName);
        analysis.model_used = 'Ollama';
      } catch (error) {
        analysisError = error instanceof Error ? error.message : 'Ollama analysis failed';
      }
    } else if (useModel === 'hybrid') {
      // Run both models and compare
      try {
        console.log('🔄 Running hybrid analysis (both models)...');
        const [fathomResult, ollamaResult] = await Promise.allSettled([
          runFathomAnalysis(transcript, clientName, callDuration),
          runOllamaAnalysis(transcript, clientName)
        ]);

        analysis = {
          fathom_analysis: fathomResult.status === 'fulfilled' ? fathomResult.value : { error: fathomResult.reason },
          ollama_analysis: ollamaResult.status === 'fulfilled' ? ollamaResult.value : { error: ollamaResult.reason },
          model_used: 'Hybrid (Fathom + Ollama)',
          comparison: {
            fathom_success: fathomResult.status === 'fulfilled',
            ollama_success: ollamaResult.status === 'fulfilled'
          }
        };
      } catch (error) {
        analysisError = error instanceof Error ? error.message : 'Hybrid analysis failed';
      }
    }

    if (analysisError && !analysis.model_used) {
      return NextResponse.json({ 
        error: 'Analysis failed',
        details: analysisError,
        call_id: callId 
      }, { status: 500 });
    }

    // Extract key metrics for database (use primary analysis or Fathom if hybrid)
    const primaryAnalysis = useModel === 'hybrid' 
      ? (analysis.fathom_analysis || analysis.ollama_analysis)
      : analysis;

    // Store analytics results
    const { error: analyticsError } = await supabase
      .from('call_analytics')
      .insert({
        call_id: callId,
        overall_sentiment: primaryAnalysis.overall_sentiment || 0,
        client_sentiment: primaryAnalysis.client_sentiment || 0,
        agent_sentiment: primaryAnalysis.agent_sentiment || 0,
        agent_professionalism: primaryAnalysis.agent_professionalism || 5,
        agent_responsiveness: primaryAnalysis.agent_responsiveness || 5,
        agent_knowledge: primaryAnalysis.agent_knowledge || 5,
        client_engagement_level: primaryAnalysis.client_engagement_level || 5,
        client_interest_level: primaryAnalysis.client_interest_level || 5,
        quote_discussed: primaryAnalysis.quote_discussed || false,
        budget_mentioned: primaryAnalysis.budget_mentioned || false,
        timeline_discussed: primaryAnalysis.timeline_discussed || false,
        next_steps_defined: primaryAnalysis.next_steps_defined || false,
        follow_up_required: primaryAnalysis.follow_up_required || false,
        business_priority: primaryAnalysis.business_priority || 'medium',
        key_insights: JSON.stringify(primaryAnalysis.key_insights || []),
        recommended_actions: JSON.stringify(primaryAnalysis.recommended_actions || []),
        estimated_booking_probability: primaryAnalysis.estimated_booking_probability || 0,
        service_type: primaryAnalysis.service_type || 'other',
        pricing_sensitivity: primaryAnalysis.pricing_sensitivity || 'medium',
        decision_timeline: primaryAnalysis.decision_timeline || 'medium',
        potential_revenue: primaryAnalysis.potential_revenue || 0,
        analysis_model: analysis.model_used || 'unknown',
        raw_analysis: JSON.stringify(analysis),
        created_at: new Date().toISOString()
      });

    if (analyticsError) {
      console.error('Analytics insert error:', analyticsError);
      // Don't fail the request, just log the error
    }

    // Store advanced Fathom insights if available
    if (useModel === 'fathom' || (useModel === 'hybrid' && analysis.fathom_analysis)) {
      const fathomData = useModel === 'hybrid' ? analysis.fathom_analysis : analysis;
      
      if (fathomData.mathematical_analysis || fathomData.reasoning_chain) {
        const { error: insightsError } = await supabase
          .from('call_insights')
          .insert({
            call_id: callId,
            mathematical_analysis: JSON.stringify(fathomData.mathematical_analysis || {}),
            reasoning_chain: JSON.stringify(fathomData.reasoning_chain || []),
            client_psychology_profile: JSON.stringify(fathomData.client_psychology_profile || {}),
            risk_assessment: JSON.stringify(fathomData.risk_assessment || {}),
            revenue_optimization: JSON.stringify(fathomData.revenue_optimization || {}),
            autonomous_ai_insights: JSON.stringify(fathomData.autonomous_ai_insights || {}),
            competitive_advantages: JSON.stringify(fathomData.competitive_advantages || []),
            strategic_recommendations: JSON.stringify(fathomData.strategic_recommendations || []),
            confidence_score: fathomData.processing_metadata?.confidence_score || 0,
            reasoning_depth: fathomData.processing_metadata?.reasoning_depth || 'unknown',
            created_at: new Date().toISOString()
          });

        if (insightsError) {
          console.error('Insights insert error:', insightsError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      call_id: callId,
      analysis: analysis,
      model_used: analysis.model_used,
      processing_time: primaryAnalysis.processing_time || 0,
      client_name: clientName,
      message: `Call analysis completed using ${analysis.model_used}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 