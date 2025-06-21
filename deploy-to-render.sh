#!/bin/bash

# OOAK Future - Render.com Deployment Script
# This script prepares and deploys the application to Render.com

echo "🚀 Starting Render.com deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Clean up any temporary files
echo -e "${BLUE}📁 Cleaning up temporary files...${NC}"
rm -rf .next
rm -rf node_modules/.cache
rm -rf disabled-pages

# Step 2: Ensure all environment variables are set
echo -e "${BLUE}🔧 Checking environment configuration...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.production template...${NC}"
    cat > .env.production << 'EOF'
# Production Environment Variables for Render.com
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://workspace.ooak.photography
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database

# Authentication
NEXTAUTH_SECRET=mbBSSdwnS2UY9/F9WOyXigxlDFUqubjQFf5VnXrcWXE=
NEXTAUTH_URL=https://workspace.ooak.photography
JWT_SECRET=5fh+rT0PoqFDLtrITHjyEnYYNUG4p2MTWu+QGhDgRbQ=
ENCRYPTION_KEY=ldX6UIaAtxdFhCr3ZE4hBjh33fOD0UekAvjgU1xJe/8=

# WhatsApp
WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123

# AI Services (Set these in Render dashboard)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GROQ_API_KEY=your_groq_key_here
EOF
fi

# Step 3: Test build locally
echo -e "${BLUE}🔨 Testing production build...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed! Please fix errors before deploying.${NC}"
    exit 1
fi

# Step 4: Check if git repository is clean
echo -e "${BLUE}📋 Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes. Committing them now...${NC}"
    git add .
    git commit -m "🚀 Prepare for Render.com deployment - $(date)"
fi

# Step 5: Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
if git push origin main; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub. Please check your git configuration.${NC}"
    exit 1
fi

# Step 6: Display deployment instructions
echo -e "${GREEN}🎉 Deployment preparation complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Go to https://render.com and sign in"
echo "2. Click 'New +' and select 'Blueprint'"
echo "3. Connect your GitHub repository: $(git remote get-url origin)"
echo "4. Render will automatically detect the render.yaml file"
echo "5. Set your environment variables in the Render dashboard:"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY" 
echo "   - GROQ_API_KEY"
echo "6. Click 'Apply' to start deployment"
echo ""
echo -e "${GREEN}🌐 Your domains will be:${NC}"
echo "   - Employee Workspace: https://workspace.ooak.photography"
echo "   - WhatsApp API: https://api.ooak.photography"
echo ""
echo -e "${YELLOW}💡 Don't forget to:${NC}"
echo "   - Configure your custom domains in Render"
echo "   - Set up SSL certificates (automatic with Render)"
echo "   - Monitor the deployment logs"
echo ""
echo -e "${GREEN}🚀 Ready for deployment!${NC}"
