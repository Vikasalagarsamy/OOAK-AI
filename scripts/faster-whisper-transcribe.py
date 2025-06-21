#!/usr/bin/env python3
"""
Faster-Whisper Transcription Script
Transcribes audio files using the faster-whisper library
"""

import sys
import json
import argparse
from pathlib import Path
from faster_whisper import WhisperModel

def transcribe_audio(audio_file_path, model_size="base"):
    """
    Transcribe audio file using faster-whisper
    
    Args:
        audio_file_path (str): Path to the audio file
        model_size (str): Whisper model size (tiny, base, small, medium, large)
    
    Returns:
        dict: Transcription result with text and confidence
    """
    try:
        # Initialize the model (downloads automatically if not cached)
        print(f"🔄 Loading Faster-Whisper model: {model_size}", file=sys.stderr)
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
        # Transcribe the audio
        print(f"🎙️ Transcribing: {audio_file_path}", file=sys.stderr)
        segments, info = model.transcribe(audio_file_path, beam_size=5)
        
        # Combine all segments
        full_transcript = ""
        total_confidence = 0
        segment_count = 0
        
        for segment in segments:
            full_transcript += segment.text + " "
            if hasattr(segment, 'avg_logprob'):
                # Convert log probability to confidence (approximation)
                confidence = min(1.0, max(0.0, (segment.avg_logprob + 1.0)))
                total_confidence += confidence
                segment_count += 1
        
        # Calculate average confidence
        avg_confidence = total_confidence / segment_count if segment_count > 0 else 0.8
        
        result = {
            "success": True,
            "transcript": full_transcript.strip(),
            "confidence": round(avg_confidence, 3),
            "language": info.language,
            "language_probability": round(info.language_probability, 3),
            "duration": round(info.duration, 2),
            "model_used": model_size
        }
        
        print(f"✅ Transcription completed successfully", file=sys.stderr)
        return result
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "transcript": "",
            "confidence": 0.0
        }
        print(f"❌ Transcription failed: {e}", file=sys.stderr)
        return error_result

def main():
    parser = argparse.ArgumentParser(description='Transcribe audio using Faster-Whisper')
    parser.add_argument('audio_file', help='Path to the audio file')
    parser.add_argument('--model', default='base', choices=['tiny', 'base', 'small', 'medium', 'large'],
                       help='Whisper model size (default: base)')
    parser.add_argument('--output', help='Output file path (default: stdout)')
    
    args = parser.parse_args()
    
    # Check if audio file exists
    if not Path(args.audio_file).exists():
        print(f"❌ Audio file not found: {args.audio_file}", file=sys.stderr)
        sys.exit(1)
    
    # Transcribe
    result = transcribe_audio(args.audio_file, args.model)
    
    # Output result
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"📝 Result saved to: {args.output}", file=sys.stderr)
    else:
        # Output JSON to stdout for Node.js to capture
        print(json.dumps(result))
    
    # Exit with appropriate code
    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main() 