import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  try {
    // Check database connection
    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    await pool.end()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'ooak-production',
      database: 'connected',
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'ooak-production',
      database: 'disconnected',
      environment: process.env.NODE_ENV,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 503
    })
  }
}
