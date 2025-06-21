#!/usr/bin/env node

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// PostgreSQL configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

async function execSQL(sql) {
  const client = await pool.connect()
  try {
    const result = await client.query(sql)
    return { data: result.rows, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  } finally {
    client.release()
  }
}

async function runMigration() {
  console.log('🚀 Starting Deliverable Architecture Migration (PostgreSQL)...\n')

  try {
    // Test connection
    const { error: connectionError } = await execSQL('SELECT 1 as test')
    if (connectionError) {
      throw new Error(`Failed to connect to PostgreSQL: ${connectionError}`)
    }
    
    console.log('✅ Connected to PostgreSQL')
    console.log(`📍 Database: ${process.env.POSTGRES_DATABASE || 'ooak_future'}`)
    
    // Step 1: Create new tables
    console.log('\n📊 Step 1: Creating new deliverable catalog and workflow tables...')
    
    const createTablesSQL = fs.readFileSync(path.join(__dirname, '../sql/create-deliverable-architecture.sql'), 'utf8')
    
    const { error: createError } = await execSQL(createTablesSQL)
    
    if (createError) {
      console.error('❌ Error creating tables:', createError)
      throw new Error(createError)
    }
    
    console.log('✅ New tables created successfully')
    
    // Step 2: Check existing data
    console.log('\n📊 Step 2: Checking existing deliverables data...')
    
    const { data: existingDeliverables, error: existingError } = await execSQL(`
      SELECT id, deliverable_name, deliverable_cat, deliverable_type, process_name
      FROM deliverables 
      WHERE status = 1 
      LIMIT 5
    `)
    
    if (existingError) {
      console.error('❌ Error checking existing data:', existingError)
      throw new Error(existingError)
    }
    
    console.log(`✅ Found ${existingDeliverables?.length || 0} existing deliverable records`)
    if (existingDeliverables?.length > 0) {
      existingDeliverables.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.deliverable_name} (${item.deliverable_cat}/${item.deliverable_type}) - Process: ${item.process_name}`)
      })
    }
    
    // Step 3: Migrate catalog data
    console.log('\n📊 Step 3: Migrating catalog data...')
    
    const catalogMigrationSQL = `
      INSERT INTO deliverable_catalog (
          deliverable_name,
          deliverable_category,
          deliverable_type,
          basic_price,
          premium_price,
          elite_price,
          package_included,
          status,
          created_date,
          created_by
      )
      SELECT DISTINCT
          d.deliverable_name,
          d.deliverable_cat as deliverable_category,
          d.deliverable_type,
          COALESCE(MAX(d.basic_price), 0) as basic_price,
          COALESCE(MAX(d.premium_price), 0) as premium_price,
          COALESCE(MAX(d.elite_price), 0) as elite_price,
          COALESCE(MAX(d.package_included), '{"basic": false, "premium": false, "elite": false}'::jsonb) as package_included,
          1 as status,
          MIN(d.created_date) as created_date,
          MIN(d.created_by) as created_by
      FROM deliverables d
      WHERE d.status = 1
        AND d.deliverable_name IS NOT NULL
        AND d.deliverable_name != ''
      GROUP BY d.deliverable_name, d.deliverable_cat, d.deliverable_type
      ON CONFLICT (deliverable_name, deliverable_category, deliverable_type) DO NOTHING;
    `
    
    const { error: catalogError } = await execSQL(catalogMigrationSQL)
    
    if (catalogError) {
      console.error('❌ Error migrating catalog data:', catalogError)
      throw new Error(catalogError)
    }
    
    // Check catalog results
    const { data: catalogData, error: catalogCheckError } = await execSQL(`
      SELECT id, deliverable_name, deliverable_category, deliverable_type
      FROM deliverable_catalog
    `)
    
    if (catalogCheckError) {
      console.error('❌ Error checking catalog data:', catalogCheckError)
    } else {
      console.log(`✅ Migrated ${catalogData?.length || 0} unique deliverables to catalog`)
    }
    
    // Step 4: Migrate workflow data
    console.log('\n📊 Step 4: Migrating workflow data...')
    
    const workflowMigrationSQL = `
      INSERT INTO deliverable_workflows (
          deliverable_catalog_id,
          process_name,
          sort_order,
          has_customer,
          has_employee,
          has_qc,
          has_vendor,
          timing_type,
          tat,
          tat_value,
          buffer,
          skippable,
          has_download_option,
          has_task_process,
          has_upload_folder_path,
          process_starts_from,
          on_start_template,
          on_complete_template,
          on_correction_template,
          employee,
          input_names,
          link,
          stream,
          stage,
          process_basic_price,
          process_premium_price,
          process_elite_price,
          status,
          created_date,
          created_by
      )
      SELECT 
          dc.id as deliverable_catalog_id,
          d.process_name,
          COALESCE(d.sort_order, 1) as sort_order,
          COALESCE(d.has_customer, false) as has_customer,
          COALESCE(d.has_employee, false) as has_employee,
          COALESCE(d.has_qc, false) as has_qc,
          COALESCE(d.has_vendor, false) as has_vendor,
          COALESCE(d.timing_type, 'days') as timing_type,
          d.tat,
          d.tat_value,
          d.buffer,
          COALESCE(d.skippable, false) as skippable,
          COALESCE(d.has_download_option, false) as has_download_option,
          COALESCE(d.has_task_process, true) as has_task_process,
          COALESCE(d.has_upload_folder_path, false) as has_upload_folder_path,
          COALESCE(d.process_starts_from, 1) as process_starts_from,
          d.on_start_template,
          d.on_complete_template,
          d.on_correction_template,
          COALESCE(d.employee, '[]'::jsonb) as employee,
          COALESCE(d.input_names, '[]'::jsonb) as input_names,
          d.link,
          d.stream,
          d.stage,
          CASE 
              WHEN d.basic_price != dc.basic_price THEN d.basic_price 
              ELSE NULL 
          END as process_basic_price,
          CASE 
              WHEN d.premium_price != dc.premium_price THEN d.premium_price 
              ELSE NULL 
          END as process_elite_price,
          CASE 
              WHEN d.elite_price != dc.elite_price THEN d.elite_price 
              ELSE NULL 
          END as process_elite_price,
          d.status,
          d.created_date,
          d.created_by
      FROM deliverables d
      JOIN deliverable_catalog dc ON (
          dc.deliverable_name = d.deliverable_name 
          AND dc.deliverable_category = d.deliverable_cat 
          AND dc.deliverable_type = d.deliverable_type
      )
      WHERE d.status = 1
        AND d.process_name IS NOT NULL
        AND d.process_name != ''
      ORDER BY d.deliverable_name, d.sort_order;
    `
    
    const { error: workflowError } = await execSQL(workflowMigrationSQL)
    
    if (workflowError) {
      console.error('❌ Error migrating workflow data:', workflowError)
      throw new Error(workflowError)
    }
    
    // Check workflow results
    const { data: workflowData, error: workflowCheckError } = await execSQL(`
      SELECT id, process_name, deliverable_catalog_id
      FROM deliverable_workflows
    `)
    
    if (workflowCheckError) {
      console.error('❌ Error checking workflow data:', workflowCheckError)
    } else {
      console.log(`✅ Migrated ${workflowData?.length || 0} workflow processes`)
    }
    
    // Step 5: Verification
    console.log('\n📊 Step 5: Migration verification...')
    
    const { data: summary, error: summaryError } = await execSQL(`
      SELECT 
        dc.deliverable_name, 
        dc.deliverable_category, 
        dc.deliverable_type,
        COUNT(dw.id) as workflow_count
      FROM deliverable_catalog dc
      LEFT JOIN deliverable_workflows dw ON dc.id = dw.deliverable_catalog_id
      GROUP BY dc.id, dc.deliverable_name, dc.deliverable_category, dc.deliverable_type
      ORDER BY dc.deliverable_name
    `)
    
    if (summaryError) {
      console.error('❌ Error getting summary:', summaryError)
    } else {
      console.log(`✅ Migration Summary:`)
      console.log(`   📦 Catalog items: ${summary?.length || 0}`)
      const totalWorkflows = summary?.reduce((acc, item) => acc + (parseInt(item.workflow_count) || 0), 0) || 0
      console.log(`   ⚙️ Total workflows: ${totalWorkflows}`)
      
      if (summary && summary.length > 0) {
        console.log('\n📋 Migrated deliverables:')
        summary.forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.deliverable_name} (${item.deliverable_category}/${item.deliverable_type}) - ${item.workflow_count} workflow(s)`)
        })
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('\n🚀 Next steps:')
    console.log('   1. Test the new deliverable catalog page')
    console.log('   2. Test the workflow management page')
    console.log('   3. Verify all data is working correctly')
    console.log('   4. After testing, you can optionally rename/remove the old deliverables table')
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Execute migration
if (require.main === module) {
  runMigration()
}