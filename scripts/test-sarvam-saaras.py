#!/usr/bin/env python3
"""
Test Sarvam's Saaras ASR-Translate Model vs Faster-Whisper
Saaras: Indian languages -> English translation (exactly what we need!)
"""

import time
import json
import requests
from faster_whisper import WhisperModel
import warnings
warnings.filterwarnings("ignore")

def test_current_faster_whisper():
    """Test our current working Faster-Whisper translation setup"""
    print("🔄 Testing Current Faster-Whisper Translation...")
    
    try:
        model = WhisperModel("base", device="cpu", compute_type="int8")
        audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
        
        start_time = time.time()
        segments, info = model.transcribe(audio_file, task="translate")
        end_time = time.time()
        
        english_text = " ".join(segment.text for segment in segments)
        
        print(f"✅ Faster-Whisper Results:")
        print(f"   Detected Language: {info.language} ({info.language_probability:.1%})")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {english_text}")
        print(f"   Character Count: {len(english_text)}")
        print()
        
        return {
            "model": "Faster-Whisper",
            "detected_language": info.language,
            "confidence": info.language_probability,
            "processing_time": end_time - start_time,
            "english_text": english_text,
            "character_count": len(english_text)
        }
        
    except Exception as e:
        print(f"❌ Faster-Whisper Error: {e}")
        return None

def test_sarvam_saaras(api_key):
    """Test Sarvam's Saaras ASR-Translate model"""
    print("🔄 Testing Sarvam Saaras ASR-Translate Model...")
    
    if not api_key:
        print("❌ Sarvam API key required. Get one from: https://platform.sarvam.ai/")
        return None
    
    try:
        # Sarvam ASR-Translate API endpoint (correct format from docs)
        url = "https://api.sarvam.ai/speech-to-text-translate"
        
        headers = {
            "api-subscription-key": api_key  # Correct header format
        }
        
        # Audio file path
        audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
        
        # Data payload for the request (multipart form)
        data = {
            "model": "saaras:v2.5",  # Latest Saaras model
            "prompt": "This is a business call about funding and project discussions"  # Context for better accuracy
        }
        
        # Prepare files for multipart upload
        with open(audio_file, 'rb') as f:
            files = {
                'file': ('audio.mp3', f, 'audio/mp3')
            }
            
            start_time = time.time()
            response = requests.post(url, headers=headers, files=files, data=data, timeout=60)
            end_time = time.time()
        
        if response.status_code == 200:
            result = response.json()
            
            # Extract the English translation
            english_text = result.get("transcript", "")
            detected_language = result.get("language_code", "unknown")
            
            print(f"✅ Sarvam Saaras Results:")
            print(f"   Detected Language: {detected_language}")
            print(f"   Processing Time: {end_time - start_time:.1f}s")
            print(f"   English Translation: {english_text}")
            print(f"   Character Count: {len(english_text)}")
            print(f"   Full Response: {json.dumps(result, indent=2)}")
            print()
            
            return {
                "model": "Sarvam Saaras",
                "detected_language": detected_language,
                "processing_time": end_time - start_time,
                "english_text": english_text,
                "character_count": len(english_text),
                "full_response": result
            }
            
        else:
            print(f"❌ Sarvam API Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Sarvam Saaras Error: {e}")
        return None

def compare_results(faster_whisper_result, saaras_result):
    """Compare the results from both models"""
    print("🔍 COMPARISON RESULTS:")
    print("=" * 50)
    
    if faster_whisper_result and saaras_result:
        print(f"Processing Speed:")
        print(f"  Faster-Whisper: {faster_whisper_result['processing_time']:.1f}s")
        print(f"  Sarvam Saaras:   {saaras_result['processing_time']:.1f}s")
        
        speed_winner = "Faster-Whisper" if faster_whisper_result['processing_time'] < saaras_result['processing_time'] else "Sarvam Saaras"
        print(f"  🏆 Speed Winner: {speed_winner}")
        print()
        
        print(f"Translation Quality:")
        print(f"  Faster-Whisper: {len(faster_whisper_result['english_text'])} chars")
        print(f"  Sarvam Saaras:   {len(saaras_result['english_text'])} chars")
        print()
        
        print(f"Faster-Whisper Translation:")
        print(f"  \"{faster_whisper_result['english_text'][:200]}...\"")
        print()
        
        print(f"Sarvam Saaras Translation:")
        print(f"  \"{saaras_result['english_text'][:200]}...\"")
        print()
        
    elif faster_whisper_result:
        print("✅ Faster-Whisper worked successfully")
        print("❌ Sarvam Saaras failed to process")
        print("🏆 Winner: Faster-Whisper (by default)")
        
    elif saaras_result:
        print("❌ Faster-Whisper failed to process")
        print("✅ Sarvam Saaras worked successfully")
        print("🏆 Winner: Sarvam Saaras (by default)")
        
    else:
        print("❌ Both models failed to process the audio")

def main():
    print("🎯 SARVAM SAARAS vs FASTER-WHISPER COMPARISON")
    print("=" * 60)
    print("Testing Tamil audio → English translation for call analytics")
    print()
    
    # Test current setup
    faster_result = test_current_faster_whisper()
    
    # Test Sarvam Saaras (you'll need to add your API key)
    print("📝 To test Sarvam Saaras:")
    print("1. Get API key from: https://platform.sarvam.ai/")
    print("2. Set your API key below")
    print()
    
    # Replace with your actual Sarvam API key
    SARVAM_API_KEY = ""  # Add your API key here
    
    if SARVAM_API_KEY:
        saaras_result = test_sarvam_saaras(SARVAM_API_KEY)
    else:
        print("⚠️  Skipping Sarvam test - API key not provided")
        saaras_result = None
    
    # Compare results
    compare_results(faster_result, saaras_result)
    
    print("\n🎯 RECOMMENDATION:")
    print("Based on the results above, choose the model that provides:")
    print("- Faster processing time")
    print("- Better translation quality")
    print("- More reliable service")
    print("- Lower cost (Faster-Whisper is free, Sarvam has API costs)")

if __name__ == "__main__":
    main() 