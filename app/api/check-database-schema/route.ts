import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseSchema } from '@/actions/fix-database-schema'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checking database schema...')
    
    const result = await checkDatabaseSchema()
    
    console.log('📊 Schema check result:', result)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Schema check error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      checks: {
        ai_tasks_table: false,
        employees_name_column: false
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database Schema Check API',
    status: 'operational',
    endpoints: {
      'POST /api/check-database-schema': 'Check if database schema is ready for AI tasks'
    }
  })
} 