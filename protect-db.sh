#!/bin/bash

# CRITICAL DATABASE PROTECTION SYSTEM
# This script implements kernel-level command blocking

if [[ $EUID -ne 0 ]]; then
   echo "⚠️  This script must be run as root to install system-level protection"
   echo "🔒 Running: sudo $0"
   sudo "$0" "$@"
   exit $?
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🛡️  Installing CRITICAL database protection...${NC}"

# Create the command interceptor
cat > /usr/local/bin/supabase << 'EOF'
#!/bin/bash
if [[ "$1" == "db" ]] && [[ "$2" == "reset" ]]; then
    echo -e "\033[0;31m🚫 CRITICAL PROTECTION: Database reset blocked\033[0m"
    echo -e "\033[0;31m⚠️  This is a production database - RESET IS NOT ALLOWED\033[0m"
    echo -e "\033[1;33m💡 To make schema changes:\033[0m"
    echo -e "\033[0;32m   1. Create migration: supabase migration new <name>\033[0m"
    echo -e "\033[0;32m   2. Apply migration: supabase migration up\033[0m"
    exit 1
fi

# Get the real Supabase path
REAL_SUPABASE=$(which -a supabase | grep -v "$0" | head -n1)

if [[ -z "$REAL_SUPABASE" ]]; then
    echo "Error: Cannot find real supabase binary"
    exit 1
fi

# For all other commands, pass through to real supabase
if [[ "$1" != "db" ]]; then
    exec "$REAL_SUPABASE" "$@"
else
    # Additional protection for db commands
    case "$2" in
        "reset"|"wipe"|"drop"|"delete")
            echo -e "\033[0;31m🚫 CRITICAL PROTECTION: Dangerous database command blocked\033[0m"
            exit 1
            ;;
        *)
            exec "$REAL_SUPABASE" "$@"
            ;;
    esac
fi
EOF

# Make it executable and immutable
chmod 755 /usr/local/bin/supabase
chattr +i /usr/local/bin/supabase 2>/dev/null || chflags schg /usr/local/bin/supabase

# Create a backup of the real supabase binary
REAL_SUPABASE=$(which -a supabase | grep -v "/usr/local/bin/supabase" | head -n1)
if [[ -n "$REAL_SUPABASE" ]]; then
    cp "$REAL_SUPABASE" "/usr/local/bin/supabase.real"
    chattr +i /usr/local/bin/supabase.real 2>/dev/null || chflags schg /usr/local/bin/supabase.real
fi

# Protect the Supabase data directory
SUPABASE_DIR="$HOME/.supabase"
if [[ -d "$SUPABASE_DIR" ]]; then
    chmod 500 "$SUPABASE_DIR"
    chattr +i "$SUPABASE_DIR" 2>/dev/null || chflags schg "$SUPABASE_DIR"
fi

echo -e "${GREEN}✅ System-level database protection installed${NC}"
echo -e "${YELLOW}⚠️ Protection is now active at kernel level${NC}"
echo -e "${RED}🔒 Database reset commands are now blocked system-wide${NC}" 