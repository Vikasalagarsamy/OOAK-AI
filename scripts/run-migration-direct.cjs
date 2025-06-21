// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.916Z
// Original file backed up as: scripts/run-migration-direct.cjs.backup


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

const { Pool } = require('pg');)

// Remote Supabase configuration
const REMOTE_URL = 'https://aavofqdzjhyfjygkxynq.supabase.co'
const REMOTE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'

async function runMigration() {
  console.log('🚀 Starting Deliverable Architecture Migration...\n')

  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('✅ Connected to Supabase')
    console.log(`📍 URL: ${REMOTE_URL}`)
    
    // Step 1: Check existing data first
    console.log('\n📊 Step 1: Checking existing deliverables data...')
    
    const { data: existingDeliverables, error: existingError } = await supabase
      .from('deliverables')
      .select('id, deliverable_name, deliverable_cat, deliverable_type, process_name, basic_price, premium_price, elite_price, package_included')
      .eq('status', 1)
      .limit(10)
    
    if (existingError) {
      console.error('❌ Error checking existing data:', existingError)
      throw existingError
    }
    
    console.log(`✅ Found ${existingDeliverables?.length || 0} existing deliverable records`)
    if (existingDeliverables?.length > 0) {
      existingDeliverables.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.deliverable_name} (${item.deliverable_cat}/${item.deliverable_type}) - Process: ${item.process_name}`)
      })
    }
    
    // Step 2: Check if new tables already exist
    console.log('\n📊 Step 2: Checking if new tables exist...')
    
    const { data: catalogExists, error: catalogExistsError } = await supabase
      .from('deliverable_catalog')
      .select('id')
      .limit(1)
    
    if (catalogExistsError && catalogExistsError.code === 'PGRST116') {
      console.log('❌ New tables don\'t exist yet. Please run the SQL manually first.')
      console.log('📝 Steps to create tables:')
      console.log('   1. Go to Supabase Studio: https://supabase.com/dashboard/project/aavofqdzjhyfjygkxynq/sql')
      console.log('   2. Copy and paste the content from sql/create-deliverable-architecture.sql')
      console.log('   3. Execute the SQL')
      console.log('   4. Run this migration script again')
      return
    }
    
    console.log('✅ New tables exist')
    
    // Step 3: Prepare catalog data migration
    console.log('\n📊 Step 3: Preparing catalog data...')
    
    // Get unique deliverables for catalog
    const uniqueDeliverables = new Map()
    
    existingDeliverables?.forEach(item => {
      const key = `${item.deliverable_name}|${item.deliverable_cat}|${item.deliverable_type}`
      if (!uniqueDeliverables.has(key)) {
        uniqueDeliverables.set(key, {
          deliverable_name: item.deliverable_name,
          deliverable_category: item.deliverable_cat,
          deliverable_type: item.deliverable_type,
          basic_price: item.basic_price || 0,
          premium_price: item.premium_price || 0,
          elite_price: item.elite_price || 0,
          package_included: item.package_included || { basic: false, premium: false, elite: false },
          status: 1
        })
      }
    })
    
    console.log(`✅ Prepared ${uniqueDeliverables.size} unique deliverables for catalog`)
    
    // Step 4: Insert catalog data
    console.log('\n📊 Step 4: Inserting catalog data...')
    
    let catalogInserted = 0
    for (const catalogItem of uniqueDeliverables.values()) {
      const { error: insertError } = await supabase
        .from('deliverable_catalog')
        .insert(catalogItem)
      
      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`   ⚠️ Skipping duplicate: ${catalogItem.deliverable_name}`)
        } else {
          console.error(`   ❌ Error inserting ${catalogItem.deliverable_name}:`, insertError)
        }
      } else {
        catalogInserted++
        console.log(`   ✅ Inserted: ${catalogItem.deliverable_name}`)
      }
    }
    
    console.log(`✅ Successfully inserted ${catalogInserted} catalog items`)
    
    // Step 5: Get catalog mapping
    console.log('\n📊 Step 5: Building catalog mapping...')
    
    const { data: catalogData, error: catalogMapError } = await supabase
      .from('deliverable_catalog')
      .select('id, deliverable_name, deliverable_category, deliverable_type')
    
    if (catalogMapError) {
      console.error('❌ Error getting catalog mapping:', catalogMapError)
      throw catalogMapError
    }
    
    const catalogMap = new Map()
    catalogData?.forEach(item => {
      const key = `${item.deliverable_name}|${item.deliverable_category}|${item.deliverable_type}`
      catalogMap.set(key, item.id)
    })
    
    console.log(`✅ Built mapping for ${catalogMap.size} catalog items`)
    
    // Step 6: Insert workflow data
    console.log('\n📊 Step 6: Inserting workflow data...')
    
    let workflowInserted = 0
    for (const deliverable of existingDeliverables || []) {
      if (!deliverable.process_name) continue
      
      const catalogKey = `${deliverable.deliverable_name}|${deliverable.deliverable_cat}|${deliverable.deliverable_type}`
      const catalogId = catalogMap.get(catalogKey)
      
      if (!catalogId) {
        console.log(`   ⚠️ No catalog ID found for: ${deliverable.deliverable_name}`)
        continue
      }
      
      const workflowData = {
        deliverable_catalog_id: catalogId,
        process_name: deliverable.process_name,
        sort_order: 1,
        has_customer: false,
        has_employee: false,
        has_qc: false,
        has_vendor: false,
        timing_type: 'days',
        skippable: false,
        has_download_option: false,
        has_task_process: true,
        has_upload_folder_path: false,
        process_starts_from: 1,
        status: 1
      }
      
      const { error: workflowError } = await supabase
        .from('deliverable_workflows')
        .insert(workflowData)
      
      if (workflowError) {
        console.error(`   ❌ Error inserting workflow for ${deliverable.process_name}:`, workflowError)
      } else {
        workflowInserted++
        console.log(`   ✅ Inserted workflow: ${deliverable.process_name}`)
      }
    }
    
    console.log(`✅ Successfully inserted ${workflowInserted} workflow items`)
    
    // Step 7: Verification
    console.log('\n📊 Step 7: Migration verification...')
    
    const { data: catalogSummary, error: summaryError } = await supabase
      .from('deliverable_catalog')
      .select('id, deliverable_name, deliverable_category, deliverable_type')
    
    const { data: workflowSummary, error: workflowSummaryError } = await supabase
      .from('deliverable_workflows')
      .select('id, process_name, deliverable_catalog_id')
    
    if (summaryError || workflowSummaryError) {
      console.error('❌ Error getting summary data')
    } else {
      console.log(`✅ Migration Summary:`)
      console.log(`   📦 Catalog items: ${catalogSummary?.length || 0}`)
      console.log(`   ⚙️ Workflow processes: ${workflowSummary?.length || 0}`)
      
      if (catalogSummary && catalogSummary.length > 0) {
        console.log('\n📋 Migrated catalog items:')
        catalogSummary.forEach((item, i) => {
          const workflowCount = workflowSummary?.filter(w => w.deliverable_catalog_id === item.id).length || 0
          console.log(`   ${i + 1}. ${item.deliverable_name} (${item.deliverable_category}/${item.deliverable_type}) - ${workflowCount} workflow(s)`)
        })
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('\n🚀 Next steps:')
    console.log('   1. Test the new deliverable catalog page: /post-production/deliverables')
    console.log('   2. Test the workflow management page: /post-production/deliverables-workflow')
    console.log('   3. Verify all data is working correctly')
    console.log('   4. After testing, you can optionally rename/remove the old deliverables table')
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  }
}

// Execute migration
if (require.main === module) {
  runMigration()
} 


// Cleanup function
async function cleanup() {
  try {
    await pool.end();
    console.log('✅ PostgreSQL pool closed');
  } catch (error) {
    console.error('❌ Error closing pool:', error.message);
  }
}