#!/usr/bin/env python3
"""
FAST Fathom-R1-14B Installation Script
Uses hf-transfer for blazing fast downloads (up to 500MB/s)
"""

import os
import sys
import logging
import time

# ENABLE FAST TRANSFER IMMEDIATELY
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def fast_install():
    """Fast install with hf-transfer"""
    logger.info("🚀 FAST Fathom-R1-14B Installer")
    logger.info("=" * 50)
    logger.info("⚡ Using hf-transfer for blazing fast downloads!")
    logger.info("🎯 Expected speed: 50-500MB/s (vs 10MB/s default)")
    logger.info("⏱️  Expected time: 2-5 minutes (vs 25+ minutes)")
    logger.info("=" * 50)
    
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch
        
        model_name = "FractalAIResearch/Fathom-R1-14B"
        
        # Start timer
        start_time = time.time()
        
        # Load tokenizer (fast)
        logger.info("🔧 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        logger.info("✅ Tokenizer loaded!")
        
        # Load model with fast transfer
        logger.info("⚡ Starting FAST model download...")
        logger.info("📥 Size: 14.8GB - should complete in 2-5 minutes")
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="cpu",
            low_cpu_mem_usage=True,
            trust_remote_code=True
        )
        
        # Calculate time
        end_time = time.time()
        duration_minutes = (end_time - start_time) / 60
        
        logger.info("🎉 SUCCESS!")
        logger.info(f"⏱️  Total time: {duration_minutes:.1f} minutes")
        logger.info("✅ Fathom-R1-14B downloaded and loaded!")
        
        # Quick test
        logger.info("🧪 Testing model...")
        test_prompt = "Calculate 25 × 17 step by step:"
        
        inputs = tokenizer(test_prompt, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model.generate(
                inputs["input_ids"],
                max_new_tokens=100,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        test_response = response[len(test_prompt):].strip()
        
        logger.info("🎯 Model test response:")
        logger.info(f"   {test_response[:200]}...")
        
        logger.info("\n🎉 INSTALLATION COMPLETE!")
        logger.info("✅ Fathom-R1-14B is ready for your call analytics!")
        logger.info("📝 Integration with your system coming next...")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Fast installation failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = fast_install()
    sys.exit(0 if success else 1) 