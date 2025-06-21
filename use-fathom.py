#!/usr/bin/env python3
"""
🧠 FATHOM-R1-14B DIRECT USAGE
Simple script to analyze calls with Fathom-R1-14B
"""

import asyncio
import sys
import os
import json

# Add services to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))

async def analyze_with_fathom(transcript, client_name, call_duration=None):
    """Analyze a call transcript using Fathom-R1-14B"""
    try:
        from fathom_r1_14b_service import FathomR1Service
        
        print("🧠 Starting Fathom-R1-14B Analysis...")
        print("=" * 50)
        
        service = FathomR1Service()
        
        # Load model
        print("📥 Loading Fathom-R1-14B model (may take a few minutes)...")
        success = await service.load_model()
        
        if not success:
            print("❌ Failed to load Fathom-R1-14B")
            return None
        
        print("✅ Model loaded successfully!")
        print(f"🔬 Analyzing call for: {client_name}")
        print("-" * 30)
        
        # Run analysis
        result = await service.analyze_call(
            transcript=transcript,
            client_name=client_name,
            call_duration=call_duration
        )
        
        if "error" in result:
            print(f"❌ Analysis failed: {result['error']}")
            return None
        
        return result
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you have installed: pip install transformers torch accelerate")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def display_analysis_results(analysis):
    """Display the analysis results in a readable format"""
    if not analysis:
        return
    
    print("\n📊 FATHOM-R1-14B ANALYSIS RESULTS")
    print("=" * 50)
    
    # Business Intelligence
    if "business_intelligence" in analysis:
        bi = analysis["business_intelligence"]
        print("💼 BUSINESS INTELLIGENCE:")
        print(f"   👤 Client Interest: {bi.get('client_interest_level', 'N/A')}/10")
        print(f"   🎯 Booking Probability: {bi.get('estimated_booking_probability', 'N/A')}%")
        print(f"   💰 Revenue Estimate: ₹{bi.get('potential_revenue', 'Unknown')}")
        print(f"   📋 Service Type: {bi.get('service_type', 'N/A')}")
        print(f"   ⏰ Decision Timeline: {bi.get('decision_timeline', 'N/A')}")
        print(f"   📊 Business Priority: {bi.get('business_priority', 'N/A')}")
        print()
    
    # Mathematical Analysis
    if "mathematical_analysis" in analysis:
        math_analysis = analysis["mathematical_analysis"]
        print("🧮 MATHEMATICAL ANALYSIS:")
        print(f"   📈 Revenue Calculation: {math_analysis.get('revenue_probability_calculation', 'N/A')}")
        print(f"   💵 Pricing Sensitivity: {math_analysis.get('pricing_sensitivity_score', 'N/A')}")
        print(f"   🏢 Market Position: {math_analysis.get('market_position_analysis', 'N/A')}")
        print()
    
    # Reasoning Chain
    if "reasoning_chain" in analysis and analysis["reasoning_chain"]:
        print("🧠 REASONING CHAIN:")
        for i, step in enumerate(analysis["reasoning_chain"], 1):
            print(f"   {i}. {step}")
        print()
    
    # Client Psychology
    if "client_psychology_profile" in analysis:
        psych = analysis["client_psychology_profile"]
        print("🎭 CLIENT PSYCHOLOGY PROFILE:")
        print(f"   🧠 Decision Style: {psych.get('decision_making_style', 'N/A')}")
        print(f"   💬 Communication: {psych.get('communication_patterns', 'N/A')}")
        print(f"   💰 Price Sensitivity: {psych.get('price_sensitivity', 'N/A')}")
        print(f"   ⏱️  Urgency Level: {psych.get('urgency_level', 'N/A')}")
        
        if psych.get('trust_indicators'):
            print(f"   ✅ Trust Indicators: {', '.join(psych['trust_indicators'])}")
        
        if psych.get('resistance_points'):
            print(f"   ⚠️  Resistance Points: {', '.join(psych['resistance_points'])}")
        print()
    
    # Risk Assessment
    if "risk_assessment" in analysis:
        risks = analysis["risk_assessment"]
        print("⚠️  RISK ASSESSMENT:")
        
        if risks.get('booking_risks'):
            print("   📋 Booking Risks:")
            for risk in risks['booking_risks']:
                print(f"      • {risk}")
        
        if risks.get('financial_risks'):
            print("   💰 Financial Risks:")
            for risk in risks['financial_risks']:
                print(f"      • {risk}")
        
        if risks.get('mitigation_strategies'):
            print("   🛡️  Mitigation Strategies:")
            for strategy in risks['mitigation_strategies']:
                print(f"      • {strategy}")
        print()
    
    # Revenue Optimization
    if "revenue_optimization" in analysis:
        rev_opt = analysis["revenue_optimization"]
        print("📈 REVENUE OPTIMIZATION:")
        
        if rev_opt.get('upsell_opportunities'):
            print("   💡 Upsell Opportunities:")
            for opp in rev_opt['upsell_opportunities']:
                print(f"      • {opp}")
        
        if rev_opt.get('pricing_recommendations'):
            pricing = rev_opt['pricing_recommendations']
            if pricing.get('base_package_estimate'):
                print(f"   💰 Base Package: ₹{pricing['base_package_estimate']}")
            
            if pricing.get('premium_additions'):
                print("   ⭐ Premium Additions:")
                for addition in pricing['premium_additions']:
                    print(f"      • {addition}")
        print()
    
    # Autonomous AI Insights
    if "autonomous_ai_insights" in analysis:
        ai_insights = analysis["autonomous_ai_insights"]
        print("🤖 AUTONOMOUS AI INSIGHTS:")
        
        if ai_insights.get('relationship_building_strategy'):
            print("   🤝 Relationship Strategy:")
            for strategy in ai_insights['relationship_building_strategy']:
                print(f"      • {strategy}")
        
        if ai_insights.get('follow_up_scheduling'):
            follow_up = ai_insights['follow_up_scheduling']
            print("   📞 Follow-up Plan:")
            print(f"      • Timing: {follow_up.get('optimal_timing', 'N/A')}")
            print(f"      • Channel: {follow_up.get('communication_channel', 'N/A')}")
            print(f"      • Tone: {follow_up.get('message_tone', 'N/A')}")
        
        if ai_insights.get('memory_points'):
            print("   🧠 Memory Points:")
            for point in ai_insights['memory_points']:
                print(f"      • {point}")
        print()
    
    # Performance Metadata
    if "processing_metadata" in analysis:
        meta = analysis["processing_metadata"]
        print("🔧 PROCESSING METADATA:")
        print(f"   ⏱️  Processing Time: {meta.get('processing_time', 'N/A')}s")
        print(f"   🎯 Confidence Score: {meta.get('confidence_score', 'N/A')}")
        print(f"   🔍 Reasoning Depth: {meta.get('reasoning_depth', 'N/A')}")
        print(f"   📅 Timestamp: {meta.get('timestamp', 'N/A')}")

async def main():
    print("🎯 FATHOM-R1-14B CALL ANALYZER")
    print("=" * 40)
    
    # Example with Sandhya's call
    print("Example: Analyzing Sandhya's venue visit call...")
    
    transcript = """Hello. Tell me Sridhar. Hi Sandhya. Good afternoon. Good afternoon. So, Sandhya, I checked. Sorry, I was late to go home. So, I couldn't take your call. I reached late at night. So, I didn't want to call you at late night. Okay. So, I discussed it with Sandhya. I told her to close by 1.30pm. 1.30pm? Yes. But, I can... 5K? Yes, 5K. I asked a lot for that. Okay. And... Okay. For me... But, I will give you less time in this. I can give you that as you want. In music? Yes. Okay. Okay. Okay. Hmm? Okay. This morning, I went to see Padmavathi. Okay. Padmavathi Palace. Padmavathi Palace. Yes. Yes. I just went and saw it. So, yes. I think it's okay. But... I have to check small halls. I saw that too. Okay. So, you have to check small halls. No. I have to check my stuff. Yes. My stuff... Pallavi. Okay. Sir, the one more thing... Sure. Yes? Okay. This evening, Samit has been doing the same thing that was happening. Sure. Okay. So, that's it? Yes. I have to check all the places that he did last evening. Okay. And I have to check Kashumbu. Okay. We don't have a lot of time. Okay. And then we will take it forward. Okay, Sandhya. So, can I call you in the evening? Yes, call me. Okay, Sandhya. Thank you very much. Hello."""
    
    result = await analyze_with_fathom(transcript, "Sandhya", 180)
    display_analysis_results(result)
    
    print("\n" + "="*50)
    print("🎉 Analysis Complete!")
    print("💡 To analyze your own transcript, modify the 'transcript' variable above")

if __name__ == "__main__":
    asyncio.run(main()) 