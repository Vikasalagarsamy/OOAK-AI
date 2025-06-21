import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-unified'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    console.log('🔧 Fixing quotation ownership issue...')
    
    // Generate a UUID for Vikas Alagarsamy (employee ID 87)
    // We'll use a deterministic UUID based on his employee ID
    const vikasUUID = "87000000-0000-0000-0000-000000000000"
    
    // 1. Update the Jothi Alagarsamy quotation to be assigned to Vikas
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({ 
        created_by: vikasUUID,  // Use UUID format for Vikas
        status: 'draft'  // Keep as draft for now (valid status)
      })
      .eq('id', 19)
      .select()
      
    if (updateError) {
      console.error('❌ Error updating quotation:', updateError)
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 })
    }
    
    console.log('✅ Updated quotation:', updatedQuotation)
    
    // 2. Verify the fix
    const { data: verification } = await supabase
      .from('quotations')
      .select('id, client_name, total_amount, status, created_by')
      .eq('id', 19)
      .single()
      
    console.log('🔍 Verification after fix:', verification)
    
    return NextResponse.json({
      success: true,
      message: 'Quotation ownership fixed successfully',
      before: {
        created_by: null,
        status: 'draft'
      },
      after: {
        created_by: verification?.created_by,
        status: verification?.status,
        total_amount: verification?.total_amount
      },
      vikas_uuid: vikasUUID,
      verification: verification
    })
    
  } catch (error: any) {
    console.error('❌ Error fixing quotation ownership:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 