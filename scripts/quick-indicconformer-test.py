#!/usr/bin/env python3
import torch
from transformers import pipeline
import time

print('🔄 Testing AI4Bharat IndicConformer...')

try:
    model_id = 'ai4bharat/indic-conformer-600m-multilingual'
    print(f'Loading model: {model_id}')
    
    pipe = pipeline(
        'automatic-speech-recognition', 
        model=model_id, 
        trust_remote_code=True, 
        device=-1
    )
    
    audio_file = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
    
    start_time = time.time()
    result = pipe(audio_file)
    end_time = time.time()
    
    print(f'✅ IndicConformer Results:')
    print(f'   Processing Time: {end_time - start_time:.1f}s')
    print(f'   Native Transcript: {result["text"]}')
    print(f'   Length: {len(result["text"])} characters')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc() 