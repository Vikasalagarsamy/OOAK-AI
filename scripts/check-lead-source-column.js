// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.553Z
// Original file backed up as: scripts/check-lead-source-column.js.backup


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

async function checkLeadSourceColumn() {
  console.log("Checking if lead_source column exists in the leads table...")

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    return
  }

  // PostgreSQL connection - see pool configuration below

  try {
    // Query information_schema to check if the column exists
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "leads")
      .eq("column_name", "lead_source")

    if (error) {
      console.error("Error checking schema:", error)
      return
    }

    if (data && data.length > 0) {
      console.log("✅ lead_source column exists in the leads table")
      console.log("Column details:", data[0])
    } else {
      console.log("❌ lead_source column does NOT exist in the leads table")

      // Get all columns in the leads table for reference
      console.log("\nListing all columns in the leads table:")
      const { data: allColumns, error: columnsError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type")
        .eq("table_name", "leads")
        .order("ordinal_position")

      if (columnsError) {
        console.error("Error fetching columns:", columnsError)
        return
      }

      if (allColumns && allColumns.length > 0) {
        console.table(allColumns)
      } else {
        console.log("No columns found or leads table does not exist")
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error)
  }
}

// Execute the function
checkLeadSourceColumn()
