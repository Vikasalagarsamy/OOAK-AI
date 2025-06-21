import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')
    
    console.log('🔍 Debug Auth State:')
    console.log('- Has auth_token cookie:', !!authToken?.value)
    console.log('- Cookie value length:', authToken?.value?.length || 0)
    
    const currentUser = await getCurrentUser()
    
    return NextResponse.json({
      hasAuthToken: !!authToken?.value,
      tokenLength: authToken?.value?.length || 0,
      currentUser: currentUser ? {
        id: currentUser.id,
        username: currentUser.username,
        roleName: currentUser.roleName,
        employeeId: currentUser.employeeId
      } : null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 