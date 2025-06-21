import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-unified'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    // Find Vikas's employee ID
    const { data: vikas } = await supabase
      .from('employees')
      .select('id')
      .eq('name', 'Vikas Alagarsamy')
      .single()

    if (!vikas) {
      return NextResponse.json({
        success: false,
        error: 'Vikas Alagarsamy not found in employees table'
      }, { status: 404 })
    }

    // Update the Jothi Alagarsamy quotation to be assigned to Vikas
    const { data: updatedQuotation, error } = await supabase
      .from('quotations')
      .update({ 
        assigned_to: vikas.id,
        status: 'pending_approval'  // Change from draft to pending
      })
      .eq('client_name', 'Jothi Alagarsamy')
      .select()

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update quotation: ' + error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Assigned quotation to Vikas (ID: ${vikas.id})`,
      updated_quotation: updatedQuotation?.[0]
    })
  } catch (error) {
    console.error('❌ Error fixing quotation assignment:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 