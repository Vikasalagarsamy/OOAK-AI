#!/usr/bin/env node

// PostgreSQL Configuration Switcher
// ==================================

const fs = require('fs')
const path = require('path')

const CONFIGS = {
  local: {
    DATABASE_URL: 'postgresql://postgres:password@localhost:5432/ooak_future',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_DATABASE: 'ooak_future',
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'password',
    POSTGRES_SSL: 'false',
    DB_ENVIRONMENT: 'local'
  },
  production: {
    DATABASE_URL: process.env.PRODUCTION_DATABASE_URL || 'postgresql://user:password@host:5432/database',
    POSTGRES_HOST: process.env.PRODUCTION_POSTGRES_HOST || 'production-host',
    POSTGRES_PORT: process.env.PRODUCTION_POSTGRES_PORT || '5432',
    POSTGRES_DATABASE: process.env.PRODUCTION_POSTGRES_DATABASE || 'ooak_future_prod',
    POSTGRES_USER: process.env.PRODUCTION_POSTGRES_USER || 'postgres',
    POSTGRES_PASSWORD: process.env.PRODUCTION_POSTGRES_PASSWORD || 'secure_password',
    POSTGRES_SSL: 'true',
    DB_ENVIRONMENT: 'production'
  },
  docker: {
    DATABASE_URL: 'postgresql://postgres:postgres@db:5432/ooak_future',
    POSTGRES_HOST: 'db',
    POSTGRES_PORT: '5432',
    POSTGRES_DATABASE: 'ooak_future',
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'postgres',
    POSTGRES_SSL: 'false',
    DB_ENVIRONMENT: 'docker'
  }
}

function updateEnvironmentFile(configType) {
  const envFile = '.env.local'
  
  try {
    // Read current env file or create new one
    let envContent = ''
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8')
    }
    
    // Update PostgreSQL configuration
    const config = CONFIGS[configType]
    
    // Helper function to update or add environment variable
    function updateEnvVar(content, key, value) {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`)
      } else {
        return content + `\n${key}=${value}`
      }
    }
    
    // Update all PostgreSQL configuration variables
    Object.entries(config).forEach(([key, value]) => {
      envContent = updateEnvVar(envContent, key, value)
    })
    
    // Add timestamp
    envContent = updateEnvVar(envContent, 'GENERATED_AT', new Date().toISOString())
    
    // Add configuration marker
    envContent = updateEnvVar(envContent, 'DB_CONFIG_MODE', configType.toUpperCase())
    
    // Clean up extra newlines
    envContent = envContent.replace(/\n\n+/g, '\n').trim() + '\n'
    
    // Write updated content
    fs.writeFileSync(envFile, envContent)
    
    console.log(`✅ Successfully switched to ${configType.toUpperCase()} PostgreSQL configuration`)
    console.log(`📍 Host: ${config.POSTGRES_HOST}:${config.POSTGRES_PORT}`)
    console.log(`🗄️  Database: ${config.POSTGRES_DATABASE}`)
    console.log(`👤 User: ${config.POSTGRES_USER}`)
    console.log(`🔒 SSL: ${config.POSTGRES_SSL}`)
    
    if (configType === 'local') {
      console.log('\n💡 LOCAL MODE ACTIVE:')
      console.log('   • Using local PostgreSQL instance (localhost:5432)')
      console.log('   • All data comes from your local database')
      console.log('   • Changes won\'t affect production')
      console.log('   • Connect: psql -h localhost -U postgres -d ooak_future')
    } else if (configType === 'docker') {
      console.log('\n🐳 DOCKER MODE ACTIVE:')
      console.log('   • Using Docker PostgreSQL container')
      console.log('   • Database runs in isolated container')
      console.log('   • Connect: docker exec -it postgres psql -U postgres -d ooak_future')
    } else {
      console.log('\n🌐 PRODUCTION MODE ACTIVE:')
      console.log('   • Using remote PostgreSQL production instance')
      console.log('   • All data comes from live database')
      console.log('   • Changes will affect production!')
      console.log('   • Use with extreme caution')
    }
    
    console.log('\n🔄 Next steps:')
    console.log('   1. Restart your Next.js development server')
    console.log('   2. Verify the connection in your browser')
    console.log('   3. Check database connectivity')
    
  } catch (error) {
    console.error('❌ Error updating environment file:', error.message)
  }
}

function main() {
  const mode = process.argv[2]
  
  if (!mode || !['local', 'production', 'docker'].includes(mode)) {
    console.log('🔧 PostgreSQL Configuration Switcher')
    console.log('=====================================')
    console.log()
    console.log('Usage: node switch-postgresql-config.js [local|production|docker]')
    console.log()
    console.log('Examples:')
    console.log('  node switch-postgresql-config.js local       # Switch to local development')
    console.log('  node switch-postgresql-config.js docker      # Switch to Docker environment')
    console.log('  node switch-postgresql-config.js production  # Switch to production')
    console.log()
    console.log('Environment Variables (for production):')
    console.log('  PRODUCTION_DATABASE_URL      - Full connection string')
    console.log('  PRODUCTION_POSTGRES_HOST     - Database host')
    console.log('  PRODUCTION_POSTGRES_PORT     - Database port')
    console.log('  PRODUCTION_POSTGRES_DATABASE - Database name')
    console.log('  PRODUCTION_POSTGRES_USER     - Database user')
    console.log('  PRODUCTION_POSTGRES_PASSWORD - Database password')
    console.log()
    return
  }
  
  console.log(`🔄 Switching to ${mode.toUpperCase()} PostgreSQL configuration...`)
  updateEnvironmentFile(mode)
}

main() 