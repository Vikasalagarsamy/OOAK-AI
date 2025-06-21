#!/bin/bash

echo "🚀 Preparing OOAK application for Render.com deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Git repository not found. Please initialize git first.${NC}"
    exit 1
fi

# Check for required files
echo -e "${BLUE}🔍 Checking required files...${NC}"

required_files=(
    "render.yaml"
    "app/api/health/route.ts"
    "scripts/setup-render-database.js"
    "RENDER_DEPLOYMENT_GUIDE.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        exit 1
    fi
done

# Test build
echo -e "${BLUE}🏗️ Testing build process...${NC}"
npm run build > build.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
    rm -f build.log
else
    echo -e "${RED}❌ Build failed. Check build.log for details${NC}"
    exit 1
fi

# Check git status
echo -e "${BLUE}📋 Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️ You have uncommitted changes. Committing now...${NC}"
    
    git add .
    git commit -m "Prepare for Render deployment - $(date '+%Y-%m-%d %H:%M:%S')"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${RED}❌ Failed to commit changes${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Git working directory clean${NC}"
fi

# Push to GitHub
echo -e "${BLUE}⬆️ Pushing to GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Ready for Render deployment!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Go to https://render.com and create a new account"
echo "2. Follow the instructions in RENDER_DEPLOYMENT_GUIDE.md"
echo "3. Create PostgreSQL database first"
echo "4. Create two web services (workspace and whatsapp API)"
echo "5. Configure custom domains"
echo ""
echo -e "${YELLOW}📖 Full deployment guide: RENDER_DEPLOYMENT_GUIDE.md${NC}"
