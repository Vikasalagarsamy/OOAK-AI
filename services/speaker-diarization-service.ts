export class SpeakerDiarizationService {
  /**
   * Adds speaker labels to raw transcript based on conversation patterns
   * @param rawTranscript - Raw transcript from Whisper
   * @param clientName - Name of the client for identification
   * @returns Transcript with [AGENT] and [CLIENT] labels
   */
  static addSpeakerLabels(rawTranscript: string, clientName: string = 'Client'): string {
    // Split transcript into sentences/segments
    const segments = rawTranscript
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 3);

    let labeledTranscript = '';
    let currentSpeaker: 'AGENT' | 'CLIENT' = 'AGENT'; // Assume agent starts

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Detect speaker changes based on patterns
      const speakerChange = this.detectSpeakerChange(segment, segments[i - 1] || '', clientName);
      
      if (speakerChange) {
        currentSpeaker = currentSpeaker === 'AGENT' ? 'CLIENT' : 'AGENT';
      }

      // Add speaker label and segment
      if (segment.length > 0) {
        labeledTranscript += `[${currentSpeaker}]: ${segment}.\n`;
      }
    }

    return labeledTranscript;
  }

  /**
   * Detects if speaker has changed based on conversation patterns
   */
  private static detectSpeakerChange(
    currentSegment: string, 
    previousSegment: string, 
    clientName: string
  ): boolean {
    const current = currentSegment.toLowerCase();
    const previous = previousSegment.toLowerCase();

    // Name-based detection
    if (current.includes(clientName.toLowerCase()) || 
        current.includes('hi ') || current.includes('hello ') ||
        current.includes('good morning') || current.includes('good afternoon')) {
      return true;
    }

    // Response patterns (likely speaker change)
    const responsePatterns = [
      'okay', 'yes', 'no', 'right', 'correct', 'sure', 'exactly',
      'thank you', 'thanks', 'welcome', 'alright', 'hmm', 'yeah'
    ];

    // Short responses often indicate speaker change
    if (current.length < 30 && responsePatterns.some(pattern => current.includes(pattern))) {
      return true;
    }

    // Question followed by answer pattern
    if (previous.includes('?') && !current.includes('?')) {
      return true;
    }

    // Long segment after short one (detailed response)
    if (previous.length < 20 && current.length > 50) {
      return true;
    }

    return false;
  }

  /**
   * Analyzes speaker statistics from labeled transcript
   */
  static analyzeSpeakerStats(labeledTranscript: string): {
    agentTalkTime: number;
    clientTalkTime: number;
    agentSegments: number;
    clientSegments: number;
    talkTimeRatio: number;
  } {
    const lines = labeledTranscript.split('\n').filter(line => line.trim());
    
    let agentWords = 0;
    let clientWords = 0;
    let agentSegments = 0;
    let clientSegments = 0;

    for (const line of lines) {
      if (line.startsWith('[AGENT]:')) {
        const words = line.replace('[AGENT]:', '').trim().split(/\s+/).length;
        agentWords += words;
        agentSegments++;
      } else if (line.startsWith('[CLIENT]:')) {
        const words = line.replace('[CLIENT]:', '').trim().split(/\s+/).length;
        clientWords += words;
        clientSegments++;
      }
    }

    const totalWords = agentWords + clientWords;
    const agentTalkTime = totalWords > 0 ? agentWords / totalWords : 0.5;
    const clientTalkTime = totalWords > 0 ? clientWords / totalWords : 0.5;

    return {
      agentTalkTime,
      clientTalkTime,
      agentSegments,
      clientSegments,
      talkTimeRatio: agentTalkTime / (clientTalkTime || 0.1) // Avoid division by zero
    };
  }

  /**
   * Extracts key business information from speaker-labeled transcript
   */
  static extractBusinessInfo(labeledTranscript: string): {
    pricesMentioned: string[];
    venuesMentioned: string[];
    timesMentioned: string[];
    nextSteps: string[];
    clientConcerns: string[];
    agentPromises: string[];
  } {
    const lines = labeledTranscript.split('\n').filter(line => line.trim());
    
    const businessInfo = {
      pricesMentioned: [] as string[],
      venuesMentioned: [] as string[],
      timesMentioned: [] as string[],
      nextSteps: [] as string[],
      clientConcerns: [] as string[],
      agentPromises: [] as string[]
    };

    // Price pattern detection
    const priceRegex = /₹?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|lakh|lakhs?|rupees?|rs\.?)?/gi;
    
    // Venue pattern detection
    const venueKeywords = ['palace', 'hall', 'venue', 'location', 'place', 'resort', 'hotel', 'auditorium'];
    
    // Time pattern detection
    const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm|morning|afternoon|evening|night))/gi;

    for (const line of lines) {
      const text = line.replace(/\[(?:AGENT|CLIENT)\]:/, '').trim().toLowerCase();
      
      // Extract prices
      const prices = text.match(priceRegex);
      if (prices) {
        businessInfo.pricesMentioned.push(...prices);
      }

      // Extract venues
      venueKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          const words = text.split(/\s+/);
          const index = words.findIndex(word => word.includes(keyword));
          if (index >= 0) {
            // Get context around venue mention
            const context = words.slice(Math.max(0, index - 2), index + 3).join(' ');
            businessInfo.venuesMentioned.push(context);
          }
        }
      });

      // Extract times
      const times = text.match(timeRegex);
      if (times) {
        businessInfo.timesMentioned.push(...times);
      }

      // Extract next steps and commitments
      if (line.startsWith('[AGENT]:')) {
        if (text.includes('will') || text.includes('call you') || text.includes('check')) {
          businessInfo.agentPromises.push(line);
        }
      }

      if (line.startsWith('[CLIENT]:')) {
        if (text.includes('but') || text.includes('however') || text.includes('concern')) {
          businessInfo.clientConcerns.push(line);
        }
      }

      // Next steps
      if (text.includes('follow up') || text.includes('call you') || text.includes('meet')) {
        businessInfo.nextSteps.push(line);
      }
    }

    return businessInfo;
  }
} 