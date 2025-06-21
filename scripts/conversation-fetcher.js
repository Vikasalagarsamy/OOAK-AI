#!/usr/bin/env node

/**
 * INDIVIDUAL CONVERSATION FETCHER
 * 
 * Uses conversation IDs from the analytics CSV export to try
 * fetching individual conversation content from Interakt
 */

import fs from 'fs';
import csv from 'csv-parser';

class ConversationFetcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.interakt.ai';
    this.conversationIds = [];
    this.conversations = [];
  }

  /**
   * Read conversation IDs from the exported CSV
   */
  async parseConversationIds(csvPath) {
    return new Promise((resolve, reject) => {
      const ids = [];
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          if (row['Conversation Identifier'] && row['Conversation Identifier'].trim()) {
            ids.push(row['Conversation Identifier'].trim());
          }
        })
        .on('end', () => {
          console.log(`✅ Found ${ids.length} conversation IDs`);
          resolve(ids);
        })
        .on('error', reject);
    });
  }

  /**
   * Try different API endpoints to fetch conversation content
   */
  async fetchConversation(conversationId) {
    const endpoints = [
      `/v1/conversations/${conversationId}`,
      `/conversations/${conversationId}`,
      `/v1/chats/${conversationId}`,
      `/chats/${conversationId}`,
      `/v1/messages/${conversationId}`,
      `/messages/${conversationId}`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying: ${this.baseUrl}${endpoint}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ SUCCESS! Found conversation data at: ${endpoint}`);
          return { endpoint, data };
        } else {
          console.log(`❌ ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Try to fetch all conversations
   */
  async fetchAllConversations(csvPath) {
    console.log('📄 Reading conversation IDs from CSV...');
    
    try {
      this.conversationIds = await this.parseConversationIds(csvPath);
      
      if (this.conversationIds.length === 0) {
        console.log('❌ No conversation IDs found in CSV');
        return;
      }

      console.log(`\n🚀 Attempting to fetch ${Math.min(3, this.conversationIds.length)} conversations...`);
      
      // Try first 3 conversations to test
      for (let i = 0; i < Math.min(3, this.conversationIds.length); i++) {
        const conversationId = this.conversationIds[i];
        console.log(`\n--- Conversation ${i + 1}: ${conversationId} ---`);
        
        const result = await this.fetchConversation(conversationId);
        if (result) {
          this.conversations.push({
            id: conversationId,
            endpoint: result.endpoint,
            data: result.data
          });
          
          // Save successful result
          const filename = `conversation_${conversationId}.json`;
          fs.writeFileSync(filename, JSON.stringify(result.data, null, 2));
          console.log(`💾 Saved to: ${filename}`);
        }
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`\n✅ Successfully fetched ${this.conversations.length} conversations`);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

// Usage
const apiKey = process.env.INTERAKT_API_KEY;
const csvPath = process.argv[2] || './interakt-exports/analytics.csv';

if (!apiKey) {
  console.log('❌ Please set INTERAKT_API_KEY environment variable');
  console.log('Usage: INTERAKT_API_KEY="your-key" node scripts/conversation-fetcher.js [csv-path]');
  process.exit(1);
}

const fetcher = new ConversationFetcher(apiKey);
fetcher.fetchAllConversations(csvPath).catch(console.error);

export default ConversationFetcher; 