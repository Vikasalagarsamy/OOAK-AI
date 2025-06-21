#!/bin/bash

# Environment File Management Script
# ===================================
# Helper script to manage read-only environment files

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Environment File Management${NC}"
echo "=================================="

# Function to show current status
show_status() {
    echo -e "${YELLOW}📋 Current Environment Files Status:${NC}"
    ls -la .env.local .env.production 2>/dev/null || echo "Environment files not found"
    echo ""
}

# Function to read environment file
read_env() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${GREEN}📖 Contents of $file:${NC}"
        echo "----------------------------------------"
        cat "$file"
        echo "----------------------------------------"
    else
        echo -e "${RED}❌ File $file not found${NC}"
    fi
}

# Function to unlock for editing
unlock_env() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${YELLOW}🔓 Temporarily unlocking $file for editing...${NC}"
        chmod 644 "$file"
        echo -e "${GREEN}✅ $file is now writable${NC}"
        echo -e "${YELLOW}⚠️  Remember to lock it again after editing!${NC}"
        echo -e "${BLUE}💡 Use: chmod 444 $file${NC}"
    else
        echo -e "${RED}❌ File $file not found${NC}"
    fi
}

# Function to lock environment file
lock_env() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${GREEN}🔒 Locking $file (read-only)...${NC}"
        chmod 444 "$file"
        echo -e "${GREEN}✅ $file is now protected${NC}"
    else
        echo -e "${RED}❌ File $file not found${NC}"
    fi
}

# Function to backup environment files
backup_env() {
    echo -e "${YELLOW}💾 Creating backup of environment files...${NC}"
    cp .env.local ".env.local.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null && echo "✅ .env.local backed up"
    cp .env.production ".env.production.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null && echo "✅ .env.production backed up"
}

# Main menu
case "$1" in
    "status"|"s")
        show_status
        ;;
    "read"|"r")
        if [ -n "$2" ]; then
            read_env "$2"
        else
            echo -e "${YELLOW}Usage: $0 read <filename>${NC}"
            echo -e "${BLUE}Example: $0 read .env.local${NC}"
        fi
        ;;
    "unlock"|"u")
        if [ -n "$2" ]; then
            unlock_env "$2"
        else
            echo -e "${YELLOW}Usage: $0 unlock <filename>${NC}"
            echo -e "${BLUE}Example: $0 unlock .env.local${NC}"
        fi
        ;;
    "lock"|"l")
        if [ -n "$2" ]; then
            lock_env "$2"
        else
            echo -e "${YELLOW}Usage: $0 lock <filename>${NC}"
            echo -e "${BLUE}Example: $0 lock .env.local${NC}"
        fi
        ;;
    "backup"|"b")
        backup_env
        ;;
    "help"|"h"|*)
        echo -e "${GREEN}🔧 Environment File Management Commands:${NC}"
        echo ""
        echo -e "${YELLOW}./manage-env.sh status${NC}     - Show current file permissions"
        echo -e "${YELLOW}./manage-env.sh read <file>${NC} - Read environment file contents"
        echo -e "${YELLOW}./manage-env.sh unlock <file>${NC} - Temporarily unlock for editing"
        echo -e "${YELLOW}./manage-env.sh lock <file>${NC} - Lock file (read-only)"
        echo -e "${YELLOW}./manage-env.sh backup${NC}     - Create timestamped backups"
        echo ""
        echo -e "${BLUE}📋 Examples:${NC}"
        echo -e "${GREEN}./manage-env.sh read .env.local${NC}"
        echo -e "${GREEN}./manage-env.sh unlock .env.local${NC}"
        echo -e "${GREEN}./manage-env.sh lock .env.local${NC}"
        echo ""
        echo -e "${RED}⚠️  IMPORTANT: Always lock files after editing!${NC}"
        ;;
esac 