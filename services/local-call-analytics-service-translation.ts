import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface TranslationResult {
  success: boolean;
  detected_language?: string;
  language_confidence?: number;
  duration?: number;
  english_translation?: string;
  model_used?: string;
  task?: string;
  error?: string;
}

interface CallAnalytics {
  // Sentiment Analysis
  overall_sentiment: number; // -1.0 to 1.0
  client_sentiment: number;
  agent_sentiment: number;
  
  // Agent Performance
  agent_professionalism: number; // 1-10
  agent_responsiveness: number;
  agent_knowledge: number;
  agent_closing_effectiveness: number;
  
  // Client Behavior
  client_engagement_level: number; // 1-10
  client_interest_level: number;
  client_buying_signals: number;
  client_objections: number;
  
  // Compliance & Risk
  forbidden_words_count: number;
  forbidden_words_detected: string[];
  compliance_risk_level: 'low' | 'medium' | 'high';
  compliance_issues: string[];
  
  // Business Intelligence
  quote_discussed: boolean;
  budget_mentioned: boolean;
  timeline_discussed: boolean;
  next_steps_defined: boolean;
  
  // Conversation Metrics
  talk_time_ratio: number; // agent vs client talk time
  interruptions_count: number;
  call_quality_score: number; // 1-10
  
  // Follow-up Actions
  follow_up_required: boolean;
  follow_up_priority: 'low' | 'medium' | 'high';
  suggested_actions: string[];
}

export class LocalCallAnalyticsTranslationService {
  private forbiddenWords = [
    'guaranteed', 'promise', 'definitely will', 'best price ever',
    'limited time only', 'must decide now', 'final offer'
  ];

  async translateAudio(audioFilePath: string, modelSize: string = 'large-v3'): Promise<TranslationResult> {
    try {
      console.log(`🌍 Translating audio to English using ${modelSize} model...`);
      
      const scriptPath = path.join(process.cwd(), 'scripts', 'faster-whisper-translate.py');
      const command = `source whisper-env/bin/activate && python "${scriptPath}" "${audioFilePath}" "${modelSize}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr && !stderr.includes('RuntimeWarning')) {
        console.error('Translation stderr:', stderr);
      }
      
      // Extract JSON from stdout
      const jsonMatch = stdout.match(/JSON Output:\s*(\{[\s\S]*\})/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1]);
        console.log(`✅ Translation successful: ${result.detected_language} -> English`);
        return result;
      } else {
        throw new Error('Could not parse translation result');
      }
      
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown translation error'
      };
    }
  }

  async analyzeCallWithOllama(englishTranscript: string, detectedLanguage?: string): Promise<CallAnalytics> {
    try {
      console.log('🧠 Analyzing English transcript with Ollama...');
      
      const prompt = `
You are an expert call analytics AI. Analyze this sales call transcript (translated from ${detectedLanguage || 'unknown language'} to English) and provide detailed analytics.

TRANSCRIPT:
${englishTranscript}

Provide analysis in this EXACT JSON format:
{
  "overall_sentiment": <number between -1.0 and 1.0>,
  "client_sentiment": <number between -1.0 and 1.0>,
  "agent_sentiment": <number between -1.0 and 1.0>,
  "agent_professionalism": <number 1-10>,
  "agent_responsiveness": <number 1-10>,
  "agent_knowledge": <number 1-10>,
  "agent_closing_effectiveness": <number 1-10>,
  "client_engagement_level": <number 1-10>,
  "client_interest_level": <number 1-10>,
  "client_buying_signals": <number 1-10>,
  "client_objections": <number 1-10>,
  "forbidden_words_count": <count of forbidden words: guaranteed, promise, definitely will, best price ever, limited time only, must decide now, final offer>,
  "forbidden_words_detected": [<array of detected forbidden words>],
  "compliance_risk_level": "<low/medium/high>",
  "compliance_issues": [<array of compliance issues>],
  "quote_discussed": <true/false>,
  "budget_mentioned": <true/false>,
  "timeline_discussed": <true/false>,
  "next_steps_defined": <true/false>,
  "talk_time_ratio": <estimated agent vs client talk ratio as decimal>,
  "interruptions_count": <estimated number of interruptions>,
  "call_quality_score": <number 1-10>,
  "follow_up_required": <true/false>,
  "follow_up_priority": "<low/medium/high>",
  "suggested_actions": [<array of suggested follow-up actions>]
}

Respond with ONLY the JSON, no other text.`;

      const command = `curl -s -X POST http://localhost:11434/api/generate -H "Content-Type: application/json" -d '${JSON.stringify({
        model: "llama3.1:8b",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      }).replace(/'/g, "'\"'\"'")}'`;

      const { stdout } = await execAsync(command);
      const response = JSON.parse(stdout);
      
      if (response.error) {
        throw new Error(`Ollama error: ${response.error}`);
      }
      
      const analyticsText = response.response;
      console.log('Raw Ollama response:', analyticsText);
      
      // Extract JSON from response
      const jsonMatch = analyticsText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Ollama response');
      }
      
      const analytics = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance forbidden words detection
      const detectedForbidden = this.detectForbiddenWords(englishTranscript);
      analytics.forbidden_words_count = detectedForbidden.length;
      analytics.forbidden_words_detected = detectedForbidden;
      
      // Set compliance risk based on forbidden words
      if (detectedForbidden.length >= 3) {
        analytics.compliance_risk_level = 'high';
      } else if (detectedForbidden.length >= 1) {
        analytics.compliance_risk_level = 'medium';
      } else {
        analytics.compliance_risk_level = 'low';
      }
      
      console.log('✅ Call analytics completed');
      return analytics;
      
    } catch (error) {
      console.error('Analytics error:', error);
      // Return default analytics on error
      return this.getDefaultAnalytics();
    }
  }

  private detectForbiddenWords(transcript: string): string[] {
    const lowerTranscript = transcript.toLowerCase();
    return this.forbiddenWords.filter(word => 
      lowerTranscript.includes(word.toLowerCase())
    );
  }

  private getDefaultAnalytics(): CallAnalytics {
    return {
      overall_sentiment: 0.0,
      client_sentiment: 0.0,
      agent_sentiment: 0.0,
      agent_professionalism: 5,
      agent_responsiveness: 5,
      agent_knowledge: 5,
      agent_closing_effectiveness: 5,
      client_engagement_level: 5,
      client_interest_level: 5,
      client_buying_signals: 5,
      client_objections: 5,
      forbidden_words_count: 0,
      forbidden_words_detected: [],
      compliance_risk_level: 'low',
      compliance_issues: [],
      quote_discussed: false,
      budget_mentioned: false,
      timeline_discussed: false,
      next_steps_defined: false,
      talk_time_ratio: 0.5,
      interruptions_count: 0,
      call_quality_score: 5,
      follow_up_required: false,
      follow_up_priority: 'low',
      suggested_actions: []
    };
  }

  async processCallRecording(
    audioFilePath: string,
    clientName: string,
    callDuration: number,
    modelSize: string = 'large-v3'
  ): Promise<{
    translationResult: TranslationResult;
    analytics: CallAnalytics;
  }> {
    console.log(`🎯 Processing call recording for ${clientName}...`);
    
    // Step 1: Translate audio to English
    const translationResult = await this.translateAudio(audioFilePath, modelSize);
    
    if (!translationResult.success || !translationResult.english_translation) {
      throw new Error(`Translation failed: ${translationResult.error}`);
    }
    
    // Step 2: Analyze the English transcript
    const analytics = await this.analyzeCallWithOllama(
      translationResult.english_translation,
      translationResult.detected_language
    );
    
    console.log(`✅ Call processing completed for ${clientName}`);
    
    return {
      translationResult,
      analytics
    };
  }
} 