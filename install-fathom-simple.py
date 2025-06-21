#!/usr/bin/env python3
"""
🧠 SIMPLE FATHOM-R1-14B INSTALLER
Robust installation with progress tracking and error handling
"""

import os
import sys
import time
import torch
from datetime import datetime

def check_dependencies():
    """Check if all required dependencies are installed"""
    print("📋 Checking dependencies...")
    
    try:
        import transformers
        import accelerate
        print(f"✅ transformers: {transformers.__version__}")
        print(f"✅ accelerate: {accelerate.__version__}")
        print(f"✅ torch: {torch.__version__}")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Install with:")
        print("   pip install transformers torch accelerate")
        return False

def check_system_resources():
    """Check system resources"""
    print("\n🔧 Checking system resources...")
    
    # Check available memory
    try:
        import psutil
        memory = psutil.virtual_memory()
        print(f"📊 Total RAM: {memory.total // (1024**3)} GB")
        print(f"📊 Available RAM: {memory.available // (1024**3)} GB")
        
        if memory.available < 8 * (1024**3):  # Less than 8GB
            print("⚠️  Warning: Low memory. Model loading may be slow.")
    except ImportError:
        print("ℹ️  Install psutil for memory monitoring: pip install psutil")
    
    # Check device
    if torch.cuda.is_available():
        print(f"🚀 CUDA available: {torch.cuda.get_device_name(0)}")
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        print("🍎 MPS (Apple Silicon) available")
    else:
        print("💻 Using CPU (will be slower)")

def pre_download_model():
    """Pre-download the model components separately for better control"""
    print("\n📥 Pre-downloading Fathom-R1-14B components...")
    
    model_id = "FractalAIResearch/Fathom-R1-14B"
    
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        from huggingface_hub import snapshot_download
        
        # Step 1: Download tokenizer (small, quick)
        print("   1️⃣ Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        print("   ✅ Tokenizer downloaded successfully")
        
        # Step 2: Download model files (large, may take time)
        print("   2️⃣ Downloading model files (this will take several minutes)...")
        print("      📦 Model size: ~14.8GB")
        print("      ⏱️  Estimated time: 5-15 minutes depending on connection")
        
        # Use snapshot_download for better progress tracking
        local_dir = snapshot_download(
            repo_id=model_id,
            cache_dir=None,  # Use default cache
            resume_download=True,  # Resume if interrupted
        )
        
        print(f"   ✅ Model files downloaded to: {local_dir}")
        return True
        
    except Exception as e:
        print(f"   ❌ Download failed: {e}")
        return False

def test_model_loading():
    """Test loading the model with minimal memory usage"""
    print("\n🧪 Testing model loading...")
    
    model_id = "FractalAIResearch/Fathom-R1-14B"
    
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        
        print("   📥 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        
        print("   🧠 Loading model (this may take a few minutes)...")
        start_time = time.time()
        
        # Load with memory optimization
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float32,  # Use float32 for CPU
            device_map="cpu",           # Force CPU to avoid device issues
            low_cpu_mem_usage=True,     # Optimize memory usage
            trust_remote_code=True
        )
        
        load_time = time.time() - start_time
        print(f"   ✅ Model loaded successfully in {load_time:.1f} seconds!")
        
        # Quick test
        print("   🔬 Running quick test...")
        test_input = "Hello, this is a test for business analysis."
        
        inputs = tokenizer(test_input, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=50,
                temperature=0.1,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        print(f"   📤 Test output: {response[:100]}...")
        
        print("   ✅ Model test successful!")
        
        # Clean up
        del model
        torch.cuda.empty_cache() if torch.cuda.is_available() else None
        
        return True
        
    except Exception as e:
        print(f"   ❌ Model loading failed: {e}")
        return False

def main():
    print("🎯 FATHOM-R1-14B SIMPLE INSTALLER")
    print("=" * 50)
    print(f"⏰ Started at: {datetime.now().strftime('%H:%M:%S')}")
    print()
    
    # Step 1: Check dependencies
    if not check_dependencies():
        print("\n❌ Please install missing dependencies first")
        return False
    
    # Step 2: Check system resources
    check_system_resources()
    
    # Step 3: Pre-download model
    print("\n" + "="*50)
    if not pre_download_model():
        print("\n❌ Model download failed")
        return False
    
    # Step 4: Test model loading
    print("\n" + "="*50)
    if not test_model_loading():
        print("\n❌ Model loading test failed")
        return False
    
    # Success!
    print("\n" + "="*50)
    print("🎉 FATHOM-R1-14B INSTALLATION SUCCESSFUL!")
    print("=" * 50)
    print()
    print("✅ Next steps:")
    print("   1. Test with: python use-fathom.py")
    print("   2. Use in your app via API: /api/webhooks/fathom-calls-analysis")
    print("   3. Run full setup: python scripts/setup-fathom.py")
    print()
    print(f"⏰ Completed at: {datetime.now().strftime('%H:%M:%S')}")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 