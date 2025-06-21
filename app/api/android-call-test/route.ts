import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This endpoint will help test if the Android app can reach the server
    return NextResponse.json({
      success: true,
      message: 'Android app successfully connected to server',
      timestamp: new Date().toISOString(),
      test_call_data: {
        phone_number: '+919677362524',
        client_name: 'Test Client',
        action: 'initiate_call'
      }
    })

  } catch (error) {
    console.error('❌ Android call test API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 