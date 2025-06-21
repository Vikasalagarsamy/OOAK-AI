"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateEmployeeCompaniesTable() {
  try {
    const supabase = createClient()

    // Read the SQL file content
    const sqlContent = `
    -- Add start_date, end_date, and project_id columns to employee_companies table if they don't exist
    DO $$
    BEGIN
        -- Add start_date column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'employee_companies' AND column_name = 'start_date') THEN
            ALTER TABLE employee_companies ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
            -- Update existing records to have a start date
            UPDATE employee_companies SET start_date = CURRENT_DATE WHERE start_date IS NULL;
        END IF;

        -- Add end_date column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'employee_companies' AND column_name = 'end_date') THEN
            ALTER TABLE employee_companies ADD COLUMN end_date DATE;
        END IF;

        -- Add project_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'employee_companies' AND column_name = 'project_id') THEN
            ALTER TABLE employee_companies ADD COLUMN project_id INTEGER;
        END IF;

        -- Add status column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'employee_companies' AND column_name = 'status') THEN
            ALTER TABLE employee_companies ADD COLUMN status VARCHAR(50) DEFAULT 'active';
        END IF;
    END $$;
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      console.error("Error updating employee_companies table:", error)
      return { success: false, error: error.message }
    }

    // Revalidate all employee pages
    revalidatePath("/people/employees")

    return { success: true, message: "Employee companies table updated successfully" }
  } catch (error: any) {
    console.error("Error in updateEmployeeCompaniesTable:", error)
    return { success: false, error: error.message }
  }
}
