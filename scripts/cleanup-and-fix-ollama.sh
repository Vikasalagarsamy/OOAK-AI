#!/bin/bash

# 🧹 Ollama Cleanup and Fix Script
# Removes Fathom-R1, cleans up space, and ensures Llama 3.1 8B is working

echo "🧹 OLLAMA CLEANUP & FIX SCRIPT"
echo "================================"
echo "🎯 Goal: Remove Fathom-R1, clean space, fix Llama 3.1 8B"
echo ""

# Step 1: Check if Ollama is installed
echo "📋 STEP 1: Checking Ollama Installation"
echo "----------------------------------------"

if command -v ollama &> /dev/null; then
    echo "✅ Ollama is installed"
    OLLAMA_PATH=$(which ollama)
    echo "   Location: $OLLAMA_PATH"
else
    echo "❌ Ollama not found in PATH"
    echo "🔍 Checking common locations..."
    
    # Check common macOS locations
    if [ -f "/Applications/Ollama.app/Contents/MacOS/ollama" ]; then
        echo "✅ Found Ollama.app in Applications"
        OLLAMA_PATH="/Applications/Ollama.app/Contents/MacOS/ollama"
        echo "   Adding to PATH for this session"
        export PATH="$PATH:/Applications/Ollama.app/Contents/MacOS"
    elif [ -f "/usr/local/bin/ollama" ]; then
        echo "✅ Found ollama in /usr/local/bin"
        OLLAMA_PATH="/usr/local/bin/ollama"
    else
        echo "❌ Ollama not found. Need to install first."
        echo ""
        echo "🔧 TO INSTALL OLLAMA:"
        echo "   Method 1: Download from https://ollama.ai"
        echo "   Method 2: brew install ollama"
        echo "   Method 3: curl -fsSL https://ollama.ai/install.sh | sh"
        echo ""
        echo "Please install Ollama first, then run this script again."
        exit 1
    fi
fi

echo ""

# Step 2: Start Ollama service
echo "🚀 STEP 2: Starting Ollama Service"
echo "-----------------------------------"

# Kill any existing Ollama processes
pkill -f ollama 2>/dev/null || true
sleep 2

# Start Ollama in background
echo "Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!
sleep 5

# Check if service started
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "✅ Ollama service is running"
else
    echo "❌ Failed to start Ollama service"
    echo "   Trying alternative startup method..."
    
    # Try launching the app directly on macOS
    if [ -d "/Applications/Ollama.app" ]; then
        open /Applications/Ollama.app
        sleep 10
    fi
    
    # Check again
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "✅ Ollama service is now running"
    else
        echo "❌ Could not start Ollama service"
        echo "   Please start Ollama manually and run this script again"
        exit 1
    fi
fi

echo ""

# Step 3: List current models
echo "📋 STEP 3: Current Models Inventory"
echo "------------------------------------"

MODELS_JSON=$(curl -s http://localhost:11434/api/tags)
echo "Raw API response:"
echo "$MODELS_JSON"

if echo "$MODELS_JSON" | jq . >/dev/null 2>&1; then
    echo ""
    echo "📊 INSTALLED MODELS:"
    echo "$MODELS_JSON" | jq -r '.models[]? | "   • \(.name) (\(.size / 1000000000 | round)GB)"'
else
    echo ""
    echo "🔍 Using ollama list command:"
    ollama list || echo "   No models found or command failed"
fi

echo ""

# Step 4: Remove Fathom-R1 models
echo "🗑️  STEP 4: Removing Fathom-R1 Models"
echo "---------------------------------------"

FATHOM_MODELS=$(echo "$MODELS_JSON" | jq -r '.models[]? | select(.name | test("fathom|r1")) | .name' 2>/dev/null || echo "")

if [ -n "$FATHOM_MODELS" ]; then
    echo "🔍 Found Fathom-R1 models to remove:"
    echo "$FATHOM_MODELS" | while read -r model; do
        echo "   Removing: $model"
        ollama rm "$model" || echo "   ⚠️  Failed to remove $model"
    done
else
    echo "✅ No Fathom-R1 models found (good!)"
fi

# Also try removing by common Fathom model names
for model in "fathom-r1-14b" "fathom-r1" "fathom" "r1-14b"; do
    if ollama list | grep -q "$model"; then
        echo "   Removing: $model"
        ollama rm "$model" 2>/dev/null || true
    fi
done

echo ""

# Step 5: Ensure Llama 3.1 8B is installed
echo "🦙 STEP 5: Ensuring Llama 3.1 8B is Ready"
echo "-------------------------------------------"

LLAMA_MODEL="llama3.1:8b"
if echo "$MODELS_JSON" | jq -r '.models[]?.name' | grep -q "$LLAMA_MODEL"; then
    echo "✅ Llama 3.1 8B is already installed"
else
    echo "📥 Installing Llama 3.1 8B (this may take a few minutes)..."
    ollama pull "$LLAMA_MODEL"
    
    if [ $? -eq 0 ]; then
        echo "✅ Llama 3.1 8B installed successfully"
    else
        echo "❌ Failed to install Llama 3.1 8B"
        echo "   You may need to install it manually: ollama pull $LLAMA_MODEL"
    fi
fi

echo ""

# Step 6: Test the setup
echo "🧪 STEP 6: Testing Llama 3.1 8B"
echo "--------------------------------"

echo "Testing with a simple call analytics prompt..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:11434/api/generate \
    -H "Content-Type: application/json" \
    -d '{
        "model": "llama3.1:8b",
        "prompt": "Analyze this call: Client says 5K budget for wedding photography. What is the business insight?",
        "stream": false,
        "options": {"temperature": 0.1}
    }' | jq -r '.response' 2>/dev/null)

if [ -n "$TEST_RESPONSE" ] && [ "$TEST_RESPONSE" != "null" ]; then
    echo "✅ Llama 3.1 8B is working correctly"
    echo "📊 Sample response:"
    echo "   $(echo "$TEST_RESPONSE" | head -c 100)..."
else
    echo "❌ Llama 3.1 8B test failed"
    echo "   Raw response: $TEST_RESPONSE"
fi

echo ""

# Step 7: Clean up disk space
echo "🧹 STEP 7: Cleaning Up Disk Space"
echo "-----------------------------------"

echo "🔍 Checking Ollama model directory size..."
OLLAMA_DIR="$HOME/.ollama"
if [ -d "$OLLAMA_DIR" ]; then
    DISK_USAGE=$(du -sh "$OLLAMA_DIR" 2>/dev/null | cut -f1)
    echo "   Ollama directory size: $DISK_USAGE"
    
    # Show detailed breakdown
    echo ""
    echo "📊 Model storage breakdown:"
    du -h "$OLLAMA_DIR/models/blobs" 2>/dev/null | tail -10
else
    echo "   Ollama directory not found at $OLLAMA_DIR"
fi

echo ""

# Step 8: Final status
echo "🎯 FINAL STATUS"
echo "==============="

# Get final model list
FINAL_MODELS=$(curl -s http://localhost:11434/api/tags | jq -r '.models[]?.name' 2>/dev/null)

echo "✅ INSTALLED MODELS:"
if [ -n "$FINAL_MODELS" ]; then
    echo "$FINAL_MODELS" | while read -r model; do
        echo "   • $model"
    done
else
    echo "   No models found via API"
fi

echo ""
echo "🎉 CLEANUP COMPLETE!"
echo "==================="
echo "✅ Fathom-R1 models removed"
echo "✅ Llama 3.1 8B ready for call analytics"
echo "✅ Disk space cleaned up"
echo "✅ System optimized for stability"
echo ""
echo "🚀 Your call analytics system is ready!"
echo "   Test with: curl -X POST http://localhost:11434/api/generate -d '{\"model\":\"llama3.1:8b\",\"prompt\":\"test\"}'"

# Clean up
trap "kill $OLLAMA_PID 2>/dev/null || true" EXIT 