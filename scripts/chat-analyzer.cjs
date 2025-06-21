#!/usr/bin/env node

/**
 * CHAT ANALYZER - Extract YOUR Communication Patterns
 * 
 * This script analyzes your real conversation files to understand:
 * - How you naturally respond to clients
 * - Your tone, length, and style preferences
 * - Common phrases and patterns you use
 * 
 * Goal: Train AI to sound exactly like YOU!
 */

const fs = require('fs');
const path = require('path');

class VikasConversationAnalyzer {
  constructor() {
    this.conversations = [];
    this.yourResponses = [];
    this.clientMessages = [];
    this.communicationPatterns = {
      responseLength: [],
      greetings: [],
      farewells: [],
      commonWords: {},
      responses: {
        short: [], // 1-5 words
        medium: [], // 6-15 words  
        long: [], // 16+ words
      }
    };
  }

  /**
   * Load and process all chat files
   */
  async loadChatFiles() {
    const chatDir = './chat-training-data';
    
    if (!fs.existsSync(chatDir)) {
      console.log('❌ Chat training data folder not found!');
      return;
    }

    const files = fs.readdirSync(chatDir).filter(file => file.endsWith('.txt'));
    console.log(`📁 Found ${files.length} conversation files:`);
    
    for (const file of files) {
      console.log(`   📄 ${file}`);
      const content = fs.readFileSync(path.join(chatDir, file), 'utf8');
      await this.parseConversation(content, file);
    }
  }

  /**
   * Parse individual conversation file
   */
  async parseConversation(content, filename) {
    const lines = content.split('\n').filter(line => line.trim());
    const conversation = {
      filename,
      messages: []
    };

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Detect agent (YOU) vs client messages
      if (line.startsWith('Agent:')) {
        const message = line.substring(6).trim();
        if (message) {
          conversation.messages.push({
            speaker: 'you',
            message: message
          });
          this.yourResponses.push(message);
          this.analyzeYourResponse(message);
        }
      } else if (line.startsWith('Client:')) {
        const message = line.substring(7).trim();
        if (message) {
          conversation.messages.push({
            speaker: 'client', 
            message: message
          });
          this.clientMessages.push(message);
        }
      }
    }

    this.conversations.push(conversation);
  }

  /**
   * Analyze your communication patterns
   */
  analyzeYourResponse(message) {
    const words = message.split(' ').length;
    this.communicationPatterns.responseLength.push(words);

    // Categorize by length
    if (words <= 5) {
      this.communicationPatterns.responses.short.push(message);
    } else if (words <= 15) {
      this.communicationPatterns.responses.medium.push(message);
    } else {
      this.communicationPatterns.responses.long.push(message);
    }

    // Extract common words (excluding very common ones)
    const wordsArray = message.toLowerCase().split(/\s+/);
    const excludeWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    wordsArray.forEach(word => {
      word = word.replace(/[^\w]/g, ''); // Remove punctuation
      if (word.length > 2 && !excludeWords.includes(word)) {
        this.communicationPatterns.commonWords[word] = (this.communicationPatterns.commonWords[word] || 0) + 1;
      }
    });

    // Detect greetings
    const greetings = ['hello', 'hi', 'good morning', 'good evening', 'thank you', 'thanks'];
    greetings.forEach(greeting => {
      if (message.toLowerCase().includes(greeting)) {
        this.communicationPatterns.greetings.push(greeting);
      }
    });
  }

  /**
   * Generate comprehensive analysis
   */
  generateAnalysis() {
    console.log('\n🧠 ANALYZING YOUR COMMUNICATION STYLE...\n');
    
    // Basic stats
    console.log('📊 CONVERSATION STATISTICS:');
    console.log(`   📁 Total conversations analyzed: ${this.conversations.length}`);
    console.log(`   💬 Your total responses: ${this.yourResponses.length}`);
    console.log(`   📝 Client messages: ${this.clientMessages.length}`);

    // Response length analysis  
    const avgLength = Math.round(
      this.communicationPatterns.responseLength.reduce((a, b) => a + b, 0) / 
      this.communicationPatterns.responseLength.length
    );
    
    console.log('\n📏 YOUR RESPONSE LENGTH PATTERNS:');
    console.log(`   📊 Average response length: ${avgLength} words`);
    console.log(`   🔸 Short responses (1-5 words): ${this.communicationPatterns.responses.short.length}`);
    console.log(`   🔸 Medium responses (6-15 words): ${this.communicationPatterns.responses.medium.length}`);  
    console.log(`   🔸 Long responses (16+ words): ${this.communicationPatterns.responses.long.length}`);

    // Response style breakdown
    const total = this.yourResponses.length;
    const shortPct = Math.round((this.communicationPatterns.responses.short.length / total) * 100);
    const mediumPct = Math.round((this.communicationPatterns.responses.medium.length / total) * 100);
    const longPct = Math.round((this.communicationPatterns.responses.long.length / total) * 100);

    console.log('\n🎯 YOUR NATURAL COMMUNICATION STYLE:');
    console.log(`   ⚡ ${shortPct}% Short & Direct responses`);
    console.log(`   📝 ${mediumPct}% Medium explanatory responses`);
    console.log(`   📄 ${longPct}% Detailed responses`);

    // Most common words you use
    const topWords = Object.entries(this.communicationPatterns.commonWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    console.log('\n💬 YOUR MOST USED WORDS:');
    topWords.forEach(([word, count], i) => {
      console.log(`   ${i + 1}. "${word}" (used ${count} times)`);
    });

    // Sample responses by category
    console.log('\n🗣️ SAMPLE SHORT RESPONSES (Your Style):');
    this.communicationPatterns.responses.short
      .slice(0, 8)
      .forEach((response, i) => {
        console.log(`   ${i + 1}. "${response}"`);
      });

    console.log('\n💬 SAMPLE MEDIUM RESPONSES (Your Style):');
    this.communicationPatterns.responses.medium
      .slice(0, 5)
      .forEach((response, i) => {
        console.log(`   ${i + 1}. "${response}"`);
      });

    return this.generateTrainingData();
  }

  /**
   * Generate AI training data based on your patterns
   */
  generateTrainingData() {
    const trainingData = {
      vikasPersonality: {
        averageResponseLength: Math.round(
          this.communicationPatterns.responseLength.reduce((a, b) => a + b, 0) / 
          this.communicationPatterns.responseLength.length
        ),
        responseDistribution: {
          short: Math.round((this.communicationPatterns.responses.short.length / this.yourResponses.length) * 100),
          medium: Math.round((this.communicationPatterns.responses.medium.length / this.yourResponses.length) * 100), 
          long: Math.round((this.communicationPatterns.responses.long.length / this.yourResponses.length) * 100)
        },
        commonWords: Object.entries(this.communicationPatterns.commonWords)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
          .map(([word]) => word),
        tone: 'professional but friendly',
        businessContext: 'photography and video production'
      },
      
      conversationExamples: this.conversations.map(conv => ({
        filename: conv.filename,
        messageCount: conv.messages.length,
        exchanges: this.extractConversationFlow(conv)
      })),

      responseTemplates: {
        greetings: [
          "Hello! Thank you for contacting OOAK.",
          "Hi! Could you please share your event details?",
          "Thank you for the details.",
          "Thanks for contacting ONE OF A KIND PHOTOGRAPHY!"
        ],
        
        acknowledgments: [
          "Noted.",
          "Got it.",
          "Thank you.",
          "Understood.",
          "Acknowledged.",
          "Sure."
        ],
        
        updates: [
          "Will share updates.",
          "We'll get back to you shortly.",
          "It's under progress.",
          "Will share by next week.",
          "Completion expected by [timeframe]."
        ],
        
        links: [
          "UNLOCK YOUR EDITED PICTURES: [link]",
          "Your photos are now available at [link]",
          "Updated video link: [link]"
        ]
      },

      realExamples: {
        shortResponses: this.communicationPatterns.responses.short.slice(0, 20),
        mediumResponses: this.communicationPatterns.responses.medium.slice(0, 15),
        longResponses: this.communicationPatterns.responses.long.slice(0, 10)
      }
    };

    // Save training data
    fs.writeFileSync('ai-training-data.json', JSON.stringify(trainingData, null, 2));
    console.log('\n💾 AI TRAINING DATA GENERATED!');
    console.log('   📁 Saved to: ai-training-data.json');
    
    console.log('\n🚀 NEXT STEPS TO HUMANIZE YOUR AI:');
    console.log('   1. ✅ Your communication patterns extracted');
    console.log('   2. 🤖 Update AI prompts with your style');
    console.log('   3. 🧪 Test human-like responses');
    console.log('   4. 🎯 Deploy more natural AI conversations');

    return trainingData;
  }

  /**
   * Extract conversation flow patterns
   */
  extractConversationFlow(conversation) {
    const exchanges = [];
    let lastClientMessage = null;

    for (const message of conversation.messages) {
      if (message.speaker === 'client') {
        lastClientMessage = message.message;
      } else if (message.speaker === 'you' && lastClientMessage) {
        exchanges.push({
          clientSaid: lastClientMessage,
          youResponded: message.message,
          responseLength: message.message.split(' ').length
        });
        lastClientMessage = null;
      }
    }

    return exchanges.slice(0, 10); // Keep top 10 exchanges per conversation
  }

  /**
   * Run the complete analysis
   */
  async run() {
    console.log('🎯 VIKAS CONVERSATION ANALYZER');
    console.log('==================================');
    console.log('📋 Analyzing your real conversations to train AI...\n');
    
    await this.loadChatFiles();
    
    if (this.conversations.length === 0) {
      console.log('\n❌ No conversation files found!');
      console.log('📋 Make sure your .txt files are in: ./chat-training-data/');
      return;
    }

    const trainingData = this.generateAnalysis();
    
    console.log('\n✅ ANALYSIS COMPLETE!');
    console.log('\n🎯 KEY INSIGHTS:');
    console.log(`   📊 You prefer ${trainingData.vikasPersonality.responseDistribution.short > 50 ? 'SHORT' : 'DETAILED'} responses`);
    console.log(`   💬 Average response: ${trainingData.vikasPersonality.averageResponseLength} words`);
    console.log(`   🎨 Style: Professional photography expert`);
    console.log(`   🔥 Top words: ${trainingData.vikasPersonality.commonWords.slice(0, 5).join(', ')}`);

    console.log('\n📝 READY TO TRAIN AI WITH YOUR STYLE! 🚀');
    
    return trainingData;
  }
}

// Run the analyzer
const analyzer = new VikasConversationAnalyzer();
analyzer.run().catch(console.error); 