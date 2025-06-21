import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { createServerClient } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  console.log('🔍 [DEBUG NOTIFICATIONS] Starting debug endpoint...')
  
  try {
    console.log('🔍 [DEBUG NOTIFICATIONS] Step 1: Calling getCurrentUser...')
    const currentUser = await getCurrentUser()
    console.log('🔍 [DEBUG NOTIFICATIONS] getCurrentUser result:', currentUser)
    
    if (!currentUser) {
      console.log('❌ [DEBUG NOTIFICATIONS] No current user found')
      return NextResponse.json({ 
        error: 'Unauthorized', 
        step: 'getCurrentUser',
        details: 'currentUser is null/undefined'
      }, { status: 401 })
    }

    console.log('✅ [DEBUG NOTIFICATIONS] User found:', {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email
    })

    console.log('🔍 [DEBUG NOTIFICATIONS] Step 2: Creating Supabase client...')
    const supabase = createServerClient()
    
    console.log('🔍 [DEBUG NOTIFICATIONS] Step 3: Testing simple query...')
    const { data: testData, error: testError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ [DEBUG NOTIFICATIONS] Supabase connection error:', testError)
      return NextResponse.json({
        error: 'Database connection failed',
        step: 'supabase_test',
        details: testError
      }, { status: 500 })
    }

    console.log('✅ [DEBUG NOTIFICATIONS] Database connection successful')

    return NextResponse.json({
      success: true,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email
      },
      database_accessible: true
    })

  } catch (error: any) {
    console.error('❌ [DEBUG NOTIFICATIONS] Exception:', error)
    return NextResponse.json({
      error: 'Server error',
      step: 'exception',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 