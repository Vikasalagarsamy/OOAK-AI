import { NextResponse } from 'next/server'

/**
 * 🔍 DEBUG ENVIRONMENT VARIABLES
 * 
 * This diagnostic endpoint shows what Supabase configuration is being used
 * to help debug the localhost connection issue
 */

export async function GET() {
  try {
    const envInfo = {
      // Check what environment variables are available
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (hidden)' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      
      // Check if any other Supabase-related env vars exist
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('supabase') || 
        key.toLowerCase().includes('database') ||
        key.toLowerCase().includes('db')
      ),

      // Runtime check
      currentTime: new Date().toISOString(),
      platform: process.platform,
    }

    return NextResponse.json({
      status: 'Environment check complete',
      environment: envInfo,
      diagnosis: {
        issue: 'If NEXT_PUBLIC_SUPABASE_URL is not set or pointing to localhost, that explains the connection error',
        expectedProduction: 'Should be PostgreSQL connection string',
        currentlyTrying: 'http://127.0.0.1:54321 (from console logs)'
      }
    })

  } catch (error) {
    console.error('Environment check error:', error)
    return NextResponse.json({
      error: 'Environment check failed',
      details: error
    }, { status: 500 })
  }
} 