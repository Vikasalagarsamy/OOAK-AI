import { NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

export async function GET() {
  try {
    // Test PostgreSQL environment
    const envCheck = {
      POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
      POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432'),
      POSTGRES_USER: process.env.POSTGRES_USER || 'vikasalagarsamy',
      POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || 'ooak_future',
      CONNECTION_TYPE: 'Direct PostgreSQL'
    }
    
    console.log('🐘 PostgreSQL Environment Check:', envCheck)
    
    // Test PostgreSQL connection
    const client = await pool.connect();
    
    try {
      // Test a simple query
      const result = await client.query('SELECT id, name FROM companies LIMIT 3');
      
      console.log('🐘 Test query result:', {
        rowCount: result.rowCount,
        firstCompany: result.rows[0]
      })
      
      return NextResponse.json({
        success: true,
        environment: envCheck,
        testQuery: {
          error: null,
          dataCount: result.rowCount || 0,
          data: result.rows || []
        },
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('🐘 PostgreSQL connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      environment: {
        POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
        POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432'),
        POSTGRES_USER: process.env.POSTGRES_USER || 'vikasalagarsamy',
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || 'ooak_future',
        CONNECTION_TYPE: 'Direct PostgreSQL'
      },
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    })
  }
} 