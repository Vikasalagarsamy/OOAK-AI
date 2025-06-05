import { NextRequest, NextResponse } from 'next/server'
import { fixDatabaseSchema, checkDatabaseSchema } from '@/actions/fix-database-schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'check') {
      const result = await checkDatabaseSchema()
      return NextResponse.json(result)
    } else {
      const result = await fixDatabaseSchema()
      return NextResponse.json(result)
    }
  } catch (error: any) {
    console.error('❌ Database schema API error:', error)
    return NextResponse.json({
      success: false,
      message: 'API call failed',
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database Schema Fix API',
    status: 'operational',
    endpoints: {
      'POST /api/fix-database-schema': 'Fix database schema for AI task integration'
    }
  })
} 