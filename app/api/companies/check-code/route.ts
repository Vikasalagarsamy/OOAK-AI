import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Company code is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 API: Checking company code uniqueness: ${code}`)
    
    const result = await query(
      "SELECT id FROM companies WHERE company_code = $1 LIMIT 1",
      [code]
    )

    const exists = result.rows && result.rows.length > 0
    
    console.log(`${exists ? '❌' : '✅'} API: Company code ${code} ${exists ? 'exists' : 'is unique'}`)
    
    return NextResponse.json({
      success: true,
      exists,
      unique: !exists
    })
    
  } catch (error) {
    console.error('❌ API: Error checking company code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check company code' },
      { status: 500 }
    )
  }
}
