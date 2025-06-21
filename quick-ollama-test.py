#!/usr/bin/env python3
"""
Quick Ollama Test - Show current analytics capabilities
"""

import asyncio
import aiohttp
import json
import time

async def test_ollama_analytics():
    print("🔬 QUICK OLLAMA ANALYTICS TEST")
    print("=" * 50)
    print("Testing your current system on Sandhya's call...")
    
    # Your actual transcript from Large-v3
    transcript = """Hello. Tell me Sridhar. Hi Sandhya. Good afternoon. Good afternoon. So, Sandhya, I checked. Sorry, I was late to go home. So, I couldn't take your call. I reached late at night. So, I didn't want to call you at late night. Okay. So, I discussed it with Sandhya. I told her to close by 1.30pm. 1.30pm? Yes. But, I can... 5K? Yes, 5K. I asked a lot for that. Okay. And... Okay. For me... But, I will give you less time in this. I can give you that as you want. In music? Yes. Okay. Okay. Okay. Hmm? Okay. This morning, I went to see Padmavathi. Okay. Padmavathi Palace. Padmavathi Palace. Yes. Yes. I just went and saw it. So, yes. I think it's okay. But... I have to check small halls. I saw that too. Okay. So, you have to check small halls. No. I have to check my stuff. Yes. My stuff... Pallavi. Okay. Sir, the one more thing... Sure. Yes? Okay. This evening, Samit has been doing the same thing that was happening. Sure. Okay. So, that's it? Yes. I have to check all the places that he did last evening. Okay. And I have to check Kashumbu. Okay. We don't have a lot of time. Okay. And then we will take it forward. Okay, Sandhya. So, can I call you in the evening? Yes, call me. Okay, Sandhya. Thank you very much. Hello."""
    
    prompt = f"""
You are an expert call analytics AI for an autonomous photography business. Analyze this client conversation and provide detailed business intelligence.

CLIENT: Sandhya
TRANSCRIPT: {transcript}

Provide analysis in this EXACT JSON format:
{{
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
}}

Respond with ONLY the JSON, no other text."""

    start_time = time.time()
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.1:8b",
                    "prompt": prompt,
                    "stream": False
                }
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    processing_time = time.time() - start_time
                    
                    print(f"⏱️  Processing time: {processing_time:.2f} seconds")
                    print()
                    
                    # Extract and parse JSON
                    response_text = result.get('response', '')
                    try:
                        json_start = response_text.find('{')
                        json_end = response_text.rfind('}') + 1
                        if json_start != -1 and json_end != 0:
                            json_str = response_text[json_start:json_end]
                            analysis = json.loads(json_str)
                            
                            print("📊 CURRENT OLLAMA ANALYTICS:")
                            print("-" * 30)
                            print(f"👤 Client Interest: {analysis.get('client_interest_level', 'N/A')}/10")
                            print(f"🎯 Booking Probability: {analysis.get('estimated_booking_probability', 'N/A')}%")
                            print(f"💼 Business Priority: {analysis.get('business_priority', 'N/A')}")
                            print(f"💰 Potential Revenue: ₹{analysis.get('potential_revenue', 'Unknown')}")
                            print(f"📋 Service Type: {analysis.get('service_type', 'N/A')}")
                            print(f"⏰ Decision Timeline: {analysis.get('decision_timeline', 'N/A')}")
                            print(f"💵 Budget Mentioned: {analysis.get('budget_mentioned', 'N/A')}")
                            print(f"📞 Follow-up Required: {analysis.get('follow_up_required', 'N/A')}")
                            print()
                            
                            print("🔍 KEY INSIGHTS:")
                            insights = analysis.get('key_insights', [])
                            if insights:
                                for i, insight in enumerate(insights, 1):
                                    print(f"   {i}. {insight}")
                            else:
                                print("   No specific insights generated")
                            print()
                            
                            print("📋 RECOMMENDED ACTIONS:")
                            actions = analysis.get('recommended_actions', [])
                            if actions:
                                for i, action in enumerate(actions, 1):
                                    print(f"   {i}. {action}")
                            else:
                                print("   No specific actions recommended")
                            print()
                            
                            # Show what Fathom-R1-14B might add
                            print("🎯 WHAT FATHOM-R1-14B COULD ADD:")
                            print("   📈 Mathematical reasoning for revenue optimization")
                            print("   🧠 Step-by-step logical analysis chain")
                            print("   🎭 Client personality profiling")
                            print("   ⚠️  Risk factor assessment")
                            print("   📊 Competitive advantage identification")
                            print("   💡 Advanced upsell opportunity detection")
                            print("   🔍 Deeper venue/pricing analysis")
                            
                        else:
                            print("❌ Could not extract JSON from response")
                            print("Raw response:", response_text[:500])
                            
                    except json.JSONDecodeError as e:
                        print(f"❌ JSON parsing error: {e}")
                        print("Raw response:", response_text[:500])
                        
                else:
                    print(f"❌ HTTP error: {response.status}")
                    
    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("Make sure Ollama is running: ollama serve")

if __name__ == "__main__":
    asyncio.run(test_ollama_analytics()) 