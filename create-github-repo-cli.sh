#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 OOAK GitHub Repository Setup (GitHub CLI)${NC}"
echo "This script uses GitHub CLI to create and push your repository"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo ""
    echo -e "${YELLOW}To install GitHub CLI:${NC}"
    echo "  macOS: brew install gh"
    echo "  Or visit: https://cli.github.com/"
    echo ""
    echo -e "${BLUE}Alternative: Use the manual script instead:${NC}"
    echo "  ./push-to-github.sh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔐 GitHub authentication required${NC}"
    echo "Please authenticate with GitHub:"
    gh auth login
fi

# Get repository name
read -p "Enter the GitHub repository name (default: ooak-production): " REPO_NAME
REPO_NAME=${REPO_NAME:-ooak-production}

# Ask for repository visibility
echo ""
echo -e "${BLUE}Repository visibility:${NC}"
echo "1. Public (visible to everyone)"
echo "2. Private (only you and collaborators)"
read -p "Choose (1 for public, 2 for private): " VISIBILITY
if [ "$VISIBILITY" = "1" ]; then
    VISIBILITY_FLAG="--public"
else
    VISIBILITY_FLAG="--private"
fi

echo -e "${BLUE}📋 Repository Details:${NC}"
echo "  Name: $REPO_NAME"
echo "  Visibility: $([ "$VISIBILITY_FLAG" = "--public" ] && echo "Public" || echo "Private")"
echo ""

# Confirm before proceeding
read -p "Continue with this setup? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 0
fi

echo -e "${BLUE}🔧 Preparing repository...${NC}"

# Update .gitignore
echo -e "${YELLOW}📝 Updating .gitignore...${NC}"
cat > .gitignore << 'GITIGNORE_EOF'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment files
.env
.env*.local
.env.development
.env.production
.env.whatsapp
.env.workspace
.env.postgresql

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Supabase
supabase/.temp/
.supabase/

# Database backups
backup_*.sql
*.sql.backup

# Log files
*.log
logs/
whisper-env/

# Process files
*.txt
processes.txt
*-processes.txt
.production-pids

# Tunnel files
tunnel-*.yml
tunnel*.log

# Temporary files
temp/
tmp/
.temp/

# Build artifacts
build/
dist/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
Thumbs.db

# Audio/Media files
uploads/call-recordings/
*.wav
*.mp3
*.m4a

# Python cache
__pycache__/
*.pyc
*.pyo

# Node.js cache
.npm/
.yarn/
.pnpm-store/

# Large files
*.tar.gz
*.zip
*.rar

# Sensitive files
cookies.txt
*cookies.txt
secrets.env
GITIGNORE_EOF

# Create README if it doesn't exist
if [ ! -f "README.md" ]; then
    echo -e "${YELLOW}📝 Creating README.md...${NC}"
    cat > README.md << 'README_EOF'
# OOAK Photography Business Management System

A comprehensive business management system built with Next.js, PostgreSQL, and AI integration for photography businesses.

## 🌟 Features

- 🏢 **Organization Management**: Companies, branches, departments, and roles
- 👥 **People Management**: Employees, clients, suppliers, and vendors  
- 💼 **Sales Pipeline**: Lead management, quotations, and approvals
- 📋 **Task Management**: Automated task creation and assignment
- 📊 **Analytics & Reports**: Business intelligence and performance tracking
- 🤖 **AI Integration**: Automated responses and business insights
- 📞 **Call Management**: Recording, transcription, and analytics
- 💬 **WhatsApp Integration**: Automated customer communication

## 🚀 Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, PostgreSQL
- **UI**: Tailwind CSS, Radix UI, Shadcn/ui
- **Database**: PostgreSQL with optimized queries
- **AI**: OpenAI GPT integration
- **Authentication**: JWT-based auth system
- **Deployment**: Render.com ready

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
nano .env.local
```

4. **Set up the database:**
```bash
# Create PostgreSQL database
createdb ooak_future_production

# Run setup (if needed)
npm run setup
```

5. **Start development server:**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🌐 Deployment

### Render.com (Recommended)

This application is optimized for Render.com deployment:

1. **Push to GitHub** (done ✅)
2. **Follow deployment guide**: `RENDER_DEPLOYMENT_GUIDE.md`
3. **Use infrastructure-as-code**: `render.yaml`

```bash
# Prepare for deployment
./deploy-to-render.sh
```

### Local Production

```bash
# Build application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── (protected)/       # Protected routes
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility libraries
├── services/              # Business logic services
├── types/                 # TypeScript definitions
├── scripts/               # Database scripts
├── sql/                   # SQL migrations
└── docs/                  # Documentation
```

## 🔧 Key APIs

- `/api/employees` - Employee management
- `/api/leads` - Lead management  
- `/api/quotations` - Quotation system
- `/api/tasks` - Task management
- `/api/analytics` - Business analytics
- `/api/health` - Health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Proprietary software for OOAK Photography.

## 📞 Support

Contact the development team for support.
README_EOF
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🔧 Initializing git repository...${NC}"
    git init
    git branch -M main
fi

# Create repository and push using GitHub CLI
echo -e "${YELLOW}🚀 Creating GitHub repository and pushing code...${NC}"

if gh repo create "$REPO_NAME" $VISIBILITY_FLAG --source=. --remote=origin --push; then
    echo -e "${GREEN}🎉 Successfully created and pushed to GitHub!${NC}"
    echo ""
    echo -e "${BLUE}📋 Repository created:${NC}"
    gh repo view --web
    echo ""
    echo -e "${BLUE}🔗 Repository URL:${NC}"
    echo "$(gh repo view --json url --jq .url)"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. ✅ Repository created and code pushed"
    echo "2. 🔧 Configure repository settings if needed"
    echo "3. 👥 Add collaborators: gh repo edit --add-collaborator USERNAME"
    echo "4. 🚀 Deploy to Render: ./deploy-to-render.sh"
    echo ""
    echo -e "${GREEN}Ready for Render.com deployment!${NC}"
else
    echo -e "${RED}❌ Failed to create repository${NC}"
    echo ""
    echo -e "${YELLOW}Try the manual method instead:${NC}"
    echo "./push-to-github.sh"
fi
