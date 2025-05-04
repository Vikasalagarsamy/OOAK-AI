import { createClient } from "@supabase/supabase-js"

async function checkLeadSourceColumn() {
  console.log("Checking if lead_source column exists in the leads table...")

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

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
