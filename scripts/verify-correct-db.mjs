// Test which database connection has the actual data
import { createClient as createNormalClient } from '@supabase/supabase-js'

console.log('🔍 TESTING BOTH DATABASE CONNECTIONS...\n')

// Connection 1: Normal client (like Business Intelligence Service)
const normalClient = createNormalClient(
  'https://fmrmgfqaadjtdxywscpz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcm1nZnFhYWRqdGR4eXdzY3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjAwNzEsImV4cCI6MjA0ODE5NjA3MX0.69dEF5kMm8_Z-Tql7K3V1_uGGMYJshCLIQKLrTPqLF8'
)

// Connection 2: Service client (might have different data or access)
const serviceClient = createNormalClient(
  'https://fmrmgfqaadjtdxywscpz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcm1nZnFhYWRqdGR4eXdzY3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjAwNzEsImV4cCI6MjA0ODE5NjA3MX0.69dEF5kMm8_Z-Tql7K3V1_uGGMYJshCLIQKLrTPqLF8'
)

async function testConnections() {
  try {
    console.log('📋 NORMAL CLIENT (Business Intelligence):')
    const { data: normalQuotations } = await normalClient
      .from('quotations')
      .select('client_name, total_amount, status')
    
    console.log(`   Quotations: ${normalQuotations?.length || 0}`)
    normalQuotations?.forEach(q => {
      console.log(`   - ${q.client_name}: ₹${q.total_amount} (${q.status})`)
    })

    console.log('\n📋 SERVICE CLIENT (Team Performance):')
    const { data: serviceQuotations } = await serviceClient
      .from('quotations')
      .select('client_name, total_amount, status')
    
    console.log(`   Quotations: ${serviceQuotations?.length || 0}`)
    serviceQuotations?.forEach(q => {
      console.log(`   - ${q.client_name}: ₹${q.total_amount} (${q.status})`)
    })

    // Check employees table with both clients
    console.log('\n👥 NORMAL CLIENT - Employees:')
    const { data: normalEmployees } = await normalClient
      .from('employees')
      .select('id, name, department')
      .eq('department', 'SALES')
    
    console.log(`   Employees: ${normalEmployees?.length || 0}`)
    normalEmployees?.forEach(emp => {
      console.log(`   - ${emp.name} (ID: ${emp.id})`)
    })

    console.log('\n👥 SERVICE CLIENT - Employees:')
    const { data: serviceEmployees } = await serviceClient
      .from('employees')
      .select('id, name, department')
      .eq('department', 'SALES')
    
    console.log(`   Employees: ${serviceEmployees?.length || 0}`)
    serviceEmployees?.forEach(emp => {
      console.log(`   - ${emp.name} (ID: ${emp.id})`)
    })

    // If we found the data, let's also check the structure
    if (normalQuotations && normalQuotations.length > 0) {
      console.log('\n🔍 FOUND DATA! Structure analysis:')
      const sample = normalQuotations[0]
      console.log(`   Sample quotation structure:`, Object.keys(sample))
      
      // Get full record to see all fields
      const { data: fullRecord } = await normalClient
        .from('quotations')
        .select('*')
        .limit(1)
      
      console.log(`   Full record fields:`, Object.keys(fullRecord?.[0] || {}))
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testConnections() 