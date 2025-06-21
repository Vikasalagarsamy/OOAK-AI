#!/usr/bin/env node

// Supabase Configuration Switcher
// ===============================

const fs = require('fs')
const path = require('path')

const CONFIGS = {
  local: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  },
  remote: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://aavofqdzjhyfjygkxynq.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTg5MTQsImV4cCI6MjA2MDY3NDkxNH0.wLxD0Tcp5YnpErGSYGF5mmO78V4zIlCvFSeBrPFy9kY',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
  }
}

function updateEnvironmentFile(configType) {
  const envFile = '.env copy.local'
  
  try {
    // Read current env file
    let envContent = fs.readFileSync(envFile, 'utf8')
    
    // Update Supabase configuration
    const config = CONFIGS[configType]
    
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_URL=.*/,
      `NEXT_PUBLIC_SUPABASE_URL=${config.NEXT_PUBLIC_SUPABASE_URL}`
    )
    
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${config.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    )
    
    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${config.SUPABASE_SERVICE_ROLE_KEY}`
    )
    
    // Add environment marker
    envContent = envContent.replace(
      /GENERATED_AT=.*/,
      `GENERATED_AT=${new Date().toISOString()}`
    )
    
    envContent += `\n# SUPABASE_MODE=${configType.toUpperCase()}\n`
    
    // Write updated content
    fs.writeFileSync(envFile, envContent)
    
    console.log(`✅ Successfully switched to ${configType.toUpperCase()} Supabase configuration`)
    console.log(`📍 URL: ${config.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`🔑 Key: ${config.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`)
    
    if (configType === 'local') {
      console.log('\n💡 LOCAL MODE ACTIVE:')
      console.log('   • Using local Supabase instance (127.0.0.1:54321)')
      console.log('   • All data comes from your local database')
      console.log('   • Changes won\'t affect production')
      console.log('   • Studio: http://127.0.0.1:54323')
    } else {
      console.log('\n🌐 REMOTE MODE ACTIVE:')
      console.log('   • Using remote Supabase production instance')
      console.log('   • All data comes from live database')
      console.log('   • Changes will affect production!')
      console.log('   • Studio: https://supabase.com/dashboard')
    }
    
    console.log('\n🔄 Next steps:')
    console.log('   1. Restart your Next.js development server')
    console.log('   2. Verify the connection in your browser')
    
  } catch (error) {
    console.error('❌ Error updating environment file:', error.message)
  }
}

function main() {
  const mode = process.argv[2]
  
  if (!mode || !['local', 'remote'].includes(mode)) {
    console.log('🔧 Supabase Configuration Switcher')
    console.log('==================================')
    console.log()
    console.log('Usage: node switch-supabase-config.cjs [local|remote]')
    console.log()
    console.log('Examples:')
    console.log('  node switch-supabase-config.cjs local   # Switch to local development')
    console.log('  node switch-supabase-config.cjs remote  # Switch to production')
    console.log()
    return
  }
  
  console.log(`🔄 Switching to ${mode.toUpperCase()} Supabase configuration...`)
  updateEnvironmentFile(mode)
}

main() 