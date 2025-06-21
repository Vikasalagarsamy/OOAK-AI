import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client-unified'

const supabaseUrl = "postgresql://localhost:5432/database" // PostgreSQL connection
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwMjc1MDYsImV4cCI6MjA0NzYwMzUwNn0.lYNdKH0x-mfaVkb4zjuF_sVG-FgLO9V60mKa6bABxEQ'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Creating test quotation...')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test quotation data
    const quotationData = {
      client_name: 'Jothi Alagarsamy',
      bride_name: 'Jothi',
      groom_name: 'Alagarsamy',
      mobile: '+919677362525',
      mobile_country_code: '+91',
      whatsapp: '+919677362525',
      whatsapp_country_code: '+91',
      email: 'jothi.alagarsamy@example.com',
      events: [
        {
          id: 'event-1',
          event_name: 'Wedding Ceremony',
          event_date: '2024-12-15',
          event_location: 'Chennai',
          venue_name: 'Grand Palace',
          start_time: '10:00',
          end_time: '18:00',
          expected_crowd: '200-300',
          selected_package: 'premium',
          selected_services: [
            { id: 1, quantity: 1 },
            { id: 2, quantity: 2 }
          ],
          selected_deliverables: [
            { id: 1, quantity: 1 },
            { id: 2, quantity: 1 }
          ],
          service_overrides: {},
          package_overrides: {}
        }
      ],
      default_package: 'premium',
      selected_services: [
        { id: 1, quantity: 1 },
        { id: 2, quantity: 2 }
      ],
      selected_deliverables: [
        { id: 1, quantity: 1 },
        { id: 2, quantity: 1 }
      ],
      service_overrides: {},
      package_overrides: {},
      custom_services: []
    }

    // Check if quotation already exists
    const { data: existingQuotation } = await supabase
      .from('quotations')
      .select('*')
      .eq('client_name', 'Jothi Alagarsamy')
      .single()

    if (existingQuotation) {
      // Update existing quotation with correct user assignment
      const { data: updatedQuotation, error: updateError } = await supabase
        .from('quotations')
        .update({
          created_by: '87',  // Vikas's employee ID as string
          assigned_to: 87,   // Vikas's employee ID as number  
          status: 'pending_approval',
          total_amount: 43500
        })
        .eq('id', existingQuotation.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating quotation:', updateError)
        return NextResponse.json({ 
          success: false, 
          error: updateError.message 
        }, { status: 500 })
      }

      console.log('✅ Updated existing quotation')
      return NextResponse.json({ 
        success: true, 
        message: 'Updated existing quotation',
        quotation: updatedQuotation
      })
    } else {
      // Create new quotation
      const { data: newQuotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          quotation_number: `QUO-${Date.now()}`,
          slug: `jothi-alagarsamy-${Date.now()}`,
          client_name: 'Jothi Alagarsamy',
          bride_name: 'Jothi',
          groom_name: 'Alagarsamy',
          mobile: '+919677362525',
          email: 'jothi.alagarsamy@example.com',
          default_package: 'premium',
          total_amount: 43500,
          status: 'pending_approval',
          created_by: '87',  // Vikas's employee ID as string
          assigned_to: 87,   // Vikas's employee ID as number
          quotation_data: quotationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (quotationError) {
        console.error('❌ Error creating quotation:', quotationError)
        return NextResponse.json({ 
          success: false, 
          error: quotationError.message 
        }, { status: 500 })
      }

      console.log('✅ Created new quotation')
      return NextResponse.json({ 
        success: true, 
        message: 'Created new quotation',
        quotation: newQuotation
      })
    }

  } catch (error) {
    console.error('❌ Error in test create quotation:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 