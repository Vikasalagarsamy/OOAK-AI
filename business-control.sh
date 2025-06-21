#!/bin/bash

# 🏢 BUSINESS AI CONTROL CENTER
# =============================
# Simple commands for business owners who love AI but hate tech headaches!
# No technical knowledge required - just run and go!

# Colors for easy reading
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Business logo
echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║          🤖 AI BUSINESS HUB          ║"
echo "  ║      Your AI Empire Made Simple      ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# Show menu
show_menu() {
    echo -e "${BLUE}📋 WHAT DO YOU WANT TO DO TODAY?${NC}"
    echo "=================================="
    echo -e "${GREEN}1.${NC} 🚀 START my AI business (Everything On)"
    echo -e "${GREEN}2.${NC} 🛑 STOP my AI business (Everything Off)" 
    echo -e "${GREEN}3.${NC} 📊 CHECK if everything is working"
    echo -e "${GREEN}4.${NC} 📱 SHOW my business URLs"
    echo -e "${GREEN}5.${NC} 🔧 RESTART if something is broken"
    echo -e "${GREEN}6.${NC} 📞 TEST call analytics with sample"
    echo -e "${GREEN}7.${NC} 📈 OPEN analytics dashboard"
    echo -e "${GREEN}8.${NC} 🆘 EMERGENCY - Fix everything"
    echo -e "${GREEN}9.${NC} 💡 HELP - What does each thing do?"
    echo -e "${RED}0.${NC} ❌ EXIT"
    echo ""
    echo -e "${YELLOW}💡 Pick a number and press Enter${NC}"
}

# Start everything
start_business() {
    echo -e "${GREEN}🚀 STARTING YOUR AI BUSINESS...${NC}"
    echo "This will take 30 seconds, grab a coffee! ☕"
    ./start-permanent-ooak.sh
    echo -e "${GREEN}✅ YOUR AI BUSINESS IS NOW LIVE!${NC}"
    show_urls
}

# Stop everything  
stop_business() {
    echo -e "${RED}🛑 STOPPING YOUR AI BUSINESS...${NC}"
    pkill -f 'cloudflared tunnel'
    pkill -f 'next dev' 
    pkill -f 'ollama serve'
    echo -e "${GREEN}✅ Everything stopped safely${NC}"
}

# Check status
check_status() {
    echo -e "${BLUE}📊 CHECKING YOUR AI BUSINESS...${NC}"
    echo "================================"
    
    # Check local server
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Website: WORKING${NC}"
    else
        echo -e "${RED}❌ Website: NOT WORKING${NC}"
    fi
    
    # Check tunnel
    if curl -s https://api.ooak.photography > /dev/null; then
        echo -e "${GREEN}✅ Public URL: WORKING${NC}"
    else
        echo -e "${RED}❌ Public URL: NOT WORKING${NC}"
    fi
    
    # Check AI
    if curl -s http://localhost:11434 > /dev/null; then
        echo -e "${GREEN}✅ AI Brain: WORKING${NC}"
    else
        echo -e "${RED}❌ AI Brain: NOT WORKING${NC}"
    fi
    
    echo -e "${YELLOW}💡 If anything shows NOT WORKING, choose option 5 to restart${NC}"
}

# Show business URLs
show_urls() {
    echo -e "${PURPLE}🌐 YOUR AI BUSINESS URLS:${NC}"
    echo "========================="
    echo -e "${GREEN}🏠 Your Website:${NC} http://localhost:3000"
    echo -e "${GREEN}🌍 Public API:${NC} https://api.ooak.photography"
    echo -e "${GREEN}📱 WhatsApp:${NC} https://api.ooak.photography/api/webhooks/whatsapp"
    echo -e "${GREEN}📞 Call Analytics:${NC} https://api.ooak.photography/tasks/dashboard/call-analytics"
    echo -e "${GREEN}📊 Upload Calls:${NC} https://api.ooak.photography/api/webhooks/local-calls"
    echo ""
    echo -e "${YELLOW}💡 These URLs never change - bookmark them!${NC}"
}

# Restart everything
restart_business() {
    echo -e "${YELLOW}🔧 RESTARTING YOUR AI BUSINESS...${NC}"
    stop_business
    sleep 3
    start_business
}

# Test call analytics
test_calls() {
    echo -e "${BLUE}📞 TESTING CALL ANALYTICS...${NC}"
    echo "This will test if your call system works"
    
    if [ -f "test-audio.wav" ]; then
        echo "Testing with existing audio file..."
        curl -X POST -F "audio=@test-audio.wav" https://api.ooak.photography/api/webhooks/local-calls
    else
        echo -e "${YELLOW}💡 No test audio found. Upload a .wav file manually to:${NC}"
        echo "https://api.ooak.photography/api/webhooks/local-calls"
    fi
}

# Open dashboard
open_dashboard() {
    echo -e "${GREEN}📈 OPENING ANALYTICS DASHBOARD...${NC}"
    open "https://api.ooak.photography/tasks/dashboard/call-analytics"
}

# Emergency fix
emergency_fix() {
    echo -e "${RED}🆘 EMERGENCY MODE - FIXING EVERYTHING...${NC}"
    echo "This might take 2 minutes..."
    
    # Kill everything
    pkill -f python
    pkill -f node
    pkill -f cloudflared
    pkill -f ollama
    
    # Clear ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:11434 | xargs kill -9 2>/dev/null || true
    
    # Wait
    sleep 5
    
    # Restart
    start_business
    
    echo -e "${GREEN}✅ EMERGENCY FIX COMPLETE!${NC}"
}

# Show help
show_help() {
    echo -e "${BLUE}💡 WHAT EACH OPTION DOES:${NC}"
    echo "========================="
    echo -e "${GREEN}START (1):${NC} Turns on your AI system - websites, chatbots, call analytics"
    echo -e "${GREEN}STOP (2):${NC} Safely turns everything off to save computer resources"
    echo -e "${GREEN}CHECK (3):${NC} Tests if your business is running properly"
    echo -e "${GREEN}URLS (4):${NC} Shows your website and API addresses"
    echo -e "${GREEN}RESTART (5):${NC} Fixes minor issues by turning off and on again"
    echo -e "${GREEN}TEST CALLS (6):${NC} Tests if call recording and AI analysis works"
    echo -e "${GREEN}DASHBOARD (7):${NC} Opens your business analytics in browser"
    echo -e "${GREEN}EMERGENCY (8):${NC} Nuclear option - fixes everything when really broken"
    echo ""
    echo -e "${YELLOW}💡 BUSINESS TIP: Start with option 1, then check option 3${NC}"
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice: " choice
    echo ""
    
    case $choice in
        1) start_business ;;
        2) stop_business ;;
        3) check_status ;;
        4) show_urls ;;
        5) restart_business ;;
        6) test_calls ;;
        7) open_dashboard ;;
        8) emergency_fix ;;
        9) show_help ;;
        0) echo -e "${GREEN}👋 Goodbye! Your AI empire awaits!${NC}"; exit 0 ;;
        *) echo -e "${RED}❌ Invalid choice. Pick a number 0-9${NC}" ;;
    esac
    
    echo ""
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read
    clear
done 