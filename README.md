# OOAK AI - Photography Business Management System

A comprehensive AI-powered business management system built with Next.js, PostgreSQL, and advanced AI integration for photography businesses.

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
- **AI**: OpenAI GPT integration, Ollama local LLM
- **Authentication**: JWT-based auth system
- **Deployment**: Render.com ready

## 🤖 AI Capabilities

- **Automated Task Creation**: AI analyzes leads and creates appropriate tasks
- **Intelligent Lead Assignment**: Smart routing based on employee skills and workload
- **Business Insights**: AI-powered analytics and recommendations
- **Customer Communication**: Automated WhatsApp responses
- **Call Analytics**: Transcription and sentiment analysis
- **Workflow Automation**: AI-driven business process optimization

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/OOAK-AI.git
cd OOAK-AI
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
│   ├── api/               # API endpoints (100+ routes)
│   └── globals.css        # Global styles
├── components/            # React components (200+ components)
├── lib/                   # Utility libraries & AI services
├── services/              # Business logic services
├── types/                 # TypeScript definitions
├── scripts/               # Database & AI scripts
├── sql/                   # SQL migrations
├── ai-prompts/            # AI prompt templates
└── docs/                  # Documentation
```

## 🔧 Key APIs

### Core Business APIs
- `/api/employees` - Employee management
- `/api/leads` - Lead management  
- `/api/quotations` - Quotation system
- `/api/tasks` - Task management
- `/api/analytics` - Business analytics

### AI-Powered APIs
- `/api/ai-business-chat` - AI business assistant
- `/api/ai-tasks/*` - AI task automation
- `/api/ai-insights/*` - AI business insights
- `/api/call-analytics` - AI call analysis
- `/api/webhooks/whatsapp` - AI WhatsApp automation

### System APIs
- `/api/health` - Health check
- `/api/auth/*` - Authentication system

## 🎯 AI Features in Detail

### 1. **Automated Task Creation**
- AI analyzes new leads and creates appropriate follow-up tasks
- Intelligent task sequencing based on business rules
- Automated task assignment to best-suited employees

### 2. **Business Intelligence**
- Real-time performance analytics
- Predictive insights for sales forecasting
- Automated report generation
- Trend analysis and recommendations

### 3. **Customer Communication**
- AI-powered WhatsApp responses
- Sentiment analysis of customer interactions
- Automated follow-up scheduling
- Personalized communication templates

### 4. **Call Analytics**
- Automatic transcription and translation
- Speaker identification and sentiment analysis
- Key topic extraction and summarization
- Action item identification

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Database connection pooling
- Environment variable protection

## 🚀 Performance Optimizations

- PostgreSQL query optimization
- Connection pooling and caching
- Lazy loading and code splitting
- Image optimization
- CDN-ready static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

Proprietary software for OOAK Photography.

## 📞 Support

Contact the development team for support and customization.

---

**Built with ❤️ for OOAK Photography**
