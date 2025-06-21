#!/usr/bin/env python3
"""
Test Whisper Large-v3 vs Base Model for Call Analytics
Compare translation quality and processing speed
"""

import time
from faster_whisper import WhisperModel
import warnings
warnings.filterwarnings("ignore")

def test_whisper_base():
    """Test current Faster-Whisper base model"""
    print("🔄 Testing Faster-Whisper BASE Model...")
    
    try:
        model = WhisperModel("base", device="cpu", compute_type="int8")
        audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
        
        start_time = time.time()
        segments, info = model.transcribe(audio_file, task="translate")
        end_time = time.time()
        
        english_text = " ".join(segment.text for segment in segments)
        
        print(f"✅ BASE Model Results:")
        print(f"   Detected Language: {info.language} ({info.language_probability:.1%})")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {english_text[:200]}...")
        print(f"   Character Count: {len(english_text)}")
        print(f"   Speed Factor: {info.duration / (end_time - start_time):.1f}x real-time")
        print()
        
        return {
            "model": "Base",
            "detected_language": info.language,
            "confidence": info.language_probability,
            "processing_time": end_time - start_time,
            "english_text": english_text,
            "character_count": len(english_text),
            "duration": info.duration,
            "speed_factor": info.duration / (end_time - start_time)
        }
        
    except Exception as e:
        print(f"❌ Base Model Error: {e}")
        return None

def test_whisper_large_v3():
    """Test Faster-Whisper large-v3 model"""
    print("🔄 Testing Faster-Whisper LARGE-V3 Model...")
    
    try:
        # Large-v3 model for best quality
        model = WhisperModel("large-v3", device="cpu", compute_type="int8")
        audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
        
        start_time = time.time()
        segments, info = model.transcribe(audio_file, task="translate")
        end_time = time.time()
        
        english_text = " ".join(segment.text for segment in segments)
        
        print(f"✅ LARGE-V3 Model Results:")
        print(f"   Detected Language: {info.language} ({info.language_probability:.1%})")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {english_text[:200]}...")
        print(f"   Character Count: {len(english_text)}")
        print(f"   Speed Factor: {info.duration / (end_time - start_time):.1f}x real-time")
        print()
        
        return {
            "model": "Large-v3",
            "detected_language": info.language,
            "confidence": info.language_probability,
            "processing_time": end_time - start_time,
            "english_text": english_text,
            "character_count": len(english_text),
            "duration": info.duration,
            "speed_factor": info.duration / (end_time - start_time)
        }
        
    except Exception as e:
        print(f"❌ Large-v3 Model Error: {e}")
        return None

def compare_models(base_result, large_result):
    """Compare the results from both models"""
    print("🔍 DETAILED COMPARISON:")
    print("=" * 60)
    
    if base_result and large_result:
        print(f"PERFORMANCE METRICS:")
        print(f"  Processing Time:")
        print(f"    Base Model:    {base_result['processing_time']:.1f}s")
        print(f"    Large-v3:      {large_result['processing_time']:.1f}s")
        print(f"    Time Difference: {large_result['processing_time'] - base_result['processing_time']:.1f}s slower")
        
        print(f"\n  Speed Factor (Real-time):")
        print(f"    Base Model:    {base_result['speed_factor']:.1f}x")
        print(f"    Large-v3:      {large_result['speed_factor']:.1f}x")
        
        print(f"\n  Language Detection:")
        print(f"    Base Model:    {base_result['confidence']:.1%} confidence")
        print(f"    Large-v3:      {large_result['confidence']:.1%} confidence")
        
        print(f"\n  Translation Length:")
        print(f"    Base Model:    {base_result['character_count']} characters")
        print(f"    Large-v3:      {large_result['character_count']} characters")
        
        print(f"\n📝 TRANSLATION QUALITY COMPARISON:")
        print(f"  Base Model Translation:")
        print(f"    \"{base_result['english_text'][:300]}...\"")
        print(f"\n  Large-v3 Translation:")
        print(f"    \"{large_result['english_text'][:300]}...\"")
        
        # Determine winner
        print(f"\n🏆 RECOMMENDATION:")
        if large_result['processing_time'] < 2.0:  # If large-v3 is still reasonably fast
            if large_result['confidence'] > base_result['confidence']:
                print(f"   ✅ Use Large-v3: Better accuracy ({large_result['confidence']:.1%} vs {base_result['confidence']:.1%}) and still fast ({large_result['processing_time']:.1f}s)")
            else:
                print(f"   ⚖️  Both models perform similarly. Large-v3 has better quality but is {large_result['processing_time'] - base_result['processing_time']:.1f}s slower.")
        else:
            print(f"   ⚡ Use Base Model: Large-v3 is {large_result['processing_time']:.1f}s which may be too slow for real-time call analytics")
            
    elif base_result:
        print("✅ Base Model worked successfully")
        print("❌ Large-v3 Model failed")
        print("🏆 Winner: Base Model (by default)")
        
    elif large_result:
        print("❌ Base Model failed")
        print("✅ Large-v3 Model worked successfully")
        print("🏆 Winner: Large-v3 Model (by default)")
        
    else:
        print("❌ Both models failed")

def main():
    print("🎯 WHISPER MODEL COMPARISON: BASE vs LARGE-V3")
    print("=" * 60)
    print("Testing Tamil audio → English translation for call analytics")
    print("Audio Duration: ~99.6 seconds")
    print()
    
    # Test both models
    base_result = test_whisper_base()
    large_result = test_whisper_large_v3()
    
    # Compare results
    compare_models(base_result, large_result)
    
    print(f"\n💡 FOR CALL ANALYTICS DECISION:")
    print(f"- If processing time < 2s: Large-v3 might be worth it for better quality")
    print(f"- If processing time > 3s: Base model is better for real-time processing")
    print(f"- Consider your call volume and latency requirements")

if __name__ == "__main__":
    main() 