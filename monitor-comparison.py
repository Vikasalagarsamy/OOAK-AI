#!/usr/bin/env python3
"""
Monitor the Model Comparison Test Progress
"""

import os
import time
import json
from datetime import datetime

def monitor_comparison():
    print("🔍 MONITORING MODEL COMPARISON TEST")
    print("=" * 50)
    print(f"⏰ Started monitoring at: {datetime.now().strftime('%H:%M:%S')}")
    print()
    
    # Check if process is running
    result = os.system("ps aux | grep -i 'model-comparison-test.py' | grep -v grep > /dev/null")
    
    if result == 0:
        print("✅ Comparison test is RUNNING")
        print("📊 What's happening:")
        print("   1. 📥 Downloading Fathom-R1-14B model (~14.8GB)")
        print("   2. 🧠 Loading model into memory")
        print("   3. 🧪 Testing Ollama on call transcripts")
        print("   4. 🧪 Testing Fathom-R1-14B on same transcripts")
        print("   5. 📊 Generating comparison report")
        print()
        print("⏱️  Expected completion time: 10-15 minutes")
        print("💾 Results will be saved to: model-comparison-results.json")
        print()
        
        # Show what we're testing
        print("🎯 TEST CASES:")
        print("   📋 Case 1: Sandhya's venue visit call (Tamil→English)")
        print("      - Real client conversation about photography services")
        print("      - Pricing discussion (5K mentioned)")
        print("      - Venue visits (Padmavathi Palace)")
        print("      - Follow-up scheduling")
        print()
        print("   📋 Case 2: Wedding inquiry call")
        print("      - Quote request for March wedding")
        print("      - Package inquiries")
        print("      - Traditional + candid photography needs")
        print()
        
        print("🏆 COMPARISON METRICS:")
        print("   ⏱️  Processing Speed")
        print("   🧠 Analysis Depth")
        print("   💼 Business Intelligence Quality")
        print("   🎯 Booking Probability Accuracy")
        print("   💰 Revenue Estimation")
        print("   🔍 Risk Assessment")
        print("   📈 Upsell Opportunity Identification")
        print()
        
    else:
        print("❌ Comparison test is NOT running")
        
        # Check if results exist
        if os.path.exists("model-comparison-results.json"):
            print("✅ Results file found! Let me show you the summary...")
            try:
                with open("model-comparison-results.json", 'r') as f:
                    results = json.load(f)
                
                print("\n📊 COMPARISON RESULTS SUMMARY:")
                print("=" * 40)
                
                for i, result in enumerate(results, 1):
                    comparison = result.get("comparison", {})
                    print(f"\n📋 Test Case {i}: {comparison.get('test_case', 'Unknown')}")
                    print("-" * 30)
                    
                    winner = comparison.get("winner", "Unknown")
                    reason = comparison.get("reason", "No reason provided")
                    
                    print(f"🏆 Winner: {winner}")
                    print(f"💡 Reason: {reason}")
                    
                    performance = comparison.get("performance", {})
                    if "ollama" in performance and "fathom" in performance:
                        ollama_time = performance["ollama"].get("processing_time", 0)
                        fathom_time = performance["fathom"].get("processing_time", 0)
                        print(f"⏱️  Ollama: {ollama_time:.2f}s")
                        print(f"⏱️  Fathom: {fathom_time:.2f}s")
                
                # Overall recommendation
                ollama_wins = sum(1 for r in results if r["comparison"]["winner"] == "Ollama")
                fathom_wins = sum(1 for r in results if r["comparison"]["winner"] == "Fathom-R1-14B")
                ties = sum(1 for r in results if r["comparison"]["winner"] == "Tie")
                
                print(f"\n🎯 OVERALL RESULTS:")
                print(f"   Ollama wins: {ollama_wins}")
                print(f"   Fathom-R1-14B wins: {fathom_wins}")
                print(f"   Ties: {ties}")
                
                if fathom_wins > ollama_wins:
                    print("\n✅ RECOMMENDATION: Integrate Fathom-R1-14B for enhanced business intelligence")
                elif ollama_wins > fathom_wins:
                    print("\n✅ RECOMMENDATION: Continue with Ollama for speed and efficiency")
                else:
                    print("\n⚖️  RECOMMENDATION: Consider hybrid approach based on use case")
                    
            except Exception as e:
                print(f"❌ Error reading results: {e}")
        else:
            print("⏳ No results file found yet. Test may still be running or failed.")
            print("💡 Try running the comparison test again:")
            print("   python scripts/model-comparison-test.py")
    
    print(f"\n⏰ Monitoring completed at: {datetime.now().strftime('%H:%M:%S')}")

if __name__ == "__main__":
    monitor_comparison() 