#!/usr/bin/env python3
"""
Quick test script for Sarvam Saaras ASR-Translate
Run this once you get your Sarvam API key from: https://platform.sarvam.ai/
"""

import time
import json
import requests

def test_saaras_with_api_key():
    """Test Sarvam Saaras with API key"""
    
    # Add your Sarvam API key here
    API_KEY = input("Enter your Sarvam API key: ").strip()
    
    if not API_KEY:
        print("❌ No API key provided. Get one from: https://platform.sarvam.ai/")
        return
    
    print("🔄 Testing Sarvam Saaras ASR-Translate...")
    
    try:
        url = "https://api.sarvam.ai/speech-to-text-translate"
        headers = {"api-subscription-key": API_KEY}
        
        audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
        
        data = {
            "model": "saaras:v2.5",
            "prompt": "Business call about funding and project discussions"
        }
        
        with open(audio_file, 'rb') as f:
            files = {'file': ('audio.mp3', f, 'audio/mp3')}
            
            start_time = time.time()
            response = requests.post(url, headers=headers, files=files, data=data, timeout=60)
            end_time = time.time()
        
        if response.status_code == 200:
            result = response.json()
            
            english_text = result.get("transcript", "")
            detected_language = result.get("language_code", "unknown")
            
            print(f"\n✅ Sarvam Saaras Results:")
            print(f"   Detected Language: {detected_language}")
            print(f"   Processing Time: {end_time - start_time:.1f}s")
            print(f"   English Translation: {english_text}")
            print(f"   Character Count: {len(english_text)}")
            
            # Compare with your current Faster-Whisper results
            print(f"\n🔍 COMPARISON with Faster-Whisper:")
            print(f"   Faster-Whisper: 0.3s, 1158 chars, Tamil (85.6%)")
            print(f"   Sarvam Saaras:   {end_time - start_time:.1f}s, {len(english_text)} chars, {detected_language}")
            
            if end_time - start_time < 0.3:
                print(f"   🏆 Speed Winner: Sarvam Saaras")
            else:
                print(f"   🏆 Speed Winner: Faster-Whisper")
                
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_saaras_with_api_key() 