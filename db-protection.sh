#!/bin/bash

# Database Protection Script
# This script sets up multiple layers of protection against accidental database resets

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up database protection measures...${NC}"

# 1. Create protection flag file
echo "PREVENT_DB_RESET=true" > .env
chmod 444 .env  # Make read-only

# 2. Create supabase command wrapper
cat > ~/.supabase_wrapper.sh << 'EOF'
#!/bin/bash
if [[ "$1" == "db" ]] && [[ "$2" == "reset" ]]; then
    echo -e "\033[0;31m🚫 ERROR: Database reset operation is strictly forbidden\033[0m"
    echo -e "\033[1;33m⚠️  This is a business-critical database\033[0m"
    echo -e "\033[1;33m💡 If you need to modify the database structure, please use migrations\033[0m"
    exit 1
fi
command supabase "$@"
EOF

chmod +x ~/.supabase_wrapper.sh

# 3. Add alias to shell rc files
for rc_file in ~/.zshrc ~/.bashrc ~/.bash_profile; do
    if [[ -f "$rc_file" ]]; then
        # Remove any existing supabase alias
        sed -i '' '/alias supabase=/d' "$rc_file"
        # Add our protected version
        echo "alias supabase=~/.supabase_wrapper.sh" >> "$rc_file"
    fi
done

# 4. Create a hook in the project directory
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Check for potential database reset commands
if git diff --cached | grep -i "supabase.*db.*reset" > /dev/null; then
    echo -e "\033[0;31m🚫 ERROR: Potential database reset command detected in commit\033[0m"
    echo -e "\033[1;33m⚠️  This is a business-critical database\033[0m"
    exit 1
fi
EOF

chmod +x .git/hooks/pre-commit

echo -e "${GREEN}✅ Database protection measures installed successfully${NC}"
echo -e "${YELLOW}⚠️ Please restart your terminal for all protections to take effect${NC}" 