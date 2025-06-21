#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 OOAK GitHub Repository Setup${NC}"
echo "This script will prepare and push your OOAK application to GitHub"
echo ""

# Get repository name from user
read -p "Enter the GitHub repository name (default: ooak-production): " REPO_NAME
REPO_NAME=${REPO_NAME:-ooak-production}

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo -e "${RED}❌ GitHub username is required${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Repository Details:${NC}"
echo "  Username: $GITHUB_USERNAME"
echo "  Repository: $REPO_NAME"
echo "  URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

# Confirm before proceeding
read -p "Continue with this setup? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 0
fi

echo -e "${BLUE}🔧 Preparing repository...${NC}"

# Update .gitignore for production
echo -e "${YELLOW}📝 Updating .gitignore...${NC}"
cat > .gitignore << 'GITIGNORE_EOF'
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env
.env*.local
.env.development
.env.production
.env.whatsapp
.env.workspace
.env.postgresql

# vercel
.vercel

# typescript
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
.DS_Store

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

echo -e "${GREEN}✅ .gitignore updated${NC}"

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🔧 Initializing git repository...${NC}"
    git init
    git branch -M main
else
    echo -e "${GREEN}✅ Git repository already initialized${NC}"
fi

# Add remote if not exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo -e "${YELLOW}🔗 Adding GitHub remote...${NC}"
    git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
else
    echo -e "${YELLOW}🔗 Updating GitHub remote...${NC}"
    git remote set-url origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
fi

# Create README if it doesn't exist
if [ ! -f "README.md" ]; then
    echo -e "${YELLOW}📝 Creating README.md...${NC}"
    cat > README.md << 'README_EOF'
# OOAK Photography Business Management System

A comprehensive business management system built with Next.js, PostgreSQL, and AI integration for photography businesses.

## Features

- 🏢 **Organization Management**: Companies, branches, departments, and roles
- 👥 **People Management**: Employees, clients, suppliers, and vendors
- 💼 **Sales Pipeline**: Lead management, quotations, and approvals
- 📋 **Task Management**: Automated task creation and assignment
- 📊 **Analytics & Reports**: Business intelligence and performance tracking
- 🤖 **AI Integration**: Automated responses and business insights
- 📞 **Call Management**: Recording, transcription, and analytics
- 💬 **WhatsApp Integration**: Automated customer communication

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, PostgreSQL
- **UI**: Tailwind CSS, Radix UI, Shadcn/ui
- **Database**: PostgreSQL with optimized queries
- **AI**: OpenAI GPT integration
- **Authentication**: JWT-based auth system
- **Deployment**: Render.com ready

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database and API keys
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb ooak_future_production

# Run migrations (if needed)
npm run setup
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment

### Render.com Deployment

This application is configured for easy deployment on Render.com:

1. Push code to GitHub
2. Follow the guide in `RENDER_DEPLOYMENT_GUIDE.md`
3. Use the `render.yaml` configuration for infrastructure-as-code

### Local Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (protected)/       # Protected routes
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility libraries
├── services/              # Business logic services
├── types/                 # TypeScript type definitions
├── scripts/               # Database and utility scripts
├── sql/                   # SQL migrations and queries
└── docs/                  # Documentation
```

## Key Features

### 🏢 Organization Management
- Multi-company support
- Branch and department hierarchy
- Role-based permissions
- Employee management

### 💼 Sales Pipeline
- Lead capture and assignment
- Quotation generation and approval
- Automated follow-ups
- Performance tracking

### 🤖 AI Integration
- Automated task creation
- Intelligent lead assignment
- Business insights generation
- Customer communication automation

### 📊 Analytics
- Real-time dashboards
- Performance metrics
- Conversion tracking
- Custom reports

## API Documentation

The application provides comprehensive REST APIs:

- `/api/employees` - Employee management
- `/api/leads` - Lead management
- `/api/quotations` - Quotation system
- `/api/tasks` - Task management
- `/api/analytics` - Business analytics
- `/api/health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software for OOAK Photography.

## Support

For support and questions, please contact the development team.
README_EOF

    # Replace placeholders in README
    sed -i '' "s/USERNAME/$GITHUB_USERNAME/g" README.md
    sed -i '' "s/REPO_NAME/$REPO_NAME/g" README.md
    
    echo -e "${GREEN}✅ README.md created${NC}"
fi

# Stage files for commit
echo -e "${YELLOW}📦 Staging files for commit...${NC}"
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️ No changes to commit${NC}"
else
    # Commit changes
    echo -e "${YELLOW}💾 Committing changes...${NC}"
    git commit -m "Initial commit: OOAK Photography Business Management System

Features:
- Complete Next.js application with TypeScript
- PostgreSQL database integration
- AI-powered business automation
- Comprehensive sales pipeline
- Real-time analytics and reporting
- WhatsApp integration
- Render.com deployment ready

Ready for production deployment on Render.com"

    echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Push to GitHub
echo -e "${YELLOW}⬆️ Pushing to GitHub...${NC}"
echo -e "${BLUE}Note: You may need to authenticate with GitHub${NC}"
echo ""

# Try to push
if git push -u origin main; then
    echo -e "${GREEN}🎉 Successfully pushed to GitHub!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Visit: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "2. Make the repository public/private as needed"
    echo "3. Add collaborators if required"
    echo "4. Set up branch protection rules"
    echo "5. Deploy to Render.com using: ./deploy-to-render.sh"
    echo ""
    echo -e "${GREEN}🚀 Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo ""
    echo -e "${YELLOW}Possible solutions:${NC}"
    echo "1. Make sure you have a GitHub account"
    echo "2. Create the repository on GitHub first: https://github.com/new"
    echo "3. Set up GitHub authentication (SSH keys or personal access token)"
    echo "4. Try running the script again"
    echo ""
    echo -e "${BLUE}GitHub CLI alternative:${NC}"
    echo "If you have GitHub CLI installed, you can create the repo automatically:"
    echo "gh repo create $REPO_NAME --public --source=. --remote=origin --push"
fi
