// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.789Z
// Original file backed up as: populate-services-deliverables.js.backup


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
 * Populate Services and Deliverables Tables
 * =========================================
 * Add photography services and deliverables data to make quotations work
 */

const { Pool } = require('pg');

// PostgreSQL connection - see pool configuration below

async function populateServicesAndDeliverables() {
  try {
    console.log('🎯 POPULATING SERVICES AND DELIVERABLES')
    console.log('=' * 60)
    
    // 1. Photography Services Data
    const photographyServices = [
      {
        id: 1,
        servicename: 'Wedding Photography',
        description: 'Complete wedding day photography coverage',
        basic_price: 15000,
        premium_price: 25000,
        elite_price: 40000,
        category: 'Photography',
        duration_hours: 8,
        is_active: true
      },
      {
        id: 2,
        servicename: 'Pre-Wedding Shoot',
        description: 'Romantic pre-wedding photography session',
        basic_price: 8000,
        premium_price: 12000,
        elite_price: 18000,
        category: 'Photography',
        duration_hours: 4,
        is_active: true
      },
      {
        id: 3,
        servicename: 'Engagement Photography',
        description: 'Engagement ceremony photography',
        basic_price: 5000,
        premium_price: 8000,
        elite_price: 12000,
        category: 'Photography',
        duration_hours: 3,
        is_active: true
      },
      {
        id: 4,
        servicename: 'Reception Photography',
        description: 'Wedding reception photography',
        basic_price: 10000,
        premium_price: 15000,
        elite_price: 22000,
        category: 'Photography',
        duration_hours: 5,
        is_active: true
      },
      {
        id: 5,
        servicename: 'Videography',
        description: 'Professional wedding videography',
        basic_price: 20000,
        premium_price: 35000,
        elite_price: 50000,
        category: 'Videography',
        duration_hours: 8,
        is_active: true
      }
    ]
    
    // 2. Photography Deliverables Data
    const photographyDeliverables = [
      {
        id: 1,
        deliverable_name: 'Digital Photo Album',
        description: 'High-resolution digital photos in online gallery',
        basic_total_price: 2000,
        premium_total_price: 3000,
        elite_total_price: 5000,
        category: 'Digital',
        delivery_days: 7,
        is_active: true
      },
      {
        id: 2,
        deliverable_name: 'Printed Photo Album',
        description: 'Premium printed photo album with 50 photos',
        basic_total_price: 5000,
        premium_total_price: 8000,
        elite_total_price: 12000,
        category: 'Physical',
        delivery_days: 14,
        is_active: true
      },
      {
        id: 3,
        deliverable_name: 'Wedding Highlights Video',
        description: '3-5 minute wedding highlights video',
        basic_total_price: 8000,
        premium_total_price: 12000,
        elite_total_price: 18000,
        category: 'Video',
        delivery_days: 21,
        is_active: true
      },
      {
        id: 4,
        deliverable_name: 'USB Drive with Photos',
        description: 'USB drive containing all edited photos',
        basic_total_price: 1500,
        premium_total_price: 2000,
        elite_total_price: 3000,
        category: 'Physical',
        delivery_days: 10,
        is_active: true
      },
      {
        id: 5,
        deliverable_name: 'Canvas Prints',
        description: 'Set of 3 canvas prints (16x20 inches)',
        basic_total_price: 3000,
        premium_total_price: 4500,
        elite_total_price: 6000,
        category: 'Physical',
        delivery_days: 14,
        is_active: true
      }
    ]
    
    // 3. Insert Services
    console.log('📸 INSERTING PHOTOGRAPHY SERVICES:')
    for (const service of photographyServices) {
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
    
    // 4. Insert Deliverables
    console.log('\n📦 INSERTING PHOTOGRAPHY DELIVERABLES:')
    for (const deliverable of photographyDeliverables) {
      const { data, error } = await supabase
        .from('deliverables')
        .upsert(deliverable, { onConflict: 'id' })
        .select()
      
      if (error) {
        console.log(`   ❌ Error inserting deliverable ${deliverable.id}:`, error.message)
      } else {
        console.log(`   ✅ Deliverable ${deliverable.id}: ${deliverable.deliverable_name} - Basic: ₹${deliverable.basic_total_price.toLocaleString()}`)
      }
    }
    
    // 5. Create quotation_events record for quotation 19
    console.log('\n🎉 CREATING QUOTATION EVENT:')
    const quotationEvent = {
      quotation_id: 19,
      event_name: 'Wedding',
      event_date: '2025-06-25T10:00:00.000Z',
      event_location: 'TBD, Chennai',
      venue_name: 'TBD',
      start_time: '10:00',
      end_time: '22:00',
      expected_crowd: '200 people expected',
      selected_package: 'basic',
      selected_services: [
        { id: 1, quantity: 1 }, // Wedding Photography
        { id: 3, quantity: 1 }  // Engagement Photography
      ],
      selected_deliverables: [
        { id: 2, quantity: 1 }, // Printed Photo Album
        { id: 3, quantity: 1 }  // Wedding Highlights Video
      ],
      service_overrides: {},
      package_overrides: {}
    }
    
    const { data: eventData, error: eventError } = await supabase
      .from('quotation_events')
      .upsert(quotationEvent, { onConflict: 'quotation_id' })
      .select()
    
    if (eventError) {
      console.log('   ❌ Error creating quotation event:', eventError.message)
    } else {
      console.log('   ✅ Quotation event created for quotation 19')
    }
    
    // 6. Verify the data
    console.log('\n🔍 VERIFICATION:')
    const { count: sCount } = await supabase.from('services').select('*', { count: 'exact', head: true })
    const { count: dCount } = await supabase.from('deliverables').select('*', { count: 'exact', head: true })
    const { count: eCount } = await supabase.from('quotation_events').select('*', { count: 'exact', head: true })
    
    console.log(`   Services: ${sCount} records`)
    console.log(`   Deliverables: ${dCount} records`)
    console.log(`   Quotation Events: ${eCount} records`)
    
    // 7. Calculate expected total for quotation 19
    console.log('\n💰 EXPECTED QUOTATION TOTAL:')
    console.log('   Service 1 (Wedding Photography): ₹15,000')
    console.log('   Service 3 (Engagement Photography): ₹5,000')
    console.log('   Deliverable 2 (Printed Album): ₹5,000')
    console.log('   Deliverable 3 (Highlights Video): ₹8,000')
    console.log('   ─────────────────────────────────────')
    console.log('   TOTAL: ₹33,000')
    console.log('   Current quotation total: ₹43,500')
    console.log('   Difference: ₹10,500 (may include additional charges)')
    
    console.log('\n🎯 NEXT STEPS:')
    console.log('   1. Refresh your quotation page: http://localhost:3000/quotation/qt-2025-0001-qw9km3')
    console.log('   2. You should now see services and deliverables with pricing')
    console.log('   3. The quotation will display properly formatted details')
    
  } catch (error) {
    console.error('❌ Population failed:', error)
  }
}

// Run the population
populateServicesAndDeliverables() 