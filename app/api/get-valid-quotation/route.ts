import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'

export async function GET() {
  try {
    console.log('💰 [GET VALID QUOTATION] Fetching quotations via PostgreSQL...')
    
    // Get existing quotations
    const result = await query(`
      SELECT id, quotation_number, client_name, total_amount, status
      FROM quotations
      ORDER BY id DESC
      LIMIT 10
    `)
    
    const quotations = result.rows
    
    if (!quotations || quotations.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No quotations found in database',
        suggestion: 'Please create a quotation first or use a different quotation ID for testing'
      })
    }
    
    // Return the first (latest) quotation as the valid test ID
    const validQuotation = quotations[0]
    
    console.log(`✅ [GET VALID QUOTATION] Found ${quotations.length} quotations via PostgreSQL. Using ID ${validQuotation.id}`)
    
    return NextResponse.json({
      success: true,
      validQuotationId: validQuotation.id,
      quotationDetails: validQuotation,
      allQuotations: quotations,
      message: `Found ${quotations.length} quotations. Using ID ${validQuotation.id} for testing.`
    })
    
  } catch (error) {
    console.error('❌ Failed to get valid quotation (PostgreSQL):', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      message: 'Failed to get valid quotation ID'
    }, { status: 500 })
  }
} 