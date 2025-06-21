import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    return NextResponse.json({
      env_check: {
        supabaseUrl: {
          exists: !!supabaseUrl,
          length: supabaseUrl?.length,
          starts_with: supabaseUrl?.substring(0, 30)
        },
        supabaseServiceKey: {
          exists: !!supabaseServiceKey,
          length: supabaseServiceKey?.length,
          starts_with: supabaseServiceKey?.substring(0, 20),
          ends_with: supabaseServiceKey?.substring(-10)
        },
        all_env_keys: Object.keys(process.env).filter(key => 
          key.includes('SUPABASE') || key.includes('supabase')
        )
      }
    })

  } catch (error) {
    console.error('Debug env error:', error)
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    )
  }
} 