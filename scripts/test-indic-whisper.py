#!/usr/bin/env python3
"""
Test IndicWhisper models vs Faster-Whisper for Indian languages
Specifically testing Tamil/Telugu/Kannada/Malayalam performance
"""

import sys
import time
import torch
from transformers import pipeline, AutoModelForSpeechSeq2Seq, AutoProcessor
import warnings
warnings.filterwarnings("ignore")

def test_faster_whisper(audio_file):
    """Test current Faster-Whisper setup"""
    try:
        from faster_whisper import WhisperModel
        print("🔄 Testing Faster-Whisper (base model)...")
        
        model = WhisperModel("base", device="cpu", compute_type="int8")
        
        start_time = time.time()
        segments, info = model.transcribe(audio_file, language="ta")
        end_time = time.time()
        
        transcript = " ".join([segment.text for segment in segments])
        
        print(f"✅ Faster-Whisper Results:")
        print(f"   Language: {info.language} (confidence: {info.language_probability:.3f})")
        print(f"   Duration: {info.duration:.1f}s")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   Transcript: {transcript[:200]}...")
        print()
        
        return {
            'model': 'Faster-Whisper (base)',
            'language': info.language,
            'confidence': info.language_probability,
            'duration': info.duration,
            'processing_time': end_time - start_time,
            'transcript': transcript
        }
    except Exception as e:
        print(f"❌ Faster-Whisper failed: {e}")
        return None

def test_indic_whisper(audio_file):
    """Test IndicWhisper model"""
    try:
        print("🔄 Testing IndicWhisper (AI4Bharat model)...")
        
        # Test the specific IndicWhisper model from Hugging Face
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
        
        print(f"✅ IndicWhisper Results:")
        print(f"   Model: {model_id}")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   Transcript: {result['text'][:200]}...")
        print()
        
        return {
            'model': 'IndicWhisper',
            'processing_time': end_time - start_time,
            'transcript': result['text']
        }
        
    except Exception as e:
        print(f"❌ IndicWhisper failed: {e}")
        return None

def test_tamil_specific_whisper(audio_file):
    """Test Tamil-specific Whisper model"""
    try:
        print("🔄 Testing Tamil-specific Whisper model...")
        
        model_id = "vasista22/whisper-tamil-base"
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        
        pipe = pipeline(
            "automatic-speech-recognition",
            model=model_id,
            chunk_length_s=30,
            device=device,
        )
        
        # Force Tamil language
        pipe.model.config.forced_decoder_ids = pipe.tokenizer.get_decoder_prompt_ids(language="ta", task="transcribe")
        
        start_time = time.time()
        result = pipe(audio_file)
        end_time = time.time()
        
        print(f"✅ Tamil-specific Whisper Results:")
        print(f"   Model: {model_id}")
        print(f"   Processing Time: {end_time - start_time:.1f}s")
        print(f"   Transcript: {result['text'][:200]}...")
        print()
        
        return {
            'model': 'Tamil-specific Whisper',
            'processing_time': end_time - start_time,
            'transcript': result['text']
        }
        
    except Exception as e:
        print(f"❌ Tamil-specific Whisper failed: {e}")
        return None

def main():
    if len(sys.argv) != 2:
        print("Usage: python test-indic-whisper.py <audio_file>")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    print(f"🎯 Testing Indian language models on: {audio_file}")
    print("=" * 70)
    
    results = []
    
    # Test current setup
    result1 = test_faster_whisper(audio_file)
    if result1:
        results.append(result1)
    
    # Test IndicWhisper
    result2 = test_indic_whisper(audio_file)
    if result2:
        results.append(result2)
    
    # Test Tamil-specific model
    result3 = test_tamil_specific_whisper(audio_file)
    if result3:
        results.append(result3)
    
    print("📊 COMPARISON SUMMARY:")
    print("=" * 70)
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['model']}")
        print(f"   Processing Time: {result['processing_time']:.1f}s")
        print(f"   Transcript Length: {len(result['transcript'])} chars")
        print(f"   Sample: {result['transcript'][:100]}...")
        print()
    
    if len(results) > 1:
        fastest = min(results, key=lambda x: x['processing_time'])
        longest_transcript = max(results, key=lambda x: len(x['transcript']))
        
        print(f"🏆 Fastest: {fastest['model']} ({fastest['processing_time']:.1f}s)")
        print(f"📝 Most detailed: {longest_transcript['model']} ({len(longest_transcript['transcript'])} chars)")

if __name__ == "__main__":
    main() 