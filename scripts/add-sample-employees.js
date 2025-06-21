// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.919Z
// Original file backed up as: scripts/add-sample-employees.js.backup


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
const { Pool } = require('pg');)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// PostgreSQL connection - see pool configuration below

async function addSampleEmployees() {
  try {
    console.log('Adding sample employees...')

    // Check current employees count
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })

    console.log('Current employees count:', count)

    // Sample employees data
    const sampleEmployees = [
      {
        first_name: 'John',
        last_name: 'Smith',
        name: 'John Smith',
        email: 'john.smith@example.com',
        department: 'Post Production',
        job_title: 'Video Editor',
        status: 'active',
        is_active: true,
      },
      {
        first_name: 'Jane',
        last_name: 'Johnson',
        name: 'Jane Johnson',
        email: 'jane.johnson@example.com',
        department: 'Post Production',
        job_title: 'Photo Editor',
        status: 'active',
        is_active: true,
      },
      {
        first_name: 'Mike',
        last_name: 'Williams',
        name: 'Mike Williams',
        email: 'mike.williams@example.com',
        department: 'Quality Control',
        job_title: 'QC Specialist',
        status: 'active',
        is_active: true,
      },
      {
        first_name: 'Sarah',
        last_name: 'Brown',
        name: 'Sarah Brown',
        email: 'sarah.brown@example.com',
        department: 'Design',
        job_title: 'Graphic Designer',
        status: 'active',
        is_active: true,
      },
      {
        first_name: 'Alex',
        last_name: 'Davis',
        name: 'Alex Davis',
        email: 'alex.davis@example.com',
        department: 'Post Production',
        job_title: 'Motion Graphics Artist',
        status: 'active',
        is_active: true,
      },
    ]

    // Add employees if table is empty or has very few records
    if (!count || count < 3) {
      const { data, error } = await supabase
        .from('employees')
        .insert(sampleEmployees)
        .select()

      if (error) {
        console.error('Error adding sample employees:', error)
        
        // If the first approach fails, try with minimal fields
        console.log('Trying with minimal fields...')
        const minimalEmployees = sampleEmployees.map(emp => ({
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
        }))

        const { data: data2, error: error2 } = await supabase
          .from('employees')
          .insert(minimalEmployees)
          .select()

        if (error2) {
          console.error('Error with minimal fields too:', error2)
          return
        }

        console.log('Added employees with minimal fields:', data2?.length || 0)
      } else {
        console.log('Added sample employees:', data?.length || 0)
      }
    } else {
      console.log('Employees table already has data, skipping sample data insertion')
    }

    // Test the employee query that our application will use
    console.log('\nTesting employee queries...')
    
    // Test query 1: first_name, last_name approach
    const { data: test1, error: error1 } = await supabase
      .from('employees')
      .select('id, first_name, last_name, department, job_title, status')
      .in('status', ['active', 'Active', 'ACTIVE'])
      .limit(5)

    if (!error1) {
      console.log('Query 1 (first_name, last_name) success:', test1?.length || 0, 'employees found')
      if (test1?.length > 0) {
        console.log('Sample:', test1[0])
      }
    } else {
      console.log('Query 1 failed:', error1.message)
    }

    // Test query 2: name field approach
    const { data: test2, error: error2 } = await supabase
      .from('employees')
      .select('id, name, department')
      .eq('is_active', true)
      .limit(5)

    if (!error2) {
      console.log('Query 2 (name field) success:', test2?.length || 0, 'employees found')
      if (test2?.length > 0) {
        console.log('Sample:', test2[0])
      }
    } else {
      console.log('Query 2 failed:', error2.message)
    }

    console.log('\nEmployee setup complete!')

  } catch (error) {
    console.error('Error in addSampleEmployees:', error)
  }
}

addSampleEmployees() 