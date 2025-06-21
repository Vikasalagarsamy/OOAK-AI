// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.542Z
// Original file backed up as: scripts/fix-quotation-totals.mjs.backup


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
const { Pool } = require('pg');

// PostgreSQL connection - see pool configuration below

async function fixQuotationTotals() {
  console.log('🔧 FIXING QUOTATION TOTALS...\n')

  try {
    // Get all quotations
    const { data: quotations, error: fetchError } = await supabase
      .from('quotations')
      .select('*')

    if (fetchError) {
      console.error('❌ Error fetching quotations:', fetchError)
      return
    }

    if (!quotations || quotations.length === 0) {
      console.log('ℹ️ No quotations found')
      return
    }

    console.log(`📊 Found ${quotations.length} quotations to check`)

    // Get services and deliverables data
    const { data: services } = await supabase
      .from('quotation_services')
      .select('*')

    const { data: deliverables } = await supabase
      .from('quotation_deliverables')
      .select('*')

    console.log(`📋 Services: ${services?.length || 0}, Deliverables: ${deliverables?.length || 0}`)

    let updatedCount = 0

    for (const quotation of quotations) {
      try {
        console.log(`\n🔍 Checking quotation ${quotation.quotation_number} (${quotation.client_name})`)
        console.log(`   Current stored total: ₹${quotation.total_amount}`)

        const quotationData = quotation.quotation_data
        if (!quotationData || !quotationData.events) {
          console.log('   ⚠️ No quotation data found, skipping')
          continue
        }

        // Calculate correct total
        let newTotal = 0

        for (const event of quotationData.events) {
          const packageType = event.selected_package === "default" ? quotationData.default_package : event.selected_package
          
          // Services total for this event
          const eventServices = event.selected_services?.length > 0 ? event.selected_services : quotationData.selected_services || []
          const servicesTotal = eventServices.reduce((sum, serviceItem) => {
            const service = services?.find(s => s.id === serviceItem.id)
            if (!service) return sum
            
            const priceKey = `${packageType}_price`
            const basePrice = service[priceKey] || 0
            return sum + (basePrice * serviceItem.quantity)
          }, 0)

          // Deliverables total for this event  
          const eventDeliverables = event.selected_deliverables?.length > 0 ? event.selected_deliverables : quotationData.selected_deliverables || []
          const deliverablesTotal = eventDeliverables.reduce((sum, deliverableItem) => {
            const deliverable = deliverables?.find(d => d.id === deliverableItem.id)
            if (!deliverable) return sum
            
            const priceKey = `${packageType}_price`
            const basePrice = deliverable[priceKey] || 0
            return sum + (basePrice * deliverableItem.quantity)
          }, 0)

          console.log(`   Event: Services ₹${servicesTotal} + Deliverables ₹${deliverablesTotal} = ₹${servicesTotal + deliverablesTotal}`)
          newTotal += servicesTotal + deliverablesTotal
        }

        console.log(`   ✅ Calculated correct total: ₹${newTotal}`)

        // Update if different
        if (Math.abs(newTotal - quotation.total_amount) > 0.01) {
          console.log(`   🔄 Updating: ₹${quotation.total_amount} → ₹${newTotal}`)
          
          const { error: updateError } = await supabase
            .from('quotations')
            .update({ 
              total_amount: newTotal,
              updated_at: new Date().toISOString()
            })
            .eq('id', quotation.id)
          
          if (updateError) {
            console.error(`   ❌ Error updating:`, updateError)
          } else {
            console.log(`   ✅ Updated successfully`)
            updatedCount++
          }
        } else {
          console.log(`   ✅ Total is already correct`)
        }

      } catch (error) {
        console.error(`   ❌ Error processing quotation ${quotation.quotation_number}:`, error)
      }
    }

    console.log(`\n🎉 COMPLETED! Updated ${updatedCount} quotations`)
    console.log('\nNow all reports should show the correct totals including deliverables.')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixQuotationTotals() 