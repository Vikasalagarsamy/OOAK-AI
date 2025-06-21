#!/usr/bin/env python3
"""
🎯 AUTONOMOUS PHOTOGRAPHY COMPANY - MODEL COMPARISON
Comparing Ollama vs Fathom-R1-14B for Call Analytics

This script tests both models on existing call transcripts to determine
which provides better business intelligence for autonomous photography operations.
"""

import json
import time
import asyncio
import aiohttp
from typing import Dict, List, Any
import sys
import os
from datetime import datetime

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠️  transformers not installed. Installing...")

class ModelComparison:
    def __init__(self):
        self.ollama_url = "http://localhost:11434"
        self.test_results = []
        self.fathom_model = None
        self.fathom_tokenizer = None
        
        # Test call transcripts (existing ones from your database)
        self.test_transcripts = [
            {
                "client_name": "Sandhya",
                "transcript": """Hello. Tell me Sridhar. Hi Sandhya. Good afternoon. Good afternoon. So, Sandhya, I checked. Sorry, I was late to go home. So, I couldn't take your call. I reached late at night. So, I didn't want to call you at late night. Okay. So, I discussed it with Sandhya. I told her to close by 1.30pm. 1.30pm? Yes. But, I can... 5K? Yes, 5K. I asked a lot for that. Okay. And... Okay. For me... But, I will give you less time in this. I can give you that as you want. In music? Yes. Okay. Okay. Okay. Hmm? Okay. This morning, I went to see Padmavathi. Okay. Padmavathi Palace. Padmavathi Palace. Yes. Yes. I just went and saw it. So, yes. I think it's okay. But... I have to check small halls. I saw that too. Okay. So, you have to check small halls. No. I have to check my stuff. Yes. My stuff... Pallavi. Okay. Sir, the one more thing... Sure. Yes? Okay. This evening, Samit has been doing the same thing that was happening. Sure. Okay. So, that's it? Yes. I have to check all the places that he did last evening. Okay. And I have to check Kashumbu. Okay. We don't have a lot of time. Okay. And then we will take it forward. Okay, Sandhya. So, can I call you in the evening? Yes, call me. Okay, Sandhya. Thank you very much. Hello.""",
                "expected_insights": ["venue_visit", "pricing_discussion", "follow_up_scheduled"]
            },
            {
                "client_name": "Test Client",  
                "transcript": """Hello, I am interested in wedding photography services. Can you provide a quote? I'm planning a wedding for next March and need someone who can capture both traditional and candid moments. What packages do you offer and what are the rates?""",
                "expected_insights": ["quote_request", "wedding_photography", "package_inquiry"]
            }
        ]

    async def setup_fathom_model(self):
        """Setup Fathom-R1-14B model using Hugging Face transformers"""
        if not TRANSFORMERS_AVAILABLE:
            print("❌ Transformers not available. Please install: pip install transformers torch")
            return False
            
        try:
            print("🔄 Loading Fathom-R1-14B model...")
            model_id = "FractalAIResearch/Fathom-R1-14B"
            
            print("   📥 Loading tokenizer...")
            self.fathom_tokenizer = AutoTokenizer.from_pretrained(model_id)
            
            print("   🧠 Loading model (this may take several minutes)...")
            self.fathom_model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else "cpu",
                trust_remote_code=True
            )
            
            print("✅ Fathom-R1-14B loaded successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Failed to load Fathom-R1-14B: {e}")
            return False

    async def analyze_with_ollama(self, transcript: str, client_name: str) -> Dict[str, Any]:
        """Analyze transcript using Ollama (current system)"""
        start_time = time.time()
        
        prompt = f"""
You are an expert call analytics AI for an autonomous photography business. Analyze this client conversation and provide detailed business intelligence.

CLIENT: {client_name}
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

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": "llama3.1:8b",
                        "prompt": prompt,
                        "stream": False
                    }
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        processing_time = time.time() - start_time
                        
                        # Try to parse JSON from response
                        response_text = result.get('response', '')
                        try:
                            # Extract JSON from response
                            json_start = response_text.find('{')
                            json_end = response_text.rfind('}') + 1
                            if json_start != -1 and json_end != 0:
                                json_str = response_text[json_start:json_end]
                                analysis = json.loads(json_str)
                                analysis['processing_time'] = processing_time
                                analysis['model'] = 'Ollama (llama3.2)'
                                return analysis
                            else:
                                raise ValueError("No JSON found in response")
                        except json.JSONDecodeError as e:
                            print(f"❌ JSON parsing error for Ollama: {e}")
                            return {
                                "error": "JSON parsing failed",
                                "raw_response": response_text,
                                "processing_time": processing_time,
                                "model": "Ollama (llama3.2)"
                            }
                    else:
                        return {
                            "error": f"HTTP {response.status}",
                            "processing_time": time.time() - start_time,
                            "model": "Ollama (llama3.2)"
                        }
                        
        except Exception as e:
            return {
                "error": str(e),
                "processing_time": time.time() - start_time,
                "model": "Ollama (llama3.2)"
            }

    async def analyze_with_fathom(self, transcript: str, client_name: str) -> Dict[str, Any]:
        """Analyze transcript using Fathom-R1-14B"""
        if not self.fathom_model or not self.fathom_tokenizer:
            return {
                "error": "Fathom model not loaded",
                "model": "Fathom-R1-14B"
            }
            
        start_time = time.time()
        
        prompt = f"""
You are an expert business intelligence AI specializing in photography services. Analyze this client call transcript using advanced reasoning to provide comprehensive business insights.

CLIENT: {client_name}
CALL TRANSCRIPT: {transcript}

Using step-by-step reasoning, analyze this conversation and provide detailed business intelligence in JSON format:

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
  "key_insights": [<array of detailed business insights>],
  "recommended_actions": [<array of specific strategic actions>],
  "estimated_booking_probability": <number 0-100>,
  "service_type": "<wedding/engagement/portrait/commercial/other>",
  "pricing_sensitivity": "<low/medium/high>",
  "decision_timeline": "<immediate/short/medium/long>",
  "potential_revenue": <estimated value in rupees or 0>,
  "reasoning_chain": [<array showing step-by-step analysis>],
  "competitive_advantages": [<identified strengths to leverage>],
  "risk_factors": [<potential challenges or concerns>],
  "upsell_opportunities": [<additional services to propose>],
  "client_personality_profile": "<analytical description>"
}}

Provide thorough reasoning and respond with ONLY the JSON."""

        try:
            # Tokenize input
            inputs = self.fathom_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=8192)
            
            # Move to appropriate device
            if torch.cuda.is_available():
                inputs = {k: v.to(self.fathom_model.device) for k, v in inputs.items()}
            
            # Generate response
            with torch.no_grad():
                outputs = self.fathom_model.generate(
                    **inputs,
                    max_new_tokens=2048,
                    temperature=0.1,
                    do_sample=True,
                    top_p=0.9,
                    pad_token_id=self.fathom_tokenizer.eos_token_id
                )
            
            # Decode response
            response_text = self.fathom_tokenizer.decode(
                outputs[0][inputs['input_ids'].shape[1]:], 
                skip_special_tokens=True
            )
            
            processing_time = time.time() - start_time
            
            # Try to parse JSON from response
            try:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = response_text[json_start:json_end]
                    analysis = json.loads(json_str)
                    analysis['processing_time'] = processing_time
                    analysis['model'] = 'Fathom-R1-14B'
                    return analysis
                else:
                    raise ValueError("No JSON found in response")
                    
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error for Fathom: {e}")
                return {
                    "error": "JSON parsing failed",
                    "raw_response": response_text,
                    "processing_time": processing_time,
                    "model": "Fathom-R1-14B"
                }
                
        except Exception as e:
            return {
                "error": str(e),
                "processing_time": time.time() - start_time,
                "model": "Fathom-R1-14B"
            }

    def compare_results(self, ollama_result: Dict, fathom_result: Dict, test_case: Dict) -> Dict:
        """Compare the results from both models"""
        comparison = {
            "test_case": test_case["client_name"],
            "timestamp": datetime.now().isoformat(),
            "models_compared": ["Ollama (llama3.2)", "Fathom-R1-14B"],
            "performance": {
                "ollama": {
                    "processing_time": ollama_result.get("processing_time", 0),
                    "success": "error" not in ollama_result,
                    "error": ollama_result.get("error")
                },
                "fathom": {
                    "processing_time": fathom_result.get("processing_time", 0),
                    "success": "error" not in fathom_result,
                    "error": fathom_result.get("error")
                }
            },
            "analysis_comparison": {},
            "quality_assessment": {},
            "winner": None
        }
        
        # Compare specific metrics if both succeeded
        if comparison["performance"]["ollama"]["success"] and comparison["performance"]["fathom"]["success"]:
            metrics_to_compare = [
                "overall_sentiment", "client_interest_level", "estimated_booking_probability",
                "agent_professionalism", "business_priority", "potential_revenue"
            ]
            
            for metric in metrics_to_compare:
                comparison["analysis_comparison"][metric] = {
                    "ollama": ollama_result.get(metric, "N/A"),
                    "fathom": fathom_result.get(metric, "N/A")
                }
            
            # Assess which model provided more comprehensive analysis
            ollama_insights = len(ollama_result.get("key_insights", []))
            fathom_insights = len(fathom_result.get("key_insights", []))
            
            fathom_extras = len(fathom_result.get("reasoning_chain", [])) + \
                           len(fathom_result.get("competitive_advantages", [])) + \
                           len(fathom_result.get("risk_factors", []))
            
            comparison["quality_assessment"] = {
                "ollama_insights_count": ollama_insights,
                "fathom_insights_count": fathom_insights,
                "fathom_additional_features": fathom_extras,
                "ollama_processing_speed": ollama_result.get("processing_time", 0),
                "fathom_processing_speed": fathom_result.get("processing_time", 0)
            }
            
            # Determine winner based on comprehensive analysis
            fathom_score = fathom_insights + (fathom_extras * 0.5)
            ollama_score = ollama_insights
            
            if fathom_score > ollama_score * 1.2:  # 20% threshold
                comparison["winner"] = "Fathom-R1-14B"
                comparison["reason"] = "More comprehensive analysis and reasoning"
            elif ollama_score > fathom_score and ollama_result.get("processing_time", 0) < fathom_result.get("processing_time", 0):
                comparison["winner"] = "Ollama"
                comparison["reason"] = "Faster processing with comparable insights"
            else:
                comparison["winner"] = "Tie"
                comparison["reason"] = "Similar performance levels"
        
        return comparison

    async def run_comparison_test(self):
        """Run the full comparison test"""
        print("🎯 AUTONOMOUS PHOTOGRAPHY COMPANY - MODEL COMPARISON TEST")
        print("=" * 80)
        print("Testing Ollama vs Fathom-R1-14B for Call Analytics\n")
        
        # Setup Fathom model
        fathom_available = await self.setup_fathom_model()
        
        if not fathom_available:
            print("❌ Cannot proceed without Fathom-R1-14B. Please install transformers:")
            print("   pip install transformers torch")
            return
        
        print("🧪 Running comparison tests...\n")
        
        for i, test_case in enumerate(self.test_transcripts, 1):
            print(f"📋 Test Case {i}: {test_case['client_name']}")
            print("-" * 50)
            
            # Test with Ollama
            print("   🔄 Testing with Ollama...")
            ollama_result = await self.analyze_with_ollama(
                test_case["transcript"], 
                test_case["client_name"]
            )
            
            # Test with Fathom
            print("   🔄 Testing with Fathom-R1-14B...")
            fathom_result = await self.analyze_with_fathom(
                test_case["transcript"],
                test_case["client_name"]
            )
            
            # Compare results
            comparison = self.compare_results(ollama_result, fathom_result, test_case)
            self.test_results.append({
                "test_case": test_case,
                "ollama_result": ollama_result,
                "fathom_result": fathom_result,
                "comparison": comparison
            })
            
            # Print immediate results
            print(f"   ✅ Ollama: {comparison['performance']['ollama']['processing_time']:.2f}s")
            print(f"   ✅ Fathom: {comparison['performance']['fathom']['processing_time']:.2f}s")
            print(f"   🏆 Winner: {comparison['winner']}")
            print(f"   💡 Reason: {comparison.get('reason', 'N/A')}")
            print()
        
        # Generate final report
        await self.generate_report()

    async def generate_report(self):
        """Generate comprehensive comparison report"""
        print("📊 FINAL COMPARISON REPORT")
        print("=" * 80)
        
        # Overall statistics
        ollama_wins = sum(1 for r in self.test_results if r["comparison"]["winner"] == "Ollama")
        fathom_wins = sum(1 for r in self.test_results if r["comparison"]["winner"] == "Fathom-R1-14B")
        ties = sum(1 for r in self.test_results if r["comparison"]["winner"] == "Tie")
        
        print(f"🏆 OVERALL RESULTS:")
        print(f"   Ollama wins: {ollama_wins}")
        print(f"   Fathom-R1-14B wins: {fathom_wins}")
        print(f"   Ties: {ties}")
        print()
        
        # Performance metrics
        avg_ollama_time = sum(r["ollama_result"].get("processing_time", 0) for r in self.test_results) / len(self.test_results)
        avg_fathom_time = sum(r["fathom_result"].get("processing_time", 0) for r in self.test_results) / len(self.test_results)
        
        print(f"⏱️  PERFORMANCE:")
        print(f"   Average Ollama processing time: {avg_ollama_time:.2f}s")
        print(f"   Average Fathom processing time: {avg_fathom_time:.2f}s")
        print(f"   Speed advantage: {('Ollama' if avg_ollama_time < avg_fathom_time else 'Fathom-R1-14B')}")
        print()
        
        # Detailed analysis for each test case
        for i, result in enumerate(self.test_results, 1):
            print(f"📋 DETAILED RESULTS - Test Case {i}: {result['test_case']['client_name']}")
            print("-" * 60)
            
            if "error" not in result["ollama_result"]:
                print("🔹 OLLAMA ANALYSIS:")
                print(f"   Client Interest: {result['ollama_result'].get('client_interest_level', 'N/A')}/10")
                print(f"   Booking Probability: {result['ollama_result'].get('estimated_booking_probability', 'N/A')}%")
                print(f"   Business Priority: {result['ollama_result'].get('business_priority', 'N/A')}")
                print(f"   Key Insights: {len(result['ollama_result'].get('key_insights', []))}")
            else:
                print(f"🔹 OLLAMA ANALYSIS: ERROR - {result['ollama_result']['error']}")
            
            print()
            
            if "error" not in result["fathom_result"]:
                print("🔸 FATHOM-R1-14B ANALYSIS:")
                print(f"   Client Interest: {result['fathom_result'].get('client_interest_level', 'N/A')}/10")
                print(f"   Booking Probability: {result['fathom_result'].get('estimated_booking_probability', 'N/A')}%")
                print(f"   Business Priority: {result['fathom_result'].get('business_priority', 'N/A')}")
                print(f"   Key Insights: {len(result['fathom_result'].get('key_insights', []))}")
                print(f"   Reasoning Chain: {len(result['fathom_result'].get('reasoning_chain', []))}")
                print(f"   Risk Factors: {len(result['fathom_result'].get('risk_factors', []))}")
                print(f"   Upsell Opportunities: {len(result['fathom_result'].get('upsell_opportunities', []))}")
            else:
                print(f"🔸 FATHOM-R1-14B ANALYSIS: ERROR - {result['fathom_result']['error']}")
            
            print()
        
        # Recommendation
        print("🎯 RECOMMENDATION FOR AUTONOMOUS PHOTOGRAPHY BUSINESS:")
        print("-" * 60)
        
        if fathom_wins > ollama_wins:
            print("✅ RECOMMENDED: Integrate Fathom-R1-14B")
            print("   - Provides more comprehensive business intelligence")
            print("   - Better reasoning capabilities for autonomous operations")
            print("   - Enhanced insights for client relationship management")
        elif ollama_wins > fathom_wins:
            print("✅ RECOMMENDED: Continue with Ollama")
            print("   - Faster processing for real-time analytics")
            print("   - Sufficient insights for current needs")
            print("   - Lower computational requirements")
        else:
            print("⚖️  RECOMMENDATION: Hybrid Approach")
            print("   - Use Ollama for real-time processing")
            print("   - Use Fathom-R1-14B for detailed strategic analysis")
            print("   - Implement both based on use case requirements")
        
        # Save detailed results
        with open('model-comparison-results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: model-comparison-results.json")

async def main():
    comparison = ModelComparison()
    await comparison.run_comparison_test()

if __name__ == "__main__":
    asyncio.run(main()) 