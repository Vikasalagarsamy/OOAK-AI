/**
 * UNIVERSAL BUSINESS AI - MASTER CONFIGURATION
 * ===========================================
 * 
 * CRITICAL: This is the SINGLE SOURCE OF TRUTH for all system configuration
 * ANY changes to URLs, ports, or API endpoints MUST be made here ONLY
 * 
 * Goal: Make system so simple that non-technical people can deploy it anywhere
 */


// ===========================================
// CORE SYSTEM CONFIGURATION
// ===========================================
export const SYSTEM_CONFIG = {
  // Application Core
  APP: {
    NAME: "Universal Business AI",
    VERSION: "1.0.0",
    PORT: 3000, // LOCKED FOREVER - Never change this
    BASE_URL: "http://localhost:3000"
  },

  // Database Configuration (PostgreSQL)
  DATABASE: {
    TYPE: "postgresql",
    HOST: "localhost",
    PORT: 5432,
    DATABASE: "ooak_future",
    USERNAME: process.env.POSTGRES_USER || "postgres",
    PASSWORD: process.env.POSTGRES_PASSWORD || "password",
    CONNECTION_STRING: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/ooak_future",
    POOL_SIZE: 20,
    IDLE_TIMEOUT: 30000,
    CONNECTION_TIMEOUT: 2000,
    SSL: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },

  // Communication Webhooks (Auto-updated by startup script)
  WEBHOOKS: {
    BASE_PUBLIC_URL: "", // Auto-detected from ngrok
    WHATSAPP: {
      ENDPOINT: "/api/webhooks/whatsapp",
      VERIFY_TOKEN: "whatsapp_verify_123"
    },
    INSTAGRAM: {
      ENDPOINT: "/api/webhooks/instagram", 
      VERIFY_TOKEN: "instagram_verify_456"
    },
    EMAIL: {
      ENDPOINT: "/api/webhooks/email",
      VERIFY_TOKEN: "email_verify_789"
    },
    CALLS: {
      ENDPOINT: "/api/webhooks/calls",
      VERIFY_TOKEN: "calls_verify_321"
    }
  },

  // External API Configuration
  EXTERNAL_APIS: {
    WHATSAPP: {
      BUSINESS_PHONE_NUMBER_ID: "", // To be configured
      ACCESS_TOKEN: "" // To be configured
    },
    INSTAGRAM: {
      BUSINESS_ACCOUNT_ID: "", // To be configured
      PAGE_ACCESS_TOKEN: "" // To be configured
    },
    TWILIO: {
      ACCOUNT_SID: "", // To be configured
      AUTH_TOKEN: "", // To be configured
      PHONE_NUMBER: "" // To be configured
    },
    GMAIL: {
      CLIENT_ID: "", // To be configured
      CLIENT_SECRET: "" // To be configured
    },
    OUTLOOK: {
      CLIENT_ID: "", // To be configured
      CLIENT_SECRET: "" // To be configured
    }
  },

  // AI Configuration
  AI: {
    ENABLED: true,
    ACTIVE_MODEL: "local_ollama",        // Easy switching for non-technical users
    FALLBACK_MODEL: "openai_gpt4",       // Backup model
    CONFIDENCE_THRESHOLD: 0.8,
    MAX_RESPONSE_TIME_MS: 5000,
    ENABLE_GPU_ACCELERATION: true,
    AUTO_MODEL_SWITCHING: true
  },

  // Security Configuration
  SECURITY: {
    API_SECRET_KEY: "universal_ai_secret_2024",
    WEBHOOK_SECRET: "webhook_secret_2024",
    JWT_SECRET: "jwt_secret_2024"
  },

  // Feature Flags
  FEATURES: {
    UNIVERSAL_AI: true,
    REAL_TIME_SYNC: true,
    SENTIMENT_ANALYSIS: true,
    LEAD_SCORING: true,
    ANALYTICS: true,
    PERFORMANCE_MONITORING: true
  },

  // Monitoring & Logging
  MONITORING: {
    LOGGING_LEVEL: "info",
    ANALYTICS_ENABLED: true,
    PERFORMANCE_TRACKING: true,
    ERROR_REPORTING: true
  }
}

// Helper functions to get configuration values
export const getConfig = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], SYSTEM_CONFIG)
}

export const getDatabaseUrl = () => SYSTEM_CONFIG.DATABASE.CONNECTION_STRING
export const getDatabaseConfig = () => SYSTEM_CONFIG.DATABASE
export const getAppPort = () => SYSTEM_CONFIG.APP.PORT  
export const getWebhookUrl = (service) => {
  const baseUrl = SYSTEM_CONFIG.WEBHOOKS.BASE_PUBLIC_URL
  const endpoint = SYSTEM_CONFIG.WEBHOOKS[service.toUpperCase()]?.ENDPOINT
  return baseUrl && endpoint ? `${baseUrl}${endpoint}` : null
}

// Validation function to ensure all critical configs are set
export const validateConfig = () => {
  const errors = []
  
  if (!SYSTEM_CONFIG.DATABASE.CONNECTION_STRING) errors.push("Database CONNECTION_STRING is missing")
  if (!SYSTEM_CONFIG.APP.PORT) errors.push("App PORT is missing")
  if (!SYSTEM_CONFIG.DATABASE.HOST) errors.push("Database HOST is missing")
  if (!SYSTEM_CONFIG.DATABASE.DATABASE) errors.push("Database NAME is missing")
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export default SYSTEM_CONFIG 