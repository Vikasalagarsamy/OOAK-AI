#!/usr/bin/env python3
"""
🧠 FATHOM-R1-14B CALL ANALYTICS SERVICE
Advanced AI Model for Autonomous Photography Business Intelligence

This service provides sophisticated call analysis using Fathom-R1-14B's
mathematical reasoning capabilities for enhanced business intelligence.
"""

import torch
import json
import time
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from transformers import AutoModelForCausalLM, AutoTokenizer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.error("Transformers not available. Install with: pip install transformers torch accelerate")

class FathomR1Service:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.model_id = "FractalAIResearch/Fathom-R1-14B"
        self.is_loaded = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"🎯 Fathom-R1-14B Service initialized for device: {self.device}")

    async def load_model(self):
        """Load Fathom-R1-14B model for advanced call analytics"""
        if not TRANSFORMERS_AVAILABLE:
            raise Exception("Transformers library not available. Install with: pip install transformers torch accelerate")
        
        if self.is_loaded:
            logger.info("✅ Fathom-R1-14B already loaded")
            return True
            
        try:
            logger.info("🔄 Loading Fathom-R1-14B model...")
            logger.info("   📥 Loading tokenizer...")
            
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            logger.info("   🧠 Loading model (this may take several minutes)...")
            
            # Load with optimal settings for your Mac
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else "cpu",
                trust_remote_code=True,
                low_cpu_mem_usage=True,
            )
            
            self.is_loaded = True
            logger.info("✅ Fathom-R1-14B loaded successfully!")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load Fathom-R1-14B: {e}")
            return False

    async def analyze_call(self, 
                          transcript: str, 
                          client_name: str, 
                          call_duration: Optional[int] = None,
                          call_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Analyze call transcript using Fathom-R1-14B's advanced reasoning
        
        Args:
            transcript: The call transcript text
            client_name: Name of the client
            call_duration: Duration in seconds (optional)
            call_metadata: Additional metadata (optional)
            
        Returns:
            Comprehensive business intelligence analysis
        """
        
        if not self.is_loaded:
            await self.load_model()
            
        if not self.is_loaded:
            return {
                "error": "Fathom-R1-14B model not available",
                "fallback_recommendation": "Use Ollama service instead"
            }
            
        start_time = time.time()
        
        # Enhanced prompt for autonomous photography business
        prompt = f"""
You are Fathom-R1-14B, an advanced AI specializing in mathematical reasoning and business intelligence for autonomous photography services. Analyze this client call using step-by-step logical reasoning.

AUTONOMOUS PHOTOGRAPHY CONTEXT:
- Goal: Build AI that can autonomously manage client relationships
- Focus: Revenue optimization, risk assessment, and strategic planning
- Industry: Wedding/Event photography in India

CLIENT INFORMATION:
Name: {client_name}
Call Duration: {call_duration or 'Unknown'} seconds
Transcript: {transcript}

ANALYSIS REQUIREMENTS:
Provide comprehensive business intelligence using your mathematical reasoning capabilities. Think step-by-step and provide detailed analysis in JSON format:

{{
  "mathematical_analysis": {{
    "revenue_probability_calculation": "<step-by-step revenue estimation>",
    "pricing_sensitivity_score": <0-1 mathematical score>,
    "market_position_analysis": "<competitive positioning math>"
  }},
  "reasoning_chain": [
    "<step 1: initial assessment>",
    "<step 2: client motivation analysis>", 
    "<step 3: risk factor calculation>",
    "<step 4: opportunity identification>",
    "<step 5: strategic recommendation>"
  ],
  "client_psychology_profile": {{
    "decision_making_style": "<analytical/emotional/practical/social>",
    "communication_patterns": "<direct/indirect/detailed/brief>",
    "price_sensitivity": "<low/medium/high>",
    "urgency_level": "<immediate/moderate/flexible>",
    "trust_indicators": [<array of trust signals>],
    "resistance_points": [<array of potential objections>]
  }},
  "business_intelligence": {{
    "overall_sentiment": <-1.0 to 1.0>,
    "client_interest_level": <1-10>,
    "estimated_booking_probability": <0-100>,
    "potential_revenue": <INR amount or 0>,
    "service_type": "<wedding/engagement/portrait/commercial/other>",
    "decision_timeline": "<immediate/short/medium/long>",
    "business_priority": "<low/medium/high/critical>"
  }},
  "risk_assessment": {{
    "booking_risks": [<array of identified risks>],
    "financial_risks": [<payment/budget related risks>],
    "operational_risks": [<delivery/timeline risks>],
    "mitigation_strategies": [<specific risk mitigation steps>]
  }},
  "revenue_optimization": {{
    "upsell_opportunities": [<additional services to offer>],
    "pricing_recommendations": {{
      "base_package_estimate": <INR amount>,
      "premium_additions": [<list with prices>],
      "discount_strategy": "<if applicable>"
    }},
    "revenue_maximization_tactics": [<specific strategies>]
  }},
  "autonomous_ai_insights": {{
    "relationship_building_strategy": [<long-term client management>],
    "communication_preferences": [<how AI should interact>],
    "follow_up_scheduling": {{
      "optimal_timing": "<when to follow up>",
      "communication_channel": "<call/email/whatsapp>",
      "message_tone": "<formal/casual/professional>"
    }},
    "memory_points": [<key information for AI to remember>]
  }},
  "competitive_advantages": [<strengths to leverage>],
  "strategic_recommendations": [<specific action items>],
  "processing_metadata": {{
    "model": "Fathom-R1-14B",
    "processing_time": <seconds>,
    "confidence_score": <0-1>,
    "reasoning_depth": "<shallow/moderate/deep/comprehensive>"
  }}
}}

Apply your mathematical reasoning to provide the most sophisticated business intelligence possible for autonomous photography operations."""

        try:
            # Tokenize input with proper handling
            inputs = self.tokenizer(
                prompt, 
                return_tensors="pt", 
                truncation=True, 
                max_length=8192,
                padding=True
            )
            
            # Move to appropriate device
            if torch.cuda.is_available():
                inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            
            logger.info(f"🧠 Processing call analysis for {client_name}...")
            
            # Generate response with optimal settings
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=3072,  # Increased for comprehensive analysis
                    temperature=0.1,      # Low temperature for consistent business analysis
                    do_sample=True,
                    top_p=0.9,
                    top_k=40,
                    repetition_penalty=1.1,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode response
            response_text = self.tokenizer.decode(
                outputs[0][inputs['input_ids'].shape[1]:], 
                skip_special_tokens=True
            )
            
            processing_time = time.time() - start_time
            
            # Parse JSON response
            try:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                
                if json_start != -1 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    analysis = json.loads(json_str)
                    
                    # Add metadata
                    analysis['processing_metadata']['processing_time'] = processing_time
                    analysis['processing_metadata']['timestamp'] = datetime.now().isoformat()
                    analysis['processing_metadata']['client_name'] = client_name
                    
                    logger.info(f"✅ Analysis completed for {client_name} in {processing_time:.2f}s")
                    return analysis
                    
                else:
                    logger.error("No valid JSON found in response")
                    return {
                        "error": "Failed to parse JSON response",
                        "raw_response": response_text[:1000],
                        "processing_time": processing_time,
                        "model": "Fathom-R1-14B"
                    }
                    
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {e}")
                return {
                    "error": f"JSON parsing failed: {e}",
                    "raw_response": response_text[:1000],
                    "processing_time": processing_time,
                    "model": "Fathom-R1-14B"
                }
                
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Analysis error: {e}")
            return {
                "error": str(e),
                "processing_time": processing_time,
                "model": "Fathom-R1-14B"
            }

    async def batch_analyze(self, call_records: List[Dict]) -> List[Dict]:
        """Analyze multiple calls in batch for efficiency"""
        results = []
        
        for i, record in enumerate(call_records, 1):
            logger.info(f"📋 Processing call {i}/{len(call_records)}: {record.get('client_name', 'Unknown')}")
            
            analysis = await self.analyze_call(
                transcript=record.get('transcript', ''),
                client_name=record.get('client_name', 'Unknown'),
                call_duration=record.get('call_duration'),
                call_metadata=record.get('metadata', {})
            )
            
            results.append({
                'original_record': record,
                'fathom_analysis': analysis
            })
            
        return results

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "model_id": self.model_id,
            "is_loaded": self.is_loaded,
            "device": self.device,
            "capabilities": [
                "Mathematical reasoning",
                "Step-by-step analysis",
                "Advanced business intelligence",
                "Risk assessment",
                "Revenue optimization",
                "Client psychology profiling",
                "Autonomous AI insights"
            ],
            "use_cases": [
                "Autonomous photography business",
                "Client relationship management",
                "Revenue optimization",
                "Strategic planning",
                "Risk assessment"
            ]
        }

# Global service instance
fathom_service = FathomR1Service()

async def analyze_call_with_fathom(transcript: str, client_name: str, **kwargs) -> Dict[str, Any]:
    """Convenience function for call analysis"""
    return await fathom_service.analyze_call(transcript, client_name, **kwargs)

async def main():
    """Test the Fathom-R1-14B service"""
    print("🧠 FATHOM-R1-14B SERVICE TEST")
    print("=" * 50)
    
    # Test with Sandhya's call
    test_transcript = """Hello. Tell me Sridhar. Hi Sandhya. Good afternoon. Good afternoon. So, Sandhya, I checked. Sorry, I was late to go home. So, I couldn't take your call. I reached late at night. So, I didn't want to call you at late night. Okay. So, I discussed it with Sandhya. I told her to close by 1.30pm. 1.30pm? Yes. But, I can... 5K? Yes, 5K. I asked a lot for that. Okay. And... Okay. For me... But, I will give you less time in this. I can give you that as you want. In music? Yes. Okay. Okay. Okay. Hmm? Okay. This morning, I went to see Padmavathi. Okay. Padmavathi Palace. Padmavathi Palace. Yes. Yes. I just went and saw it. So, yes. I think it's okay. But... I have to check small halls. I saw that too. Okay. So, you have to check small halls. No. I have to check my stuff. Yes. My stuff... Pallavi. Okay. Sir, the one more thing... Sure. Yes? Okay. This evening, Samit has been doing the same thing that was happening. Sure. Okay. So, that's it? Yes. I have to check all the places that he did last evening. Okay. And I have to check Kashumbu. Okay. We don't have a lot of time. Okay. And then we will take it forward. Okay, Sandhya. So, can I call you in the evening? Yes, call me. Okay, Sandhya. Thank you very much. Hello."""
    
    analysis = await analyze_call_with_fathom(test_transcript, "Sandhya", call_duration=180)
    
    print("📊 FATHOM-R1-14B ANALYSIS RESULTS:")
    print(json.dumps(analysis, indent=2))

if __name__ == "__main__":
    asyncio.run(main()) 