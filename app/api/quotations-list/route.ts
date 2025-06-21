import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting quotations data from PostgreSQL...')
    
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    console.log('📋 Fetching quotations with status filter:', status)

    // Check for JWT token in cookies (same as working APIs)
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    
    if (!authToken) {
      console.log('❌ No JWT token found in cookies')
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)
    
    const { payload } = await jwtVerify(authToken, secretKey, {
      algorithms: ["HS256"],
    })
    
    console.log('✅ JWT token verified for user:', payload.username, 'userId:', payload.sub)
    
    if (!payload.sub) {
      console.log('❌ No user ID in JWT payload')
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    console.log(`🔍 Filtering quotations for employee: ${payload.sub} (${payload.username})`)

    const client = await pool.connect()

    // Get quotations with approvals data in a single query
    const query = `
      SELECT 
        q.id,
        q.quotation_number,
        q.slug,
        q.client_name,
        q.bride_name,
        q.groom_name,
        q.total_amount,
        q.status,
        q.created_by,
        q.created_at,
        q.quotation_data,
        -- Aggregate approval data
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN qa.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', qa.id,
                  'approval_status', qa.approval_status,
                  'comments', qa.comments,
                  'created_at', qa.created_at,
                  'updated_at', qa.updated_at
                )
              ELSE NULL
            END
          ) FILTER (WHERE qa.id IS NOT NULL), 
          '[]'::json
        ) as quotation_approvals
      FROM quotations q
      LEFT JOIN quotation_approvals qa ON q.id = qa.quotation_id
      WHERE q.created_by = $1
      GROUP BY q.id, q.quotation_number, q.slug, q.client_name, q.bride_name, 
               q.groom_name, q.total_amount, q.status, q.created_by, 
               q.created_at, q.quotation_data
      ORDER BY q.created_at DESC
    `

    const result = await client.query(query, [payload.sub])
    client.release()

    let quotations = result.rows

    // Filter quotations based on status
    let filteredQuotations = quotations
    
    if (status === 'rejected') {
      // Filter for quotations that have been rejected
      filteredQuotations = quotations.filter(q => {
        // Check if quotation status is rejected OR has any rejected approvals
        const hasRejectedApproval = q.quotation_approvals?.some((approval: any) => 
          approval.approval_status === 'rejected'
        )
        return q.status === 'rejected' || hasRejectedApproval
      })
      
      console.log(`🔍 Found ${filteredQuotations.length} rejected quotations out of ${quotations.length} total`)
      
      // Debug log the rejected quotations
      filteredQuotations.forEach(q => {
        console.log(`📝 Rejected: ${q.quotation_number} - Status: ${q.status}`)
        q.quotation_approvals?.forEach((approval: any) => {
          if (approval.approval_status === 'rejected') {
            console.log(`   ❌ Rejection: ${approval.comments} on ${approval.updated_at}`)
          }
        })
      })
      
    } else if (status) {
      // Filter by exact status match
      filteredQuotations = quotations.filter(q => q.status === status)
    }

    console.log(`✅ Quotations data from PostgreSQL: ${filteredQuotations.length} quotations for status: ${status || 'all'}`)

    return NextResponse.json({ 
      success: true, 
      quotations: filteredQuotations,
      total: filteredQuotations.length,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error in quotations list API:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
} 