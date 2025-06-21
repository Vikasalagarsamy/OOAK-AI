"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function fixLeadFollowupsTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 [LEAD_FOLLOWUPS] Starting lead_followups table fix via PostgreSQL...")

    const result = await transaction(async (client) => {
      // First, let's check if the lead_followups table exists
      console.log("🔍 [LEAD_FOLLOWUPS] Checking if lead_followups table exists...")
      
      try {
        const tableCheckResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'lead_followups'
          )
        `)
        
        const tableExists = tableCheckResult.rows[0]?.exists

        if (!tableExists) {
          console.log("➕ [LEAD_FOLLOWUPS] Table does not exist, creating it...")

          // Create the table with all necessary columns
          const createTableSQL = `
            CREATE TABLE lead_followups (
              id SERIAL PRIMARY KEY,
              lead_id INTEGER NOT NULL,
              scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
              completed_at TIMESTAMP WITH TIME ZONE,
              contact_method TEXT NOT NULL DEFAULT 'phone',
              interaction_summary TEXT,
              status TEXT NOT NULL DEFAULT 'scheduled',
              outcome TEXT,
              notes TEXT,
              priority TEXT NOT NULL DEFAULT 'medium',
              created_by TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
              updated_by TEXT,
              updated_at TIMESTAMP WITH TIME ZONE,
              completed_by TEXT,
              duration_minutes INTEGER,
              follow_up_required BOOLEAN DEFAULT FALSE,
              next_follow_up_date TIMESTAMP WITH TIME ZONE,
              
              -- Add constraints and indexes for better performance
              CONSTRAINT lead_followups_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled', 'pending')),
              CONSTRAINT lead_followups_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
              CONSTRAINT lead_followups_contact_method_check CHECK (contact_method IN ('phone', 'email', 'whatsapp', 'in_person', 'video_call'))
            )
          `

          await client.query(createTableSQL)
          console.log("✅ [LEAD_FOLLOWUPS] Successfully created lead_followups table")

          // Create indexes for better performance
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_lead_followups_lead_id ON lead_followups(lead_id);
            CREATE INDEX IF NOT EXISTS idx_lead_followups_scheduled_at ON lead_followups(scheduled_at);
            CREATE INDEX IF NOT EXISTS idx_lead_followups_status ON lead_followups(status);
            CREATE INDEX IF NOT EXISTS idx_lead_followups_created_at ON lead_followups(created_at);
          `)
          console.log("✅ [LEAD_FOLLOWUPS] Created performance indexes")

          return {
            success: true,
            message: "Successfully created lead_followups table with all columns and indexes"
          }
        }

        console.log("✅ [LEAD_FOLLOWUPS] Table exists, checking column structure...")

        // Check current columns in the table
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'lead_followups'
          ORDER BY ordinal_position
        `)

        const existingColumns = columnsResult.rows.map((row: any) => row.column_name)
        console.log(`🔍 [LEAD_FOLLOWUPS] Found existing columns: ${existingColumns.join(', ')}`)

        // Check if followup_type exists but contact_method doesn't
        if (existingColumns.includes("followup_type") && !existingColumns.includes("contact_method")) {
          console.log("🔄 [LEAD_FOLLOWUPS] Migrating followup_type to contact_method...")
          
          // Add contact_method column and copy data from followup_type
          await client.query(`
            ALTER TABLE lead_followups ADD COLUMN contact_method TEXT
          `)
          
          await client.query(`
            UPDATE lead_followups SET contact_method = followup_type WHERE followup_type IS NOT NULL
          `)
          
          await client.query(`
            UPDATE lead_followups SET contact_method = 'phone' WHERE contact_method IS NULL
          `)
          
          await client.query(`
            ALTER TABLE lead_followups ALTER COLUMN contact_method SET NOT NULL
          `)

          console.log("✅ [LEAD_FOLLOWUPS] Successfully migrated followup_type to contact_method")
          
          return {
            success: true,
            message: "Successfully added contact_method column and migrated data from followup_type"
          }
        }

        // Check if neither column exists
        if (!existingColumns.includes("followup_type") && !existingColumns.includes("contact_method")) {
          console.log("➕ [LEAD_FOLLOWUPS] Adding missing contact_method column...")
          
          await client.query(`
            ALTER TABLE lead_followups ADD COLUMN contact_method TEXT NOT NULL DEFAULT 'phone'
          `)

          console.log("✅ [LEAD_FOLLOWUPS] Successfully added contact_method column")
          
          return {
            success: true,
            message: "Successfully added contact_method column with default value"
          }
        }

        // Check for other missing essential columns and add them
        const requiredColumns = [
          { name: 'scheduled_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false },
          { name: 'status', type: 'TEXT', nullable: false, default: "'scheduled'" },
          { name: 'priority', type: 'TEXT', nullable: false, default: "'medium'" },
          { name: 'created_by', type: 'TEXT', nullable: false },
          { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, default: 'NOW()' }
        ]

        let columnsAdded = 0
        for (const col of requiredColumns) {
          if (!existingColumns.includes(col.name)) {
            console.log(`➕ [LEAD_FOLLOWUPS] Adding missing column: ${col.name}`)
            
            let alterSQL = `ALTER TABLE lead_followups ADD COLUMN ${col.name} ${col.type}`
            
            if (col.default) {
              alterSQL += ` DEFAULT ${col.default}`
            }
            
            if (!col.nullable) {
              if (col.default) {
                alterSQL += ` NOT NULL`
              } else {
                // For non-nullable columns without default, add with nullable first, update, then set not null
                await client.query(alterSQL)
                await client.query(`UPDATE lead_followups SET ${col.name} = 'unknown' WHERE ${col.name} IS NULL`)
                await client.query(`ALTER TABLE lead_followups ALTER COLUMN ${col.name} SET NOT NULL`)
                columnsAdded++
                continue
              }
            }
            
            await client.query(alterSQL)
            columnsAdded++
          }
        }

        if (columnsAdded > 0) {
          console.log(`✅ [LEAD_FOLLOWUPS] Added ${columnsAdded} missing columns`)
          return {
            success: true,
            message: `Successfully added ${columnsAdded} missing columns to lead_followups table`
          }
        }

        console.log("✅ [LEAD_FOLLOWUPS] Table structure is already correct")
        return {
          success: true,
          message: "Lead followups table structure is already correct"
        }

      } catch (tableError) {
        console.error("❌ [LEAD_FOLLOWUPS] Error checking/creating table:", tableError)
        throw tableError
      }
    })

    console.log("🎉 [LEAD_FOLLOWUPS] Lead followups table fix completed successfully!")
    return result

  } catch (error: any) {
    console.error("❌ [LEAD_FOLLOWUPS] Error fixing lead_followups table:", error)
    return {
      success: false,
      message: `Failed to fix lead_followups table: ${error.message || "Unknown error"}`
    }
  }
}
