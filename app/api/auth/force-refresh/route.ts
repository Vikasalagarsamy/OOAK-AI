import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * 🔄 FORCE SESSION REFRESH API
 * 
 * This endpoint helps resolve cross-machine authentication issues by:
 * - Clearing all auth cookies
 * - Returning session status
 * - Forcing a clean authentication state
 */

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear all auth-related cookies
    const authCookies = ['auth_token', 'session_token', 'user_session', 'ultra_auth']
    
    authCookies.forEach(cookieName => {
      cookieStore.delete(cookieName)
    })

    console.log('🔄 Force refresh: All auth cookies cleared')

    return NextResponse.json({
      success: true,
      message: 'Session cleared successfully',
      action: 'Please log in again',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Force refresh error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear session'
    }, { status: 500 })
  }
}

export async function GET() {
  // Return instructions for manual cleanup
  return NextResponse.json({
    instructions: {
      step1: 'Open browser developer tools (F12)',
      step2: 'Go to Application/Storage tab',
      step3: 'Clear all data for portal.ooak.photography',
      step4: 'Close and reopen browser',
      step5: 'Try logging in again',
      note: 'Or use POST request to this endpoint to auto-clear'
    }
  })
} 