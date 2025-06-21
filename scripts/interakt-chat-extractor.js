#!/usr/bin/env node

/**
 * INTERAKT CHAT HISTORY EXTRACTOR
 * 
 * This script extracts your years of Interakt chat data and processes it 
 * to train your AI to sound exactly like you when talking to clients.
 * 
 * Features:
 * - Extract via Interakt API
 * - Process CSV exports
 * - Analyze conversation patterns
 * - Train AI on YOUR communication style
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

class InteraktChatExtractor {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://api.interakt.ai';
    this.outputDir = config.outputDir || './interakt-exports';
    this.conversationPatterns = [];
    this.clientResponseAnalysis = {};
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * PHASE 1: EXTRACT DATA FROM INTERAKT
   */
  async extractAllConversations() {
    console.log('🚀 EXTRACTING INTERAKT CHAT HISTORY...');
    console.log('💡 This will help your AI learn YOUR communication style!');
    
    try {
      // Method 1: API Extraction
      await this.extractViaAPI();
      
      // Method 2: Process uploaded CSV files
      await this.processCsvExports();
      
      console.log('✅ Chat history extraction complete!');
      return true;
    } catch (error) {
      console.error('❌ Extraction error:', error.message);
      return false;
    }
  }

  /**
   * Extract conversations via Interakt API
   */
  async extractViaAPI() {
    console.log('\n📡 EXTRACTING VIA INTERAKT API...');
    
    if (!this.apiKey) {
      console.log('⚠️ No API key provided. Please add your Interakt API key.');
      console.log('💡 Get it from: Interakt Dashboard > Settings > API');
      return;
    }

    try {
      // Get all conversations
      const conversations = await this.fetchAllConversations();
      
      // Save raw conversations
      const rawFile = path.join(this.outputDir, 'raw-conversations.json');
      fs.writeFileSync(rawFile, JSON.stringify(conversations, null, 2));
      console.log(`💾 Saved ${conversations.length} conversations to: ${rawFile}`);
      
      return conversations;
    } catch (error) {
      console.error('❌ API extraction failed:', error.message);
      throw error;
    }
  }

  /**
   * Fetch all users from Interakt API (they don't have a direct conversations endpoint)
   */
  async fetchAllConversations() {
    console.log('⚠️ Interakt API only provides User and Event APIs, not direct conversation access');
    console.log('💡 We can fetch users and their events, but not full chat histories');
    
    const users = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        console.log(`📄 Fetching users (offset: ${offset})...`);
        
        const response = await fetch(`${this.baseUrl}/v1/public/apis/users/?offset=${offset}&limit=${limit}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.users && data.users.length > 0) {
          users.push(...data.users);
          offset += limit;
          
          if (data.users.length < limit || !data.has_next_page) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        // Rate limiting - be nice to their API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Error fetching users (offset: ${offset}):`, error.message);
        hasMore = false;
      }
    }

    console.log(`📊 Found ${users.length} users`);
    console.log('⚠️ Note: This only includes user data, not full chat conversations');
    console.log('💡 For full chat history, please use the CSV export method');
    
    return users;
  }

  /**
   * Process CSV exports from Interakt dashboard
   */
  async processCsvExports() {
    console.log('\n📊 PROCESSING CSV EXPORTS...');
    
    const csvFiles = fs.readdirSync(this.outputDir)
      .filter(file => file.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      console.log('💡 No CSV files found. Please export conversations from:');
      console.log('   Interakt Dashboard > Conversations > Export Data');
      return;
    }

    for (const csvFile of csvFiles) {
      console.log(`📄 Processing: ${csvFile}`);
      await this.processCsvFile(path.join(this.outputDir, csvFile));
    }
  }

  /**
   * Process individual CSV file
   */
  async processCsvFile(filePath) {
    return new Promise((resolve, reject) => {
      const conversations = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          conversations.push(row);
        })
        .on('end', () => {
          const jsonFile = filePath.replace('.csv', '.json');
          fs.writeFileSync(jsonFile, JSON.stringify(conversations, null, 2));
          console.log(`✅ Converted ${conversations.length} rows to: ${jsonFile}`);
          resolve(conversations);
        })
        .on('error', reject);
    });
  }

  /**
   * PHASE 2: ANALYZE YOUR COMMUNICATION PATTERNS
   */
  async analyzeConversationPatterns() {
    console.log('\n🧠 ANALYZING YOUR COMMUNICATION PATTERNS...');
    console.log('💡 Learning how YOU naturally talk to clients...');

    const analysisResults = {
      totalConversations: 0,
      yourResponsePatterns: {},
      communicationStyle: {},
      clientJourneyMappings: {},
      commonPhrases: [],
      responseLength: { short: 0, medium: 0, long: 0 },
      toneAnalysis: {},
      timeBasedPatterns: {}
    };

    // Load all conversation data
    const conversations = await this.loadAllConversationData();
    
    for (const conversation of conversations) {
      await this.analyzeConversation(conversation, analysisResults);
    }

    // Save analysis
    const analysisFile = path.join(this.outputDir, 'communication-analysis.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analysisResults, null, 2));
    
    console.log('✅ Communication pattern analysis complete!');
    this.printAnalysisSummary(analysisResults);
    
    return analysisResults;
  }

  /**
   * Analyze individual conversation
   */
  async analyzeConversation(conversation, analysis) {
    analysis.totalConversations++;

    // Extract your responses vs client messages
    const yourMessages = this.extractYourMessages(conversation);
    const clientMessages = this.extractClientMessages(conversation);

    // Analyze response patterns
    for (const message of yourMessages) {
      this.analyzeMessagePattern(message, analysis);
    }

    // Analyze conversation flow
    this.analyzeConversationFlow(yourMessages, clientMessages, analysis);
  }

  /**
   * Extract your messages from conversation
   */
  extractYourMessages(conversation) {
    // This depends on how Interakt structures the data
    // Usually agent messages vs customer messages are differentiated
    return conversation.messages?.filter(msg => 
      msg.sender_type === 'agent' || 
      msg.from === 'agent' ||
      msg.direction === 'outgoing'
    ) || [];
  }

  /**
   * Extract client messages from conversation
   */
  extractClientMessages(conversation) {
    return conversation.messages?.filter(msg => 
      msg.sender_type === 'customer' || 
      msg.from === 'customer' ||
      msg.direction === 'incoming'
    ) || [];
  }

  /**
   * Analyze individual message pattern
   */
  analyzeMessagePattern(message, analysis) {
    const text = message.text || message.content || message.message || '';
    const wordCount = text.split(' ').length;

    // Response length categorization
    if (wordCount <= 10) {
      analysis.responseLength.short++;
    } else if (wordCount <= 50) {
      analysis.responseLength.medium++;
    } else {
      analysis.responseLength.long++;
    }

    // Common phrases extraction
    this.extractCommonPhrases(text, analysis);

    // Tone analysis
    this.analyzeTone(text, analysis);
  }

  /**
   * Extract common phrases you use
   */
  extractCommonPhrases(text, analysis) {
    // Common photography business phrases
    const phrases = [
      'thank you', 'appreciate', 'understand', 'happy to help',
      'let me know', 'sounds great', 'perfect', 'absolutely',
      'of course', 'definitely', 'sure thing', 'no problem'
    ];

    for (const phrase of phrases) {
      if (text.toLowerCase().includes(phrase)) {
        analysis.commonPhrases.push(phrase);
      }
    }
  }

  /**
   * PHASE 3: GENERATE AI TRAINING DATA
   */
  async generateAITrainingData() {
    console.log('\n🤖 GENERATING AI TRAINING DATA...');
    console.log('💡 Teaching AI to sound exactly like YOU...');

    const trainingData = {
      conversationExamples: [],
      responsePatterns: {},
      personalityProfile: {},
      contextualResponses: {},
      businessKnowledge: {}
    };

    // Load conversation analysis
    const analysisFile = path.join(this.outputDir, 'communication-analysis.json');
    const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

    // Generate training examples
    const conversations = await this.loadAllConversationData();
    
    for (const conversation of conversations) {
      const trainingExample = this.createTrainingExample(conversation);
      if (trainingExample) {
        trainingData.conversationExamples.push(trainingExample);
      }
    }

    // Create personality profile
    trainingData.personalityProfile = this.createPersonalityProfile(analysis);

    // Save training data
    const trainingFile = path.join(this.outputDir, 'ai-training-data.json');
    fs.writeFileSync(trainingFile, JSON.stringify(trainingData, null, 2));

    console.log('✅ AI training data generated!');
    console.log(`📁 Training data saved to: ${trainingFile}`);
    
    return trainingData;
  }

  /**
   * Create personality profile from analysis
   */
  createPersonalityProfile(analysis) {
    const shortResponses = analysis.responseLength.short;
    const totalResponses = shortResponses + analysis.responseLength.medium + analysis.responseLength.long;
    const shortPercentage = (shortResponses / totalResponses) * 100;

    return {
      communicationStyle: shortPercentage > 60 ? 'concise' : 'detailed',
      preferredResponseLength: shortPercentage > 60 ? 'short' : 'medium',
      commonPhrases: [...new Set(analysis.commonPhrases)],
      personalityTraits: [
        'professional', 'friendly', 'helpful', 'responsive'
      ],
      businessContext: 'photography services',
      responseGuidelines: {
        greeting: 'Warm but brief',
        questions: 'Direct and helpful', 
        closing: 'Professional and encouraging'
      }
    };
  }

  /**
   * PHASE 4: INTEGRATE WITH YOUR AI SYSTEM
   */
  async integrateWithAI() {
    console.log('\n🔄 INTEGRATING WITH YOUR AI SYSTEM...');
    
    const trainingData = JSON.parse(
      fs.readFileSync(path.join(this.outputDir, 'ai-training-data.json'), 'utf8')
    );

    // Save to your AI system's data directory
    const aiDataDir = './data/ai-training';
    if (!fs.existsSync(aiDataDir)) {
      fs.mkdirSync(aiDataDir, { recursive: true });
    }

    // Create files for your AI system
    fs.writeFileSync(
      path.join(aiDataDir, 'interakt-conversations.json'),
      JSON.stringify(trainingData.conversationExamples, null, 2)
    );

    fs.writeFileSync(
      path.join(aiDataDir, 'communication-style.json'),
      JSON.stringify(trainingData.personalityProfile, null, 2)
    );

    console.log('✅ Integration complete!');
    console.log('💡 Your AI now has access to your communication patterns!');
  }

  /**
   * Load all conversation data from files
   */
  async loadAllConversationData() {
    const conversations = [];
    
    // Load from JSON files in output directory
    const jsonFiles = fs.readdirSync(this.outputDir)
      .filter(file => file.endsWith('.json') && !file.includes('analysis') && !file.includes('training'));
    
    for (const jsonFile of jsonFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(this.outputDir, jsonFile), 'utf8'));
      conversations.push(...(Array.isArray(data) ? data : [data]));
    }
    
    return conversations;
  }

  /**
   * Print analysis summary
   */
  printAnalysisSummary(analysis) {
    console.log('\n📊 COMMUNICATION ANALYSIS SUMMARY:');
    console.log(`📱 Total Conversations: ${analysis.totalConversations}`);
    console.log(`📝 Response Lengths:`);
    console.log(`   • Short (1-10 words): ${analysis.responseLength.short}`);
    console.log(`   • Medium (11-50 words): ${analysis.responseLength.medium}`);
    console.log(`   • Long (50+ words): ${analysis.responseLength.long}`);
    
    const total = analysis.responseLength.short + analysis.responseLength.medium + analysis.responseLength.long;
    const shortPercentage = ((analysis.responseLength.short / total) * 100).toFixed(1);
    
    console.log(`\n💡 YOUR COMMUNICATION STYLE:`);
    console.log(`   • ${shortPercentage}% of your responses are short and concise`);
    console.log(`   • You prefer ${shortPercentage > 60 ? 'brief, direct' : 'detailed, explanatory'} communication`);
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🎯 INTERAKT CHAT HISTORY EXTRACTOR');
    console.log('💡 Training your AI to sound exactly like YOU!');
    console.log('==========================================\n');

    try {
      // Phase 1: Extract data
      await this.extractAllConversations();
      
      // Phase 2: Analyze patterns
      await this.analyzeConversationPatterns();
      
      // Phase 3: Generate training data
      await this.generateAITrainingData();
      
      // Phase 4: Integrate with AI
      await this.integrateWithAI();
      
      console.log('\n🎉 SUCCESS! Your AI training is complete!');
      console.log('💡 Your AI now knows how YOU communicate with clients.');
      console.log('🚀 Next: Update your AI prompts to use this training data.');
      
    } catch (error) {
      console.error('\n❌ EXTRACTION FAILED:', error.message);
      console.log('\n💡 MANUAL STEPS:');
      console.log('1. Login to Interakt Dashboard');
      console.log('2. Go to Conversations > Analytics');
      console.log('3. Click "Export Data" for all time periods');
      console.log('4. Place CSV files in ./interakt-exports/ folder');
      console.log('5. Run this script again');
    }
  }
}

// Configuration and execution
const config = {
  apiKey: process.env.INTERAKT_API_KEY || '', // Add your Interakt API key here
  outputDir: './interakt-exports'
};

// Create and run extractor
const extractor = new InteraktChatExtractor(config);

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  extractor.run().catch(console.error);
}

export default InteraktChatExtractor; 