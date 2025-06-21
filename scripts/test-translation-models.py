#!/usr/bin/env python3
"""
Test Speech Translation models for Indian languages to English
Tamil/Telugu/Kannada/Malayalam/Hindi -> English
"""

import sys
import time
import torch
from transformers import pipeline, AutoModelForSpeechSeq2Seq, AutoProcessor
import warnings
warnings.filterwarnings("ignore")

def test_faster_whisper_translation(audio_file):
    """Test Faster-Whisper with translation to English"""
    try:
        from faster_whisper import WhisperModel
        print("🔄 Testing Faster-Whisper Translation (base model)...")
        
        model = WhisperModel("base", device="cpu", compute_type="int8")
        
        start_time = time.time()
        # Use translate task instead of transcribe
        segments, info = model.transcribe(audio_file, task="translate")
        end_time = time.time()
        
        transcript = " ".join([segment.text for segment in segments])
        
        print(f"✅ Faster-Whisper Translation Results:")
        print(f"   Detected Language: {info.language} (confidence: {info.language_probability:.3f})")
        print(f"   Duration: {info.duration:.1f}s")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {transcript}")
        print()
        
        return {
            'model': 'Faster-Whisper Translation (base)',
            'language': info.language,
            'confidence': info.language_probability,
            'duration': info.duration,
            'processing_time': end_time - start_time,
            'english_text': transcript
        }
    except Exception as e:
        print(f"❌ Faster-Whisper Translation failed: {e}")
        return None

def test_whisper_large_translation(audio_file):
    """Test Whisper Large with translation to English"""
    try:
        print("🔄 Testing Whisper Large Translation...")
        
        model_id = "openai/whisper-large-v3"
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        
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
            max_new_tokens=128,
            chunk_length_s=30,
            batch_size=16,
            return_timestamps=True,
            torch_dtype=torch_dtype,
            device=device,
        )
        
        start_time = time.time()
        # Force translation task to English
        result = pipe(audio_file, generate_kwargs={"task": "translate"})
        end_time = time.time()
        
        print(f"✅ Whisper Large Translation Results:")
        print(f"   Model: {model_id}")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {result['text']}")
        print()
        
        return {
            'model': 'Whisper Large Translation',
            'processing_time': end_time - start_time,
            'english_text': result['text']
        }
        
    except Exception as e:
        print(f"❌ Whisper Large Translation failed: {e}")
        return None

def test_whisper_medium_translation(audio_file):
    """Test Whisper Medium with translation to English (faster alternative)"""
    try:
        print("🔄 Testing Whisper Medium Translation...")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        pipe = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-medium",
            chunk_length_s=30,
            device=device,
        )
        
        start_time = time.time()
        # Force translation task to English
        result = pipe(audio_file, generate_kwargs={"task": "translate"})
        end_time = time.time()
        
        print(f"✅ Whisper Medium Translation Results:")
        print(f"   Model: openai/whisper-medium")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {result['text']}")
        print()
        
        return {
            'model': 'Whisper Medium Translation',
            'processing_time': end_time - start_time,
            'english_text': result['text']
        }
        
    except Exception as e:
        print(f"❌ Whisper Medium Translation failed: {e}")
        return None

def test_seamless_m4t_translation(audio_file):
    """Test SeamlessM4T for speech translation"""
    try:
        print("🔄 Testing SeamlessM4T Translation...")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        pipe = pipeline(
            "automatic-speech-recognition",
            model="facebook/hf-seamless-m4t-medium",
            device=device,
        )
        
        start_time = time.time()
        result = pipe(audio_file, tgt_lang="eng")
        end_time = time.time()
        
        print(f"✅ SeamlessM4T Translation Results:")
        print(f"   Model: facebook/hf-seamless-m4t-medium")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {result['text']}")
        print()
        
        return {
            'model': 'SeamlessM4T Translation',
            'processing_time': end_time - start_time,
            'english_text': result['text']
        }
        
    except Exception as e:
        print(f"❌ SeamlessM4T Translation failed: {e}")
        return None

def main():
    if len(sys.argv) != 2:
        print("Usage: python test-translation-models.py <audio_file>")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    print(f"🎯 Testing Speech Translation to English on: {audio_file}")
    print("🌍 Supports: Tamil, Telugu, Kannada, Malayalam, Hindi, Indian English")
    print("=" * 80)
    
    results = []
    
    # Test Faster-Whisper translation
    result1 = test_faster_whisper_translation(audio_file)
    if result1:
        results.append(result1)
    
    # Test Whisper Medium translation (good balance of speed/quality)
    result2 = test_whisper_medium_translation(audio_file)
    if result2:
        results.append(result2)
    
    # Test Whisper Large translation (highest quality)
    result3 = test_whisper_large_translation(audio_file)
    if result3:
        results.append(result3)
    
    print("📊 ENGLISH TRANSLATION COMPARISON:")
    print("=" * 80)
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['model']}")
        print(f"   Processing Time: {result['processing_time']:.1f}s")
        print(f"   English Text: {result['english_text']}")
        print(f"   Length: {len(result['english_text'])} characters")
        print()
    
    if len(results) > 1:
        fastest = min(results, key=lambda x: x['processing_time'])
        most_detailed = max(results, key=lambda x: len(x['english_text']))
        
        print(f"🏆 Fastest: {fastest['model']} ({fastest['processing_time']:.1f}s)")
        print(f"📝 Most detailed: {most_detailed['model']} ({len(most_detailed['english_text'])} chars)")
        print()
        print("💡 RECOMMENDATION:")
        if fastest['processing_time'] < 30:
            print(f"   Use {fastest['model']} for real-time processing")
        print(f"   Use {most_detailed['model']} for highest quality")

if __name__ == "__main__":
    main() 