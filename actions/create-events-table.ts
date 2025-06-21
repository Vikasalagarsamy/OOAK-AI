"use server"

import { query, transaction } from "@/lib/postgresql-client"
import fs from "fs"
import path from "path"

export async function createEventsTable() {
  try {
    console.log("🗃️ Creating events table using PostgreSQL...")
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "sql", "create-events-table.sql")
    
    if (!fs.existsSync(sqlPath)) {
      console.error("SQL file not found:", sqlPath)
      return { success: false, error: "SQL file not found" }
    }
    
    const sql = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL directly using PostgreSQL
    await query(sql)

    console.log("✅ Events table created successfully")
    return { success: true }
  } catch (error) {
    console.error("Error creating events table:", error)
    return { success: false, error: String(error) }
  }
}
