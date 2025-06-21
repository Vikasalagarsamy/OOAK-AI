"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function addRejectionColumnsToLeads(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if columns already exist
    const columnsResult = await query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = $1 
         AND column_name = $2 
         AND table_schema = 'public'`,
      ["leads", "rejection_reason"]
    )

    if (columnsResult.rows && columnsResult.rows.length > 0) {
      return { success: true, message: "Rejection columns already exist" }
    }

    // Add the columns using transaction
    await transaction(async (client) => {
      await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejection_reason TEXT")
      await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE")
      await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_by UUID")
    })

    // Revalidate paths
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/my-leads")

    return { success: true, message: "Rejection columns added successfully" }
  } catch (error) {
    console.error("Error adding rejection columns:", error)
    return { success: false, message: "Failed to add rejection columns" }
  }
}
