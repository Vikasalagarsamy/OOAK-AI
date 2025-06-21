import { NextRequest, NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting quotation details from PostgreSQL...')
    
    const { searchParams } = new URL(request.url)
    const quotationNumber = searchParams.get('quotationNumber')
    
    if (!quotationNumber) {
      return NextResponse.json(
        { error: 'Quotation number is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    // Fetch quotation details with all related data
    const query = `
      SELECT 
        id,
        quotation_number,
        client_name,
        bride_name,
        groom_name,
        mobile,
        email,
        total_amount,
        status,
        created_at,
        quotation_data,
        created_by,
        slug
      FROM quotations
      WHERE quotation_number = $1
    `
    
    const result = await client.query(query, [quotationNumber])
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    const quotation = result.rows[0]
    
    console.log(`✅ Quotation details from PostgreSQL: ${quotation.quotation_number}`)

    // Parse quotation_data if it's a string
    let quotationData = quotation.quotation_data
    if (typeof quotationData === 'string') {
      try {
        quotationData = JSON.parse(quotationData)
      } catch (parseError) {
        console.error('Error parsing quotation_data:', parseError)
        quotationData = { events: [], default_package: 'basic' }
      }
    }

    // Structure the response
    const response = {
      quotation: {
        id: quotation.id.toString(),
        quotation_number: quotation.quotation_number,
        client_name: quotation.client_name,
        bride_name: quotation.bride_name,
        groom_name: quotation.groom_name,
        mobile: quotation.mobile,
        email: quotation.email,
        total_amount: quotation.total_amount,
        status: quotation.status,
        created_at: quotation.created_at,
        quotation_data: quotationData
      },
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 