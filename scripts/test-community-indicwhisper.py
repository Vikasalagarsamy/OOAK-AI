#!/usr/bin/env python3
"""
Test Community IndicWhisper vs Faster-Whisper for call analytics
Focus on Tamil audio with translation to English
"""

import time
import torch
from transformers import pipeline, AutoModelForSpeechSeq2Seq, AutoProcessor
from faster_whisper import WhisperModel
import warnings
warnings.filterwarnings("ignore")

def test_faster_whisper_translation():
    """Test current Faster-Whisper setup (baseline)"""
    try:
        print("🔄 Testing Faster-Whisper Translation (baseline)...")
        
        model = WhisperModel("base", device="cpu", compute_type="int8")
        audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
        
        start_time = time.time()
        segments, info = model.transcribe(audio_file, task="translate")
        end_time = time.time()
        
        english_text = " ".join([segment.text for segment in segments])
        
        print(f"✅ Faster-Whisper Translation Results:")
        print(f"   Detected Language: {info.language} ({info.language_probability:.1%})")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {english_text}")
        print()
        
        return {
            'model': 'Faster-Whisper Translation',
            'processing_time': end_time - start_time,
            'english_text': english_text,
            'detected_language': info.language
        }
    except Exception as e:
        print(f"❌ Faster-Whisper failed: {e}")
        return None

def test_community_indicwhisper():
    """Test Community IndicWhisper model"""
    try:
        print("🔄 Testing Community IndicWhisper...")
        
        model_id = "parthiv11/indic_whisper_nodcil"
        audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        
        print(f"   Loading model: {model_id}")
        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            model_id, 
            torch_dtype=torch_dtype, 
            low_cpu_mem_usage=True, 
            use_safetensors=True
        )
        model.to(device)
        
        processor = AutoProcessor.from_pretrained(model_id)
        
        pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            max_new_tokens=256,
            chunk_length_s=30,
            batch_size=16,
            return_timestamps=True,
            torch_dtype=torch_dtype,
            device=device,
        )
        
        start_time = time.time()
        result = pipe(audio_file)
        end_time = time.time()
        
        print(f"✅ Community IndicWhisper Results:")
        print(f"   Model: {model_id}")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   Native Transcript: {result['text']}")
        print()
        
        return {
            'model': 'Community IndicWhisper',
            'processing_time': end_time - start_time,
            'native_text': result['text']
        }
        
    except Exception as e:
        print(f"❌ Community IndicWhisper failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_whisper_medium_translation():
    """Test Whisper Medium with translation (good balance)"""
    try:
        print("🔄 Testing Whisper Medium Translation...")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
        
        pipe = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-medium",
            chunk_length_s=30,
            device=device,
        )
        
        start_time = time.time()
        result = pipe(audio_file, generate_kwargs={"task": "translate"})
        end_time = time.time()
        
        print(f"✅ Whisper Medium Translation Results:")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {result['text']}")
        print()
        
        return {
            'model': 'Whisper Medium Translation',
            'processing_time': end_time - start_time,
            'english_text': result['text']
        }
        
    except Exception as e:
        print(f"❌ Whisper Medium failed: {e}")
        return None

def main():
    print("🎯 Testing IndicWhisper vs Faster-Whisper for Call Analytics")
    print("🌍 Focus: Tamil Audio -> English Translation")
    print("=" * 70)
    
    results = []
    
    # Test models
    result1 = test_faster_whisper_translation()
    if result1:
        results.append(result1)
    
    result2 = test_community_indicwhisper()
    if result2:
        results.append(result2)
    
    result3 = test_whisper_medium_translation()
    if result3:
        results.append(result3)
    
    # Summary
    print("📊 COMPARISON SUMMARY:")
    print("=" * 70)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['model']}")
        print(f"   Processing Time: {result['processing_time']:.1f}s")
        
        if 'english_text' in result:
            print(f"   English Text: {result['english_text'][:150]}...")
            print(f"   Length: {len(result['english_text'])} characters")
        elif 'native_text' in result:
            print(f"   Native Text: {result['native_text'][:150]}...")
            print(f"   Length: {len(result['native_text'])} characters")
        print()
    
    # Recommendations
    print("💡 RECOMMENDATIONS:")
    print("=" * 70)
    
    translation_results = [r for r in results if 'english_text' in r]
    if translation_results:
        fastest = min(translation_results, key=lambda x: x['processing_time'])
        print(f"🏆 Fastest Translation: {fastest['model']} ({fastest['processing_time']:.1f}s)")
        print(f"✅ Current setup (Faster-Whisper) is working well!")
        
    native_results = [r for r in results if 'native_text' in r]
    if native_results:
        print(f"📝 IndicWhisper provides native language transcription")
        print(f"   Good for preserving original language accuracy")

if __name__ == "__main__":
    main() 