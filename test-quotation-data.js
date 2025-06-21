// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.375Z
// Original file backed up as: test-quotation-data.js.backup


// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


// Query helper function
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('❌ PostgreSQL Query Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Transaction helper function  
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return { data: result, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Transaction Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Original content starts here:
#!/usr/bin/env node

/**
 * Test Quotation Data Loading
 * ===========================
 * Check what data is actually loaded for quotation qt-2025-0001-qw9km3
 */

const { Pool } = require('pg');

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'

async function testQuotationData() {
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('🔍 TESTING QUOTATION DATA LOADING')
    console.log('=' * 60)
    
    const slug = 'qt-2025-0001-qw9km3'
    
    // 1. Test the exact query used by getQuotationBySlug
    console.log(`Testing quotation slug: ${slug}`)
    
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        *,
        leads (
          lead_number,
          client_name
        ),
        quotation_events (*)
      `)
      .eq('slug', slug)
      .single()
    
    console.log('\n📋 QUOTATION QUERY RESULT:')
    console.log('Error:', error)
    
    if (quotation) {
      console.log('\n✅ QUOTATION FOUND:')
      console.log(`   ID: ${quotation.id}`)
      console.log(`   Number: ${quotation.quotation_number}`)
      console.log(`   Client: ${quotation.client_name}`)
      console.log(`   Total Amount: ₹${quotation.total_amount?.toLocaleString()}`)
      console.log(`   Status: ${quotation.status}`)
      console.log(`   Events Count: ${quotation.events_count}`)
      
      console.log('\n📊 QUOTATION DATA STRUCTURE:')
      if (quotation.quotation_data) {
        const qData = quotation.quotation_data
        console.log(`   Events: ${qData.events?.length || 0}`)
        console.log(`   Default Package: ${qData.default_package}`)
        console.log(`   Selected Services: ${qData.selected_services?.length || 0}`)
        console.log(`   Selected Deliverables: ${qData.selected_deliverables?.length || 0}`)
        
        if (qData.events && qData.events.length > 0) {
          const event = qData.events[0]
          console.log('\n🎉 FIRST EVENT:')
          console.log(`   Name: ${event.event_name}`)
          console.log(`   Date: ${event.event_date}`)
          console.log(`   Location: ${event.event_location}`)
          console.log(`   Package: ${event.selected_package}`)
          console.log(`   Services: ${event.selected_services?.length || 0}`)
          console.log(`   Deliverables: ${event.selected_deliverables?.length || 0}`)
          
          if (event.selected_services && event.selected_services.length > 0) {
            console.log('\n🛠️  SELECTED SERVICES:')
            event.selected_services.forEach((service, index) => {
              console.log(`   ${index + 1}. Service ID: ${service.id}, Quantity: ${service.quantity}`)
            })
          } else {
            console.log('\n❌ NO SERVICES SELECTED')
          }
          
          if (event.selected_deliverables && event.selected_deliverables.length > 0) {
            console.log('\n📦 SELECTED DELIVERABLES:')
            event.selected_deliverables.forEach((deliverable, index) => {
              console.log(`   ${index + 1}. Deliverable ID: ${deliverable.id}, Quantity: ${deliverable.quantity}`)
            })
          } else {
            console.log('\n❌ NO DELIVERABLES SELECTED')
          }
        } else {
          console.log('\n❌ NO EVENTS FOUND')
        }
      } else {
        console.log('\n❌ NO QUOTATION_DATA FOUND')
      }
      
      console.log('\n🗃️  QUOTATION EVENTS TABLE:')
      if (quotation.quotation_events && quotation.quotation_events.length > 0) {
        quotation.quotation_events.forEach((event, index) => {
          console.log(`   Event ${index + 1}: ${event.event_name}`)
          console.log(`   Services: ${event.selected_services?.length || 0}`)
          console.log(`   Deliverables: ${event.selected_deliverables?.length || 0}`)
        })
      } else {
        console.log('   ❌ No events in quotation_events table')
      }
      
    } else {
      console.log('❌ QUOTATION NOT FOUND')
    }
    
    // 2. Check if services and deliverables tables exist and have data
    console.log('\n🛠️  CHECKING SERVICES TABLE:')
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, servicename, basic_price, premium_price, elite_price')
      .limit(5)
    
    if (servicesError) {
      console.log('   Error:', servicesError.message)
    } else {
      console.log(`   Found ${services?.length || 0} services`)
      services?.forEach(service => {
        console.log(`   • ${service.servicename}: Basic ₹${service.basic_price}, Premium ₹${service.premium_price}, Elite ₹${service.elite_price}`)
      })
    }
    
    console.log('\n📦 CHECKING DELIVERABLES TABLE:')
    const { data: deliverables, error: deliverablesError } = await supabase
      .from('deliverables')
      .select('id, deliverable_name, basic_total_price, premium_total_price, elite_total_price')
      .limit(5)
    
    if (deliverablesError) {
      console.log('   Error:', deliverablesError.message)
    } else {
      console.log(`   Found ${deliverables?.length || 0} deliverables`)
      deliverables?.forEach(deliverable => {
        console.log(`   • ${deliverable.deliverable_name}: Basic ₹${deliverable.basic_total_price}, Premium ₹${deliverable.premium_total_price}, Elite ₹${deliverable.elite_total_price}`)
      })
    }
    
    return quotation
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testQuotationData() 