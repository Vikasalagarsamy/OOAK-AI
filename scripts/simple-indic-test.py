#!/usr/bin/env python3
from transformers import pipeline
import time

print('🔄 Testing IndicWhisper model...')
audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'

try:
    pipe = pipeline('automatic-speech-recognition', model='parthiv11/indic_whisper_nodcil', device=-1)
    
    start_time = time.time()
    result = pipe(audio_file)
    end_time = time.time()
    
    print(f'✅ IndicWhisper Results:')
    print(f'   Processing Time: {end_time - start_time:.1f}s')
    print(f'   Transcript: {result["text"]}')
    print(f'   Length: {len(result["text"])} characters')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc() 