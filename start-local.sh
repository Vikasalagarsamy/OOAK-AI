#!/bin/bash
echo "🚀 Starting local development environment..."

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 3
fi

# Check if models are available
echo "🔍 Checking AI models..."
ollama list | grep -E "(llama3.1:8b|qwen2.5:7b)" || {
    echo "📥 Pulling required models..."
    ollama pull llama3.1:8b
    ollama pull qwen2.5:7b
}

# Start Next.js development server
echo "🌐 Starting Next.js development server..."
npm run dev
