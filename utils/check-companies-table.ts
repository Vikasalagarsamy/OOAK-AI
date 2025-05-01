import { supabase } from "@/lib/supabase"

export async function checkCompaniesTable() {
  try {
    // Try to get the structure of the companies table
    // If it doesn't exist, this will return an error
    const { error: tableCheckError } = await supabase.from("companies").select("id").limit(1)

    // If we get a specific error about the relation not existing, the table doesn't exist
    const tableExists = !tableCheckError || !tableCheckError.message.includes('relation "companies" does not exist')

    if (!tableExists) {
      console.log("Companies table does not exist, creating it...")

      // Create the companies table using raw SQL
      const { error: createTableError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          company_code VARCHAR(20) NOT NULL UNIQUE,
          address TEXT,
          city VARCHAR(100),
          state VARCHAR(100),
          postal_code VARCHAR(20),
          country VARCHAR(100),
          phone VARCHAR(20),
          email VARCHAR(255),
          website VARCHAR(255),
          status VARCHAR(20) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      if (createTableError) {
        console.error("Error creating companies table:", createTableError)
        return false
      }

      // Add a sample company
      const { error: insertError } = await supabase.from("companies").insert([
        {
          name: "Sample Company",
          company_code: "SAMPLE001",
          address: "123 Main St",
          city: "Sample City",
          state: "Sample State",
          postal_code: "12345",
          country: "Sample Country",
          status: "ACTIVE",
        },
      ])

      if (insertError) {
        console.error("Error inserting sample company:", insertError)
        return false
      }

      console.log("Companies table created and sample company added")
      return true
    }

    return true
  } catch (error) {
    console.error("Error in checkCompaniesTable:", error)
    return false
  }
}
