#!/usr/bin/env python3
"""
Test AI4Bharat IndicWhisper models for multilingual call analytics
Focus: Tamil, Telugu, Kannada, Malayalam, Hindi -> English Translation
"""

import sys
import time
import torch
from transformers import pipeline, AutoModelForSpeechSeq2Seq, AutoProcessor
import warnings
warnings.filterwarnings("ignore")

def test_faster_whisper_translation(audio_file):
    """Test current Faster-Whisper translation (baseline)"""
    try:
        from faster_whisper import WhisperModel
        print("🔄 Testing Faster-Whisper Translation (baseline)...")
        
        model = WhisperModel("base", device="cpu", compute_type="int8")
        
        start_time = time.time()
        # Use translate task for English output
        segments, info = model.transcribe(audio_file, task="translate")
        end_time = time.time()
        
        english_text = " ".join([segment.text for segment in segments])
        
        print(f"✅ Faster-Whisper Translation Results:")
        print(f"   Detected Language: {info.language} (confidence: {info.language_probability:.3f})")
        print(f"   Duration: {info.duration:.1f}s")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   English Translation: {english_text}")
        print()
        
        return {
            'model': 'Faster-Whisper Translation',
            'detected_language': info.language,
            'confidence': info.language_probability,
            'duration': info.duration,
            'processing_time': end_time - start_time,
            'english_text': english_text,
            'character_count': len(english_text)
        }
    except Exception as e:
        print(f"❌ Faster-Whisper Translation failed: {e}")
        return None

def test_ai4bharat_indicconformer(audio_file):
    """Test AI4Bharat IndicConformer (multilingual ASR)"""
    try:
        print("🔄 Testing AI4Bharat IndicConformer...")
        
        model_id = "ai4bharat/indic-conformer-600m-multilingual"
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        pipe = pipeline(
            "automatic-speech-recognition",
            model=model_id,
            chunk_length_s=30,
            device=device,
            trust_remote_code=True
        )
        
        start_time = time.time()
        result = pipe(audio_file)
        end_time = time.time()
        
        print(f"✅ AI4Bharat IndicConformer Results:")
        print(f"   Model: {model_id}")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   Native Transcript: {result['text']}")
        print()
        
        return {
            'model': 'AI4Bharat IndicConformer',
            'processing_time': end_time - start_time,
            'native_text': result['text'],
            'character_count': len(result['text']),
            'task': 'native_transcription'
        }
        
    except Exception as e:
        print(f"❌ AI4Bharat IndicConformer failed: {e}")
        return None

def test_community_indic_whisper(audio_file):
    """Test Community IndicWhisper model (existing in your script)"""
    try:
        print("🔄 Testing Community IndicWhisper...")
        
        model_id = "parthiv11/indic_whisper_nodcil"
        
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
        result = pipe(audio_file)
        end_time = time.time()
        
        print(f"✅ Community IndicWhisper Results:")
        print(f"   Model: {model_id}")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   Transcript: {result['text']}")
        print()
        
        return {
            'model': 'Community IndicWhisper',
            'processing_time': end_time - start_time,
            'transcript': result['text'],
            'character_count': len(result['text'])
        }
        
    except Exception as e:
        print(f"❌ Community IndicWhisper failed: {e}")
        return None

def test_whisper_large_translation(audio_file):
    """Test Whisper Large with forced translation for comparison"""
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
            torch_dtype=torch_dtype,
            device=device,
        )
        
        start_time = time.time()
        # Force translation to English
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
            'english_text': result['text'],
            'character_count': len(result['text'])
        }
        
    except Exception as e:
        print(f"❌ Whisper Large Translation failed: {e}")
        return None

def test_language_specific_models(audio_file, detected_language=None):
    """Test language-specific models based on detection"""
    models_to_test = []
    
    if detected_language == "ta" or not detected_language:
        models_to_test.append({
            'name': 'Tamil Whisper',
            'model_id': 'vasista22/whisper-tamil-base',
            'language': 'ta'
        })
    
    if detected_language == "te" or not detected_language:
        models_to_test.append({
            'name': 'Telugu Whisper',
            'model_id': 'anuragshas/whisper-large-v2-telugu', 
            'language': 'te'
        })
    
    results = []
    for model_info in models_to_test:
        try:
            print(f"🔄 Testing {model_info['name']}...")
            
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
            pipe = pipeline(
                "automatic-speech-recognition",
                model=model_info['model_id'],
                chunk_length_s=30,
                device=device,
            )
            
            start_time = time.time()
            result = pipe(audio_file)
            end_time = time.time()
            
            print(f"✅ {model_info['name']} Results:")
            print(f"   Model: {model_info['model_id']}")
            print(f"   Processing Time: {end_time - start_time:.1f}s")
            print(f"   Native Transcript: {result['text']}")
            print()
            
            results.append({
                'model': model_info['name'],
                'processing_time': end_time - start_time,
                'native_text': result['text'],
                'character_count': len(result['text'])
            })
            
        except Exception as e:
            print(f"❌ {model_info['name']} failed: {e}")
    
    return results

def main():
    if len(sys.argv) != 2:
        print("Usage: python test-ai4bharat-indicwhisper.py <audio_file>")
        print("Example: python test-ai4bharat-indicwhisper.py tamil_call.mp3")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    print(f"🎯 Testing AI4Bharat IndicWhisper models on: {audio_file}")
    print("🌍 Focus: Tamil/Telugu/Kannada/Malayalam/Hindi -> English Translation")
    print("=" * 80)
    
    results = []
    detected_language = None
    
    # 1. Test baseline Faster-Whisper translation
    result1 = test_faster_whisper_translation(audio_file)
    if result1:
        results.append(result1)
        detected_language = result1.get('detected_language')
    
    # 2. Test AI4Bharat IndicConformer 
    result2 = test_ai4bharat_indicconformer(audio_file)
    if result2:
        results.append(result2)
    
    # 3. Test Community IndicWhisper
    result3 = test_community_indic_whisper(audio_file)
    if result3:
        results.append(result3)
    
    # 4. Test Whisper Large translation for comparison
    result4 = test_whisper_large_translation(audio_file)
    if result4:
        results.append(result4)
    
    # 5. Test language-specific models
    lang_results = test_language_specific_models(audio_file, detected_language)
    results.extend(lang_results)
    
    print("📊 MULTILINGUAL CALL ANALYTICS COMPARISON:")
    print("=" * 80)
    
    translation_models = [r for r in results if 'english_text' in r]
    transcription_models = [r for r in results if 'native_text' in r or 'transcript' in r]
    
    print("🌍 TRANSLATION TO ENGLISH (Best for Call Analytics):")
    print("-" * 50)
    for i, result in enumerate(translation_models, 1):
        print(f"{i}. {result['model']}")
        print(f"   Processing Time: {result['processing_time']:.1f}s")
        print(f"   English Text: {result.get('english_text', 'N/A')}")
        print(f"   Length: {result['character_count']} characters")
        print()
    
    print("🗣️  NATIVE LANGUAGE TRANSCRIPTION:")
    print("-" * 50)
    for i, result in enumerate(transcription_models, 1):
        text = result.get('native_text') or result.get('transcript', 'N/A')
        print(f"{i}. {result['model']}")
        print(f"   Processing Time: {result['processing_time']:.1f}s")
        print(f"   Native Text: {text}")
        print(f"   Length: {result['character_count']} characters")
        print()
    
    # Recommendations
    print("💡 RECOMMENDATIONS FOR CALL ANALYTICS:")
    print("=" * 80)
    
    if translation_models:
        fastest_translation = min(translation_models, key=lambda x: x['processing_time'])
        most_detailed_translation = max(translation_models, key=lambda x: x['character_count'])
        
        print(f"🏆 Fastest Translation: {fastest_translation['model']} ({fastest_translation['processing_time']:.1f}s)")
        print(f"📝 Most Detailed Translation: {most_detailed_translation['model']} ({most_detailed_translation['character_count']} chars)")
        
        if fastest_translation['processing_time'] < 5:
            print(f"✅ RECOMMENDED: {fastest_translation['model']} for real-time call analytics")
        else:
            print(f"⚠️  All models are slow (>5s). Consider optimization for real-time use.")
    
    print()
    print("🔗 For production, integrate the best performer into LocalCallAnalyticsTranslationService")

if __name__ == "__main__":
    main() 