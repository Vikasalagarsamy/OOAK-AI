#!/usr/bin/env node

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function setupDatabase() {
  console.log('🚀 Setting up OOAK database for Render...')
  
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    // Test connection
    const client = await pool.connect()
    console.log('✅ Database connection successful')
    
    // Check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)
    
    console.log(`📊 Found ${result.rows.length} existing tables:`)
    result.rows.forEach(row => console.log(`  - ${row.table_name}`))
    
    if (result.rows.length === 0) {
      console.log('🔧 No tables found, database needs initialization')
      console.log('📝 You may need to run database migrations manually')
    } else {
      console.log('✅ Database appears to be initialized')
    }
    
    client.release()
    console.log('🎉 Database setup check completed successfully!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupDatabase()
