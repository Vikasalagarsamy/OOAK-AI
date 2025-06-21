import { NextResponse } from "next/server"
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET() {
  try {
    // Check JWT token exists
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify JWT
    try {
      const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
      const secretKey = new TextEncoder().encode(secret)
      
      const { payload } = await jwtVerify(authToken, secretKey, {
        algorithms: ["HS256"],
      })
      
      console.log('✅ JWT verified for user:', payload.username)
      
      // Get all tasks for now (simplified)
      const { createClient } = await import('@/lib/supabase')
      const { query, transaction } = createClient()
      
      const { data: tasks, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('❌ Database error:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      console.log(`✅ Returning ${tasks?.length || 0} tasks`)
      return NextResponse.json(tasks || [])
      
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 