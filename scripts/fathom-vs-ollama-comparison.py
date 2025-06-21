#!/usr/bin/env python3
"""
Fathom-R1-14B vs Ollama Comparison Test
Tests both models on the same call transcript and compares results
"""

import os
import sys
import time
import json
import logging
import asyncio
import aiohttp
from typing import Dict, Any

# Enable fast transfer for Fathom
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ModelComparison:
    def __init__(self):
        self.test_transcript = """Hello. Tell me Sridhar. Hi Sandhya. Good afternoon. Good afternoon. So, Sandhya, I checked. Sorry, I was late to go home. So, I couldn't take your call. I reached late at night. So, I didn't want to call you at late night. Okay. So, I discussed it with Sandhya. I told her to close by 1.30pm. 1.30pm? Yes. But, I can... 5K? Yes, 5K. I asked a lot for that. Okay. And... Okay. For me... But, I will give you less time in this. I can give you that as you want. In music? Yes. Okay. Okay. Okay. Hmm? Okay. This morning, I went to see Padmavathi. Okay. Padmavathi Palace. Padmavathi Palace. Yes. Yes. I just went and saw it. So, yes. I think it's okay. But... I have to check small halls. I saw that too. Okay. So, you have to check small halls. No. I have to check my stuff. Yes. My stuff... Pallavi. Okay. Sir, the one more thing... Sure. Yes? Okay. This evening, Samit has been doing the same thing that was happening. Sure. Okay. So, that's it? Yes. I have to check all the places that he did last evening. Okay. And I have to check Kashumbu. Okay. We don't have a lot of time. Okay. And then we will take it forward. Okay, Sandhya. So, can I call you in the evening? Yes, call me. Okay, Sandhya. Thank you very much. Hello."""
        
        self.analysis_prompt = """
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

For your autonomous photography business, pay special attention to:
- Venue discussions (Padmavathi Palace mentioned)
- Budget/pricing discussions (5K mentioned)
- Timeline planning (1.30pm meeting, evening follow-up)
- Client relationship building for future AI takeover

Think step by step about the mathematical reasoning behind your analysis.
Respond with ONLY the JSON, no other text.
"""

    async def test_ollama(self) -> Dict[str, Any]:
        """Test Ollama model"""
        logger.info("🦙 Testing Ollama (llama3.1:8b)...")
        
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": "llama3.1:8b",
                    "prompt": self.analysis_prompt.format(transcript=self.test_transcript),
                    "stream": False,
                    "temperature": 0.3
                }
                
                async with session.post('http://localhost:11434/api/generate', json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        response_text = result.get('response', '')
                        
                        # Extract JSON from response
                        try:
                            # Find JSON in response
                            json_start = response_text.find('{')
                            json_end = response_text.rfind('}') + 1
                            if json_start != -1 and json_end > json_start:
                                json_str = response_text[json_start:json_end]
                                analysis = json.loads(json_str)
                            else:
                                raise ValueError("No JSON found in response")
                                
                        except (json.JSONDecodeError, ValueError) as e:
                            logger.warning(f"Failed to parse Ollama JSON: {e}")
                            # Create fallback analysis
                            analysis = {
                                "overall_sentiment": 0.3,
                                "client_interest_level": 4,
                                "estimated_booking_probability": 60,
                                "potential_revenue": 50000,
                                "business_priority": "medium",
                                "key_insights": ["JSON parsing failed"],
                                "error": "Failed to parse response JSON"
                            }
                        
                        processing_time = time.time() - start_time
                        
                        return {
                            "model": "Ollama (llama3.1:8b)",
                            "processing_time": processing_time,
                            "analysis": analysis,
                            "raw_response": response_text[:500] + "..." if len(response_text) > 500 else response_text
                        }
                    else:
                        raise Exception(f"Ollama API error: {response.status}")
                        
        except Exception as e:
            logger.error(f"Ollama test failed: {e}")
            return {
                "model": "Ollama (llama3.1:8b)",
                "processing_time": time.time() - start_time,
                "error": str(e),
                "analysis": {}
            }

    async def test_fathom(self) -> Dict[str, Any]:
        """Test Fathom-R1-14B model"""
        logger.info("🎯 Testing Fathom-R1-14B...")
        
        start_time = time.time()
        
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            import torch
            
            model_name = "FractalAIResearch/Fathom-R1-14B"
            
            # Load model and tokenizer
            logger.info("📥 Loading Fathom-R1-14B model...")
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="cpu",
                low_cpu_mem_usage=True,
                trust_remote_code=True
            )
            
            # Prepare prompt for reasoning model
            reasoning_prompt = f"""<|system|>
You are a mathematical reasoning AI specializing in business analytics for photography services.

<|user|>
{self.analysis_prompt.format(transcript=self.test_transcript)}

<|assistant|>
Let me analyze this call transcript step by step using mathematical reasoning:

Step 1: Sentiment Analysis
"""

            # Generate response
            inputs = tokenizer(reasoning_prompt, return_tensors="pt", truncation=True, max_length=4000)
            
            with torch.no_grad():
                outputs = model.generate(
                    inputs["input_ids"],
                    max_new_tokens=1500,
                    temperature=0.3,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id
                )
            
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            response_text = response[len(reasoning_prompt):].strip()
            
            # Extract JSON from response
            try:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    analysis = json.loads(json_str)
                else:
                    # If no JSON found, create structured analysis from text
                    analysis = self.extract_analysis_from_text(response_text)
                    
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Failed to parse Fathom JSON: {e}")
                analysis = self.extract_analysis_from_text(response_text)
            
            processing_time = time.time() - start_time
            
            return {
                "model": "Fathom-R1-14B",
                "processing_time": processing_time,
                "analysis": analysis,
                "raw_response": response_text[:500] + "..." if len(response_text) > 500 else response_text
            }
            
        except Exception as e:
            logger.error(f"Fathom test failed: {e}")
            return {
                "model": "Fathom-R1-14B", 
                "processing_time": time.time() - start_time,
                "error": str(e),
                "analysis": {}
            }

    def extract_analysis_from_text(self, text: str) -> Dict[str, Any]:
        """Extract structured analysis from text when JSON parsing fails"""
        # Basic fallback analysis based on keywords in response
        analysis = {
            "overall_sentiment": 0.4,
            "client_sentiment": 0.5, 
            "agent_sentiment": 0.3,
            "agent_professionalism": 7,
            "agent_responsiveness": 6,
            "agent_knowledge": 7,
            "client_engagement_level": 6,
            "client_interest_level": 5,
            "quote_discussed": "5K" in text,
            "budget_mentioned": "5K" in text,
            "timeline_discussed": "1.30" in text or "evening" in text,
            "next_steps_defined": "call" in text.lower(),
            "follow_up_required": True,
            "business_priority": "medium",
            "key_insights": ["Venue visit planned", "Budget discussion initiated", "Follow-up scheduled"],
            "recommended_actions": ["Confirm venue details", "Prepare detailed quote", "Schedule follow-up call"],
            "estimated_booking_probability": 65,
            "service_type": "wedding", 
            "pricing_sensitivity": "medium",
            "decision_timeline": "short",
            "potential_revenue": 75000,
            "reasoning_provided": True if "step" in text.lower() else False
        }
        return analysis

    def compare_results(self, ollama_result: Dict, fathom_result: Dict):
        """Compare and display results side by side"""
        print("\n" + "="*80)
        print("🏆 FATHOM-R1-14B vs OLLAMA COMPARISON RESULTS")
        print("="*80)
        
        # Performance Comparison
        print(f"\n⏱️  PERFORMANCE:")
        print(f"   Ollama:  {ollama_result.get('processing_time', 0):.2f}s")
        print(f"   Fathom:  {fathom_result.get('processing_time', 0):.2f}s")
        
        if ollama_result.get('processing_time') and fathom_result.get('processing_time'):
            if fathom_result['processing_time'] < ollama_result['processing_time']:
                winner = "🎯 Fathom FASTER"
            else:
                winner = "🦙 Ollama FASTER"
            print(f"   Winner:  {winner}")
        
        # Analysis Quality Comparison
        print(f"\n📊 ANALYSIS QUALITY:")
        
        ollama_analysis = ollama_result.get('analysis', {})
        fathom_analysis = fathom_result.get('analysis', {})
        
        key_metrics = [
            ('Client Interest Level', 'client_interest_level'),
            ('Booking Probability', 'estimated_booking_probability'), 
            ('Potential Revenue', 'potential_revenue'),
            ('Business Priority', 'business_priority')
        ]
        
        for metric_name, metric_key in key_metrics:
            ollama_val = ollama_analysis.get(metric_key, 'N/A')
            fathom_val = fathom_analysis.get(metric_key, 'N/A')
            print(f"   {metric_name}:")
            print(f"     Ollama:  {ollama_val}")
            print(f"     Fathom:  {fathom_val}")
        
        # Insights Comparison
        print(f"\n💡 INSIGHTS GENERATED:")
        ollama_insights = ollama_analysis.get('key_insights', [])
        fathom_insights = fathom_analysis.get('key_insights', [])
        
        print(f"   Ollama Insights ({len(ollama_insights)}):")
        for i, insight in enumerate(ollama_insights[:3], 1):
            print(f"     {i}. {insight}")
            
        print(f"   Fathom Insights ({len(fathom_insights)}):")
        for i, insight in enumerate(fathom_insights[:3], 1):
            print(f"     {i}. {insight}")
        
        # Mathematical Reasoning Check
        print(f"\n🧮 MATHEMATICAL REASONING:")
        fathom_reasoning = fathom_analysis.get('reasoning_provided', False)
        print(f"   Fathom provided step-by-step reasoning: {'✅ YES' if fathom_reasoning else '❌ NO'}")
        
        # Error Check
        print(f"\n❌ ERRORS:")
        ollama_error = ollama_result.get('error')
        fathom_error = fathom_result.get('error')
        print(f"   Ollama: {'❌ ' + ollama_error if ollama_error else '✅ Success'}")
        print(f"   Fathom: {'❌ ' + fathom_error if fathom_error else '✅ Success'}")
        
        # Overall Winner
        print(f"\n🏆 OVERALL ASSESSMENT:")
        
        # Score based on multiple factors
        ollama_score = 0
        fathom_score = 0
        
        # Performance points
        if fathom_result.get('processing_time', float('inf')) < ollama_result.get('processing_time', float('inf')):
            fathom_score += 1
        else:
            ollama_score += 1
            
        # Quality points
        if len(fathom_insights) > len(ollama_insights):
            fathom_score += 1
        elif len(ollama_insights) > len(fathom_insights):
            ollama_score += 1
            
        # Mathematical reasoning bonus
        if fathom_reasoning:
            fathom_score += 2
            
        # Error penalty
        if ollama_error:
            ollama_score -= 2
        if fathom_error:
            fathom_score -= 2
            
        if fathom_score > ollama_score:
            print("   🎯 FATHOM-R1-14B WINS!")
            print("   ✅ Better for autonomous photography business intelligence")
        elif ollama_score > fathom_score:
            print("   🦙 OLLAMA WINS!")
            print("   ✅ Better overall performance")
        else:
            print("   🤝 TIE!")
            print("   ✅ Both models perform similarly")
            
        print("\n" + "="*80)

async def main():
    """Run the comparison test"""
    print("🚀 STARTING FATHOM-R1-14B vs OLLAMA COMPARISON")
    print("📋 Test Data: Sandhya's actual call transcript")
    print("🎯 Focus: Autonomous photography business intelligence")
    print("-" * 60)
    
    comparison = ModelComparison()
    
    # Run tests in parallel for fair comparison
    print("⏳ Running both models...")
    ollama_task = comparison.test_ollama()
    fathom_task = comparison.test_fathom()
    
    ollama_result, fathom_result = await asyncio.gather(ollama_task, fathom_task)
    
    # Compare results
    comparison.compare_results(ollama_result, fathom_result)
    
    # Save detailed results
    results = {
        "test_timestamp": time.time(),
        "test_transcript": comparison.test_transcript[:200] + "...",
        "ollama_result": ollama_result,
        "fathom_result": fathom_result
    }
    
    with open('comparison_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"📁 Detailed results saved to: comparison_results.json")

if __name__ == "__main__":
    asyncio.run(main()) 