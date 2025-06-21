#!/usr/bin/env python3
"""
Simple Fathom-R1-14B Installation Script
Installs the free open-source Fathom-R1-14B model from Fractal AI Research
"""

import os
import sys
import logging
import subprocess
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_system():
    """Check system requirements"""
    logger.info("🔍 Checking system requirements...")
    
    try:
        import torch
        logger.info(f"✅ PyTorch {torch.__version__} available")
        
        import transformers
        logger.info(f"✅ Transformers {transformers.__version__} available")
        
        import accelerate
        logger.info(f"✅ Accelerate available")
        
        # Check memory
        import psutil
        memory_gb = psutil.virtual_memory().total / (1024**3)
        available_gb = psutil.virtual_memory().available / (1024**3)
        logger.info(f"💾 Total RAM: {memory_gb:.1f}GB, Available: {available_gb:.1f}GB")
        
        if available_gb < 12:
            logger.warning("⚠️  Less than 12GB available RAM - may run slowly")
        
        return True
        
    except ImportError as e:
        logger.error(f"❌ Missing dependency: {e}")
        return False

def install_model():
    """Install Fathom-R1-14B model"""
    logger.info("📥 Starting Fathom-R1-14B download...")
    logger.info("Model: FractalAIResearch/Fathom-R1-14B (MIT License)")
    logger.info("Size: ~14.8GB - this will take several minutes")
    
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch
        
        model_name = "FractalAIResearch/Fathom-R1-14B"
        
        # Load tokenizer first (faster)
        logger.info("🔧 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        logger.info("✅ Tokenizer loaded successfully")
        
        # Load model with CPU optimization
        logger.info("🧠 Loading model (this will take several minutes)...")
        logger.info("💡 Using CPU with optimized settings...")
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="cpu",
            low_cpu_mem_usage=True,
            trust_remote_code=True
        )
        
        logger.info("✅ Fathom-R1-14B loaded successfully!")
        
        # Test the model
        logger.info("🧪 Testing model with simple math problem...")
        
        test_prompt = """Solve this step by step:
What is 15 × 23?

Think through this carefully."""

        inputs = tokenizer(test_prompt, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model.generate(
                inputs["input_ids"],
                max_new_tokens=200,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.info("🎯 Model test response:")
        logger.info(f"Response: {response[len(test_prompt):].strip()}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Installation failed: {str(e)}")
        logger.error("💡 This might be due to:")
        logger.error("   - Insufficient memory (need ~15GB+ RAM)")
        logger.error("   - Network connectivity issues")
        logger.error("   - HuggingFace access issues")
        return False

def main():
    """Main installation function"""
    logger.info("🚀 Fathom-R1-14B Simple Installer")
    logger.info("=" * 50)
    logger.info("📋 Model Info:")
    logger.info("   - Developer: Fractal AI Research")
    logger.info("   - License: MIT (Free & Open Source)")
    logger.info("   - Size: 14.8GB")
    logger.info("   - Purpose: Mathematical reasoning")
    logger.info("=" * 50)
    
    # Check system
    if not check_system():
        logger.error("❌ System requirements not met")
        return 1
    
    # Install model
    logger.info("\n🔄 Starting installation...")
    if install_model():
        logger.info("\n🎉 Installation completed successfully!")
        logger.info("✅ Fathom-R1-14B is ready to use")
        logger.info("📝 You can now use it in your call analytics system")
        return 0
    else:
        logger.error("\n❌ Installation failed")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 