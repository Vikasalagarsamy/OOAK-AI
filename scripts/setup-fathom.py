#!/usr/bin/env python3
"""
🧠 FATHOM-R1-14B SETUP SCRIPT
Setup and configuration for autonomous photography business
"""

import asyncio
import sys
import os
import json
import argparse
from datetime import datetime

# Add services directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

try:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from services.fathom_r1_14b_service import FathomR1Service, analyze_call_with_fathom
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the IMPORTANT directory and have installed dependencies:")
    print("   pip install transformers torch accelerate")
    sys.exit(1)

class FathomSetup:
    def __init__(self):
        self.service = FathomR1Service()
        
    async def setup_and_test(self):
        """Complete setup and testing of Fathom-R1-14B"""
        print("🎯 FATHOM-R1-14B SETUP FOR AUTONOMOUS PHOTOGRAPHY")
        print("=" * 60)
        print()
        
        # Step 1: Check dependencies
        print("📋 Step 1: Checking dependencies...")
        if not self.check_dependencies():
            return False
        print("✅ All dependencies available")
        print()
        
        # Step 2: Load model
        print("📋 Step 2: Loading Fathom-R1-14B model...")
        success = await self.service.load_model()
        if not success:
            print("❌ Failed to load Fathom-R1-14B model")
            return False
        print("✅ Fathom-R1-14B loaded successfully!")
        print()
        
        # Step 3: Run test analysis
        print("📋 Step 3: Running test analysis...")
        await self.run_test_analysis()
        print()
        
        # Step 4: Performance benchmark
        print("📋 Step 4: Performance benchmarking...")
        await self.run_performance_test()
        print()
        
        # Step 5: Show model capabilities
        print("📋 Step 5: Model capabilities summary...")
        self.show_capabilities()
        print()
        
        print("🎉 FATHOM-R1-14B SETUP COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        return True
    
    def check_dependencies(self):
        """Check if all required dependencies are available"""
        try:
            import torch
            import transformers
            import accelerate
            return True
        except ImportError as e:
            print(f"❌ Missing dependency: {e}")
            print("Install with: pip install transformers torch accelerate")
            return False
    
    async def run_test_analysis(self):
        """Run a test analysis on sample call data"""
        print("   🧪 Testing with Sandhya's venue visit call...")
        
        test_transcript = """Hello. Tell me Sridhar. Hi Sandhya. Good afternoon. Good afternoon. So, Sandhya, I checked. Sorry, I was late to go home. So, I couldn't take your call. I reached late at night. So, I didn't want to call you at late night. Okay. So, I discussed it with Sandhya. I told her to close by 1.30pm. 1.30pm? Yes. But, I can... 5K? Yes, 5K. I asked a lot for that. Okay. And... Okay. For me... But, I will give you less time in this. I can give you that as you want. In music? Yes. Okay. Okay. Okay. Hmm? Okay. This morning, I went to see Padmavathi. Okay. Padmavathi Palace. Padmavathi Palace. Yes. Yes. I just went and saw it. So, yes. I think it's okay. But... I have to check small halls. I saw that too. Okay. So, you have to check small halls. No. I have to check my stuff. Yes. My stuff... Pallavi. Okay. Sir, the one more thing... Sure. Yes? Okay. This evening, Samit has been doing the same thing that was happening. Sure. Okay. So, that's it? Yes. I have to check all the places that he did last evening. Okay. And I have to check Kashumbu. Okay. We don't have a lot of time. Okay. And then we will take it forward. Okay, Sandhya. So, can I call you in the evening? Yes, call me. Okay, Sandhya. Thank you very much. Hello."""
        
        analysis = await self.service.analyze_call(
            transcript=test_transcript,
            client_name="Sandhya",
            call_duration=180
        )
        
        if "error" in analysis:
            print(f"   ❌ Test failed: {analysis['error']}")
            return False
        
        print("   ✅ Test analysis completed successfully!")
        
        # Show key results
        if analysis.get("business_intelligence"):
            bi = analysis["business_intelligence"]
            print(f"   📊 Client Interest: {bi.get('client_interest_level', 'N/A')}/10")
            print(f"   🎯 Booking Probability: {bi.get('estimated_booking_probability', 'N/A')}%")
            print(f"   💰 Revenue Estimate: ₹{bi.get('potential_revenue', 'Unknown')}")
            print(f"   📋 Business Priority: {bi.get('business_priority', 'N/A')}")
        
        if analysis.get("reasoning_chain"):
            print(f"   🧠 Reasoning Steps: {len(analysis['reasoning_chain'])} steps")
        
        if analysis.get("risk_assessment"):
            risks = analysis["risk_assessment"]
            total_risks = len(risks.get("booking_risks", [])) + len(risks.get("financial_risks", [])) + len(risks.get("operational_risks", []))
            print(f"   ⚠️  Risk Factors Identified: {total_risks}")
        
        if analysis.get("revenue_optimization"):
            upsells = len(analysis["revenue_optimization"].get("upsell_opportunities", []))
            print(f"   📈 Upsell Opportunities: {upsells}")
        
        return True
    
    async def run_performance_test(self):
        """Test performance characteristics"""
        print("   ⏱️  Testing processing speed...")
        
        test_cases = [
            ("Quick call", "Hello, I need photography for my wedding next month. What are your packages?"),
            ("Medium call", "Hi, I'm calling about wedding photography. We're planning for March. I need someone who can do traditional and candid shots. What packages do you have and what are the rates? I'm looking for something comprehensive."),
            ("Long call", "Hello. Tell me Sridhar. Hi Sandhya. Good afternoon. So, Sandhya, I checked. Sorry, I was late to go home. So, I couldn't take your call. I reached late at night. So, I didn't want to call you at late night. Okay. So, I discussed it with Sandhya. I told her to close by 1.30pm. 1.30pm? Yes. But, I can... 5K? Yes, 5K. I asked a lot for that. Okay.")
        ]
        
        total_time = 0
        successful_tests = 0
        
        for test_name, transcript in test_cases:
            print(f"      Testing {test_name}...")
            start_time = asyncio.get_event_loop().time()
            
            result = await self.service.analyze_call(transcript, "Test Client")
            
            end_time = asyncio.get_event_loop().time()
            processing_time = end_time - start_time
            
            if "error" not in result:
                print(f"      ✅ {test_name}: {processing_time:.2f}s")
                total_time += processing_time
                successful_tests += 1
            else:
                print(f"      ❌ {test_name}: Failed")
        
        if successful_tests > 0:
            avg_time = total_time / successful_tests
            print(f"   📊 Average processing time: {avg_time:.2f}s")
            
            if avg_time < 30:
                print("   🚀 Excellent performance!")
            elif avg_time < 60:
                print("   ✅ Good performance!")
            else:
                print("   ⚠️  Performance acceptable but could be optimized")
    
    def show_capabilities(self):
        """Display Fathom-R1-14B capabilities"""
        info = self.service.get_model_info()
        
        print("   🎯 FATHOM-R1-14B CAPABILITIES:")
        print("   " + "-" * 40)
        
        print("   🧠 Core Capabilities:")
        for capability in info["capabilities"]:
            print(f"      • {capability}")
        print()
        
        print("   📋 Use Cases for Autonomous Photography:")
        for use_case in info["use_cases"]:
            print(f"      • {use_case}")
        print()
        
        print("   🔧 Technical Specifications:")
        print(f"      • Model: {info['model_id']}")
        print(f"      • Device: {info['device']}")
        print(f"      • Status: {'✅ Loaded' if info['is_loaded'] else '❌ Not Loaded'}")
        print()
        
        print("   🎯 Advantages for Autonomous Business:")
        advantages = [
            "Mathematical reasoning for revenue optimization",
            "Step-by-step logical analysis chains",
            "Advanced client psychology profiling",
            "Comprehensive risk assessment",
            "Strategic business intelligence",
            "Autonomous AI interaction planning"
        ]
        
        for advantage in advantages:
            print(f"      • {advantage}")

async def main():
    parser = argparse.ArgumentParser(description="Setup Fathom-R1-14B for autonomous photography business")
    parser.add_argument("--test-only", action="store_true", help="Run test analysis only")
    parser.add_argument("--benchmark", action="store_true", help="Run performance benchmark only")
    parser.add_argument("--transcript", type=str, help="Test with custom transcript")
    parser.add_argument("--client-name", type=str, default="Test Client", help="Client name for custom test")
    
    args = parser.parse_args()
    
    setup = FathomSetup()
    
    if args.test_only or args.transcript:
        # Load model first
        print("🔄 Loading Fathom-R1-14B...")
        await setup.service.load_model()
        
        if args.transcript:
            print(f"🧪 Testing with custom transcript for {args.client_name}...")
            result = await setup.service.analyze_call(args.transcript, args.client_name)
            print("\n📊 ANALYSIS RESULTS:")
            print(json.dumps(result, indent=2))
        else:
            await setup.run_test_analysis()
    
    elif args.benchmark:
        print("🔄 Loading Fathom-R1-14B for benchmarking...")
        await setup.service.load_model()
        await setup.run_performance_test()
    
    else:
        # Full setup
        await setup.setup_and_test()

if __name__ == "__main__":
    asyncio.run(main()) 