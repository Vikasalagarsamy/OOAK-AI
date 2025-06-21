import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-unified'

export async function GET(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    // Query quotation ID 19 directly
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', 19)
      .single()
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      quotation: quotation,
      key_fields: {
        id: quotation?.id,
        client_name: quotation?.client_name,
        total_amount: quotation?.total_amount,
        created_by: quotation?.created_by,
        assigned_to: quotation?.assigned_to,
        status: quotation?.status
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 