#!/bin/bash

# 🎛️ OOAK DOMAIN MANAGEMENT
# Industry Standard Control Panel

# Colors
G='\033[0;32m'  # Green
Y='\033[1;33m'  # Yellow
B='\033[0;34m'  # Blue
R='\033[0;31m'  # Red
P='\033[0;35m'  # Purple
C='\033[0;36m'  # Cyan
NC='\033[0m'    # No Color

show_menu() {
    clear
    echo -e "${B}🎛️ OOAK DOMAIN MANAGEMENT${NC}"
    echo "========================="
    echo -e "${C}📱 api.ooak.photography      -> WhatsApp Automations${NC}"
    echo -e "${C}💼 workspace.ooak.photography -> Employee Production${NC}"
    echo ""
    echo -e "${Y}Choose an option:${NC}"
    echo "1. 🚀 Start Both Domains"
    echo "2. 🔄 Restart Both Domains"
    echo "3. 🛑 Stop Both Domains"
    echo "4. 📊 Check Status"
    echo "5. 🧪 Test Both Domains"
    echo "6. 📋 View Logs"
    echo "7. 🔧 Advanced Options"
    echo "8. ❌ Exit"
    echo ""
}

start_domains() {
    echo -e "${Y}🚀 Starting Both Domains...${NC}"
    ./deploy-dual-production.sh
}

restart_domains() {
    echo -e "${Y}🔄 Restarting Both Domains...${NC}"
    ./restart-both-domains.sh
}

stop_domains() {
    echo -e "${Y}🛑 Stopping Both Domains...${NC}"
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    echo -e "${G}✅ Tunnels stopped${NC}"
    echo -e "${Y}💡 Services on ports 3000 and 4000 are still running${NC}"
}

check_status() {
    echo -e "${Y}📊 Checking Status...${NC}"
    echo "===================="
    
    # Check services
    echo -e "${B}🖥️  Local Services:${NC}"
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${G}✅ Port 3000 (API): Running${NC}"
    else
        echo -e "${R}❌ Port 3000 (API): Not running${NC}"
    fi
    
    if lsof -i :4000 > /dev/null 2>&1; then
        echo -e "${G}✅ Port 4000 (Production): Running${NC}"
    else
        echo -e "${R}❌ Port 4000 (Production): Not running${NC}"
    fi
    
    # Check tunnel
    echo -e "${B}🌐 Tunnel Status:${NC}"
    if pgrep -f "cloudflared tunnel" > /dev/null; then
        echo -e "${G}✅ Cloudflare Tunnel: Running${NC}"
    else
        echo -e "${R}❌ Cloudflare Tunnel: Not running${NC}"
    fi
    
    echo ""
}

test_domains() {
    echo -e "${Y}🧪 Testing Both Domains...${NC}"
    echo "========================="
    
    # Test API domain
    echo -n "Testing api.ooak.photography... "
    if curl -s "https://api.ooak.photography" > /dev/null 2>&1; then
        echo -e "${G}✅ Working${NC}"
    else
        echo -e "${R}❌ Failed${NC}"
    fi
    
    # Test Workspace domain
    echo -n "Testing workspace.ooak.photography... "
    if curl -s "https://workspace.ooak.photography" > /dev/null 2>&1; then
        echo -e "${G}✅ Working${NC}"
    else
        echo -e "${R}❌ Failed${NC}"
    fi
    
    # Test specific endpoints
    echo -e "${B}🔍 Testing Key Endpoints:${NC}"
    echo -n "WhatsApp Webhook... "
    if curl -s "https://api.ooak.photography/api/webhooks/whatsapp" > /dev/null 2>&1; then
        echo -e "${G}✅ Working${NC}"
    else
        echo -e "${R}❌ Failed${NC}"
    fi
    
    echo -n "Employee Login... "
    if curl -s "https://workspace.ooak.photography/login" > /dev/null 2>&1; then
        echo -e "${G}✅ Working${NC}"
    else
        echo -e "${R}❌ Failed${NC}"
    fi
    
    echo ""
}

view_logs() {
    echo -e "${Y}📋 Available Logs:${NC}"
    echo "=================="
    echo "1. Tunnel Logs"
    echo "2. API Service Logs"
    echo "3. Production Service Logs"
    echo "4. All Logs (tail -f)"
    echo "5. Back to Main Menu"
    echo ""
    read -p "Choose log to view: " log_choice
    
    case $log_choice in
        1) tail -20 dual-tunnel.log 2>/dev/null || echo "No tunnel logs found" ;;
        2) tail -20 api-service.log 2>/dev/null || echo "No API service logs found" ;;
        3) tail -20 production-service.log 2>/dev/null || echo "No production service logs found" ;;
        4) tail -f dual-tunnel.log api-service.log production-service.log 2>/dev/null || echo "No logs found" ;;
        5) return ;;
        *) echo "Invalid option" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
}

advanced_options() {
    echo -e "${Y}🔧 Advanced Options:${NC}"
    echo "==================="
    echo "1. Force Restart Tunnel Only"
    echo "2. Start API Service Only (Port 3000)"
    echo "3. Start Production Service Only (Port 4000)"
    echo "4. Kill All Processes"
    echo "5. Show Process IDs"
    echo "6. Back to Main Menu"
    echo ""
    read -p "Choose option: " adv_choice
    
    case $adv_choice in
        1) 
            pkill -f "cloudflared tunnel" 2>/dev/null || true
            sleep 2
            cloudflared tunnel --config tunnel-config-dual.yml run ooak-tunnel > tunnel-restart.log 2>&1 &
            echo -e "${G}✅ Tunnel restarted${NC}"
            ;;
        2) 
            npm run dev > api-service.log 2>&1 &
            echo -e "${G}✅ API service started on port 3000${NC}"
            ;;
        3) 
            npm run dev -- --port 4000 > production-service.log 2>&1 &
            echo -e "${G}✅ Production service started on port 4000${NC}"
            ;;
        4) 
            pkill -f "next dev" 2>/dev/null || true
            pkill -f "cloudflared tunnel" 2>/dev/null || true
            echo -e "${G}✅ All processes killed${NC}"
            ;;
        5) 
            echo -e "${B}Process Information:${NC}"
            echo "Tunnel: $(pgrep -f 'cloudflared tunnel' || echo 'Not running')"
            echo "API (3000): $(lsof -ti:3000 || echo 'Not running')"
            echo "Production (4000): $(lsof -ti:4000 || echo 'Not running')"
            ;;
        6) return ;;
        *) echo "Invalid option" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1) start_domains ;;
        2) restart_domains ;;
        3) stop_domains ;;
        4) check_status ;;
        5) test_domains ;;
        6) view_logs ;;
        7) advanced_options ;;
        8) echo -e "${G}Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${R}Invalid option. Please try again.${NC}" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done 