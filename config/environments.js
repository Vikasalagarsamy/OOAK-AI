// Environment Configuration
const environments = {
  development: {
    name: 'Development',
    port: 3000,
    database: {
      host: 'localhost',
      port: 5432,
      user: 'vikasalagarsamy',
      database: 'ooak_future',
      ssl: false
    },
    features: {
      autoSync: false,
      debugMode: true,
      mockData: false
    },
    apiUrl: 'http://localhost:3000'
  },
  
  staging: {
    name: 'Staging',
    port: 5000,
    database: {
      host: 'localhost',
      port: 5432,
      user: 'vikasalagarsamy',
      database: 'ooak_future_staging',
      ssl: false
    },
    features: {
      autoSync: false,
      debugMode: true,
      mockData: false
    },
    apiUrl: 'http://localhost:5000'
  },
  
  production: {
    name: 'Production',
    port: 4000,
    database: {
      host: 'localhost',
      port: 5432,
      user: 'vikasalagarsamy',
      database: 'ooak_future_production',
      ssl: false
    },
    features: {
      autoSync: false,
      debugMode: false,
      mockData: false
    },
    apiUrl: 'http://localhost:4000'
  }
}

// Get current environment
const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development'
  return environments[env] || environments.development
}

// Export configuration
module.exports = {
  environments,
  getCurrentEnvironment,
  current: getCurrentEnvironment()
} 