// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.788Z
// Original file backed up as: scripts/add-package-pricing-to-services.js.backup


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

async function addPackagePricingColumns() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Please check your environment variables.')
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    console.log('Available keys:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
    process.exit(1)
  }

  // PostgreSQL connection - see pool configuration below

  try {
    console.log('🔄 Checking current services table structure...')
    
    // First, let's check if services table exists and see its current structure
    const { data: existingServices, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .limit(1)

    if (fetchError) {
      console.error('❌ Error checking services table:', fetchError)
      
      // If table doesn't exist, create it
      console.log('🔄 Services table might not exist. Creating it...')
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            servicename VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            description TEXT,
            category VARCHAR(100),
            price DECIMAL(10,2),
            unit VARCHAR(50),
            basic_price DECIMAL(10,2),
            premium_price DECIMAL(10,2),
            elite_price DECIMAL(10,2),
            package_included JSONB DEFAULT '{"basic": false, "premium": false, "elite": false}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      })
      
      if (createTableError) {
        console.error('❌ Error creating services table:', createTableError)
        process.exit(1)
      } else {
        console.log('✅ Services table created successfully')
      }
    } else {
      console.log('✅ Services table exists')
      
      // Check if package pricing columns already exist
      if (existingServices && existingServices.length > 0) {
        const service = existingServices[0]
        const hasPackageColumns = 'basic_price' in service && 'premium_price' in service && 'elite_price' in service && 'package_included' in service
        
        if (hasPackageColumns) {
          console.log('✅ Package pricing columns already exist!')
        } else {
          console.log('🔄 Adding package pricing columns...')
          
          // Add columns using SQL
          const alterQueries = [
            'ALTER TABLE services ADD COLUMN IF NOT EXISTS basic_price DECIMAL(10,2);',
            'ALTER TABLE services ADD COLUMN IF NOT EXISTS premium_price DECIMAL(10,2);',
            'ALTER TABLE services ADD COLUMN IF NOT EXISTS elite_price DECIMAL(10,2);',
            'ALTER TABLE services ADD COLUMN IF NOT EXISTS package_included JSONB DEFAULT \'{"basic": false, "premium": false, "elite": false}\';'
          ]
          
          for (const query of alterQueries) {
            const { error } = await supabasequery('SELECT exec_sql( sql: query )')
            if (error) {
              console.error(`❌ Error executing: ${query}`, error)
            } else {
              console.log(`✅ Executed: ${query.split(' ')[5]}`) // Get column name
            }
          }
        }
      }
    }
    
    // Add sample package pricing data for existing services
    console.log('🔄 Adding sample package pricing data...')
    
    const samplePricingUpdates = [
      {
        servicename: 'CANDID PHOTOGRAPHY',
        basic_price: 15000,
        premium_price: 25000,
        elite_price: 35000,
        package_included: { basic: true, premium: true, elite: true }
      },
      {
        servicename: 'CONVENTIONAL PHOTOGRAPHY',
        basic_price: 12000,
        premium_price: 18000,
        elite_price: 25000,
        package_included: { basic: true, premium: true, elite: true }
      },
      {
        servicename: 'CANDID VIDEOGRAPHY',
        basic_price: 25000,
        premium_price: 40000,
        elite_price: 60000,
        package_included: { basic: true, premium: true, elite: true }
      },
      {
        servicename: 'CONVENTIONAL VIDEOGRAPHY',
        basic_price: 20000,
        premium_price: 30000,
        elite_price: 45000,
        package_included: { basic: true, premium: true, elite: true }
      }
    ]
    
    for (const update of samplePricingUpdates) {
      const { error } = await supabase
        .from('services')
        .update({
          basic_price: update.basic_price,
          premium_price: update.premium_price,
          elite_price: update.elite_price,
          package_included: update.package_included
        })
        .eq('servicename', update.servicename)
      
      if (error) {
        console.error(`❌ Error updating ${update.servicename}:`, error)
      } else {
        console.log(`✅ Updated pricing for ${update.servicename}`)
      }
    }

    // Verify the changes
    const { data: services, error: verifyError } = await supabase
      .from('services')
      .select('id, servicename, basic_price, premium_price, elite_price, package_included')
      .limit(5)

    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError)
    } else {
      console.log('✅ Package pricing columns added successfully!')
      console.log('📊 Sample services with package pricing:')
      if (services && services.length > 0) {
        services.forEach(service => {
          console.log(`  - ${service.servicename}: Basic=₹${service.basic_price || 0}, Premium=₹${service.premium_price || 0}, Elite=₹${service.elite_price || 0}`)
        })
      } else {
        console.log('  No services found. Try importing some sample data first.')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
addPackagePricingColumns().then(() => {
  console.log('🎉 Migration completed!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
}) 