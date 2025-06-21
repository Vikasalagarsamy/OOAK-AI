#!/usr/bin/env python3
"""
Faster-Whisper Translation Script
Translates audio from any Indian language to English
"""

import sys
import json
from faster_whisper import WhisperModel

def translate_audio(audio_file, model_size="base"):
    """
    Translate audio to English using Faster-Whisper
    
    Args:
        audio_file: Path to audio file
        model_size: Whisper model size (tiny, base, small, medium, large-v3)
    
    Returns:
        dict: Translation results with metadata
    """
    try:
        # Initialize model
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
        # Transcribe with translation task (auto-detects language, translates to English)
        segments, info = model.transcribe(audio_file, task="translate")
        
        # Combine all segments
        english_text = " ".join([segment.text for segment in segments])
        
        # Return structured result
        result = {
            "success": True,
            "detected_language": info.language,
            "language_confidence": float(info.language_probability),
            "duration": float(info.duration),
            "english_translation": english_text.strip(),
            "model_used": f"faster-whisper-{model_size}",
            "task": "translate"
        }
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "model_used": f"faster-whisper-{model_size}",
            "task": "translate"
        }

def main():
    if len(sys.argv) < 2:
        print("Usage: python faster-whisper-translate.py <audio_file> [model_size]")
        print("Model sizes: tiny, base, small, medium, large-v3")
        print("Example: python faster-whisper-translate.py audio.mp3 medium")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) > 2 else "base"
    
    print(f"🌍 Translating {audio_file} to English using {model_size} model...")
    
    result = translate_audio(audio_file, model_size)
    
    if result["success"]:
        print(f"✅ Translation successful!")
        print(f"📍 Detected Language: {result['detected_language']} ({result['language_confidence']:.1%} confidence)")
        print(f"⏱️  Duration: {result['duration']:.1f} seconds")
        print(f"🔤 English Translation:")
        print(f"   {result['english_translation']}")
        
        # Output JSON for programmatic use
        print("\n" + "="*50)
        print("JSON Output:")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ Translation failed: {result['error']}")
        sys.exit(1)

if __name__ == "__main__":
    main() 