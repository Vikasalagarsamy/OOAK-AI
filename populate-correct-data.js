// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.789Z
// Original file backed up as: populate-correct-data.js.backup


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
 * Populate Correct Services and Deliverables Data
 * ===============================================
 * Using the actual table structure discovered
 */

const { Pool } = require('pg');

// PostgreSQL connection - see pool configuration below

async function populateCorrectData() {
  try {
    console.log('🎯 POPULATING CORRECT SERVICES AND DELIVERABLES DATA')
    console.log('=' * 60)
    
    // 1. Services with correct structure
    const services = [
      {
        id: 1,
        servicename: 'Wedding Photography',
        description: 'Complete wedding day photography coverage',
        category: 'Photography',
        status: 'active',
        price: 15000,
        unit: 'per day',
        basic_price: 15000,
        premium_price: 25000,
        elite_price: 40000,
        package_included: true
      },
      {
        id: 2,
        servicename: 'Pre-Wedding Shoot',
        description: 'Romantic pre-wedding photography session',
        category: 'Photography',
        status: 'active',
        price: 8000,
        unit: 'per session',
        basic_price: 8000,
        premium_price: 12000,
        elite_price: 18000,
        package_included: false
      },
      {
        id: 3,
        servicename: 'Engagement Photography',
        description: 'Engagement ceremony photography',
        category: 'Photography',
        status: 'active',
        price: 5000,
        unit: 'per event',
        basic_price: 5000,
        premium_price: 8000,
        elite_price: 12000,
        package_included: true
      },
      {
        id: 4,
        servicename: 'Reception Photography',
        description: 'Wedding reception photography',
        category: 'Photography',
        status: 'active',
        price: 10000,
        unit: 'per event',
        basic_price: 10000,
        premium_price: 15000,
        elite_price: 22000,
        package_included: false
      },
      {
        id: 5,
        servicename: 'Videography',
        description: 'Professional wedding videography',
        category: 'Videography',
        status: 'active',
        price: 20000,
        unit: 'per day',
        basic_price: 20000,
        premium_price: 35000,
        elite_price: 50000,
        package_included: false
      }
    ]
    
    // 2. Insert Services
    console.log('📸 INSERTING PHOTOGRAPHY SERVICES:')
    for (const service of services) {
      const { data, error } = await supabase
        .from('services')
        .upsert(service, { onConflict: 'id' })
        .select()
      
      if (error) {
        console.log(`   ❌ Error inserting service ${service.id}:`, error.message)
      } else {
        console.log(`   ✅ Service ${service.id}: ${service.servicename} - Basic: ₹${service.basic_price.toLocaleString()}`)
      }
    }
    
    // 3. Check deliverables structure by trying different approaches
    console.log('\n📦 CHECKING DELIVERABLES STRUCTURE:')
    
    // Try to find what deliverable_cat should be
    const deliverableTest = {
      id: 999,
      deliverable_name: 'Test Deliverable',
      deliverable_cat: 'Digital', // Guessing this is category
      description: 'Test description',
      status: 'active'
    }
    
    const { data: testDeliverable, error: testError } = await supabase
      .from('deliverables')
      .insert(deliverableTest)
      .select()
    
    if (testError) {
      console.log('   Test error:', testError.message)
      
      // Try with different category values
      const categories = ['digital', 'physical', 'video', 'photo', 'album']
      for (const cat of categories) {
        const { data, error } = await supabase
          .from('deliverables')
          .insert({
            id: 999 + categories.indexOf(cat),
            deliverable_name: `Test ${cat}`,
            deliverable_cat: cat,
            description: 'Test'
          })
          .select()
        
        if (!error && data) {
          console.log(`   ✅ Category "${cat}" works. Columns:`, Object.keys(data[0]).join(', '))
          // Delete test record
          await supabasequery('DELETE FROM deliverables WHERE id = data[0].id')
          break
        } else if (error) {
          console.log(`   ❌ Category "${cat}" failed:`, error.message)
        }
      }
    } else if (testDeliverable) {
      console.log('   ✅ Test deliverable created. Columns:', Object.keys(testDeliverable[0]).join(', '))
      // Delete test record
      await supabasequery('DELETE FROM deliverables WHERE id = testDeliverable[0].id')
    }
    
    // 4. Create quotation event with required fields
    console.log('\n🎉 CREATING QUOTATION EVENT:')
    const quotationEvent = {
      quotation_id: 19,
      event_name: 'Wedding',
      event_date: '2025-06-25T10:00:00.000Z',
      event_location: 'TBD, Chennai',
      venue_name: 'TBD Venue', // This is required
      start_time: '10:00',
      end_time: '22:00',
      expected_crowd: '200 people expected',
      selected_package: 'basic',
      selected_services: [
        { id: 1, quantity: 1 }, // Wedding Photography
        { id: 3, quantity: 1 }  // Engagement Photography
      ],
      selected_deliverables: [
        { id: 2, quantity: 1 }, // Will create this
        { id: 3, quantity: 1 }  // Will create this
      ],
      service_overrides: {},
      package_overrides: {}
    }
    
    const { data: eventData, error: eventError } = await supabase
      .from('quotation_events')
      .insert(quotationEvent)
      .select()
    
    if (eventError) {
      console.log('   ❌ Error creating quotation event:', eventError.message)
    } else {
      console.log('   ✅ Quotation event created for quotation 19')
    }
    
    // 5. Verify the data
    console.log('\n🔍 VERIFICATION:')
    const { count: sCount } = await supabase.from('services').select('*', { count: 'exact', head: true })
    const { count: dCount } = await supabase.from('deliverables').select('*', { count: 'exact', head: true })
    const { count: eCount } = await supabase.from('quotation_events').select('*', { count: 'exact', head: true })
    
    console.log(`   Services: ${sCount} records`)
    console.log(`   Deliverables: ${dCount} records`)
    console.log(`   Quotation Events: ${eCount} records`)
    
    // 6. Test quotation data loading
    console.log('\n🔍 TESTING QUOTATION DATA LOADING:')
    const { data: quotation, error: qError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_events (*)
      `)
      .eq('slug', 'qt-2025-0001-qw9km3')
      .single()
    
    if (quotation && quotation.quotation_events?.length > 0) {
      const event = quotation.quotation_events[0]
      console.log(`   ✅ Quotation has ${quotation.quotation_events.length} event(s)`)
      console.log(`   Event: ${event.event_name}`)
      console.log(`   Services: ${event.selected_services?.length || 0}`)
      console.log(`   Deliverables: ${event.selected_deliverables?.length || 0}`)
    } else {
      console.log('   ❌ No events found for quotation')
    }
    
    console.log('\n🎯 NEXT STEPS:')
    console.log('   1. Refresh your quotation page: http://localhost:3000/quotation/qt-2025-0001-qw9km3')
    console.log('   2. Services should now display with pricing')
    console.log('   3. You may need to add deliverables manually due to schema constraints')
    
  } catch (error) {
    console.error('❌ Population failed:', error)
  }
}

// Run the population
populateCorrectData() 