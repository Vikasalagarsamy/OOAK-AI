"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export type DeliverableMaster = {
  id: number
  category: "Main" | "Optional"
  type: "Photo" | "Video"
  deliverable_name: string
  created_at: string
  updated_at: string
}

export type DeliverableMasterFormData = {
  category: "Main" | "Optional"
  type: "Photo" | "Video"
  deliverable_name: string
}

/**
 * Get all deliverable master records
 */
export async function getDeliverableMaster(): Promise<DeliverableMaster[]> {
  try {
    console.log("📋 Fetching deliverable master using PostgreSQL...")
    
    const result = await query(
      `SELECT * FROM deliverable_master 
       ORDER BY category ASC, type ASC, deliverable_name ASC`
    )

    return result.rows || []
  } catch (error) {
    console.error("Error fetching deliverable master:", error)
    throw new Error("Failed to fetch deliverable master data")
  }
}

/**
 * Get deliverable master records by category
 */
export async function getDeliverableMasterByCategory(category: "Main" | "Optional"): Promise<DeliverableMaster[]> {
  try {
    const result = await query(
      `SELECT * FROM deliverable_master 
       WHERE category = $1 
       ORDER BY type ASC, deliverable_name ASC`,
      [category]
    )

    return result.rows || []
  } catch (error) {
    console.error("Error fetching deliverable master by category:", error)
    throw new Error("Failed to fetch deliverable master data")
  }
}

/**
 * Get deliverable master records by type
 */
export async function getDeliverableMasterByType(type: "Photo" | "Video"): Promise<DeliverableMaster[]> {
  try {
    const result = await query(
      `SELECT * FROM deliverable_master 
       WHERE type = $1 
       ORDER BY category ASC, deliverable_name ASC`,
      [type]
    )

    return result.rows || []
  } catch (error) {
    console.error("Error fetching deliverable master by type:", error)
    throw new Error("Failed to fetch deliverable master data")
  }
}

/**
 * Get deliverable master records by category and type
 */
export async function getDeliverableMasterByCategoryAndType(
  category: "Main" | "Optional",
  type: "Photo" | "Video"
): Promise<DeliverableMaster[]> {
  try {
    const result = await query(
      `SELECT * FROM deliverable_master 
       WHERE category = $1 AND type = $2 
       ORDER BY deliverable_name ASC`,
      [category, type]
    )

    return result.rows || []
  } catch (error) {
    console.error("Error fetching deliverable master by category and type:", error)
    throw new Error("Failed to fetch deliverable master data")
  }
}

/**
 * Create a new deliverable master record
 */
export async function createDeliverableMaster(formData: DeliverableMasterFormData): Promise<{
  success: boolean
  message: string
  data?: DeliverableMaster
}> {
  try {
    console.log("➕ Creating deliverable master using PostgreSQL...")

    // Check if the deliverable name already exists for this category and type
    const existingResult = await query(
      `SELECT id FROM deliverable_master 
       WHERE category = $1 AND type = $2 AND deliverable_name = $3`,
      [formData.category, formData.type, formData.deliverable_name]
    )

    if (existingResult.rows && existingResult.rows.length > 0) {
      return {
        success: false,
        message: "A deliverable with this name already exists for the selected category and type",
      }
    }

    const result = await query(
      `INSERT INTO deliverable_master (category, type, deliverable_name) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [formData.category, formData.type, formData.deliverable_name]
    )

    if (!result.rows || result.rows.length === 0) {
      return {
        success: false,
        message: "Failed to create deliverable master record",
      }
    }

    revalidatePath("/")
    
    return {
      success: true,
      message: "Deliverable master record created successfully",
      data: result.rows[0],
    }
  } catch (error) {
    console.error("Error in createDeliverableMaster:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

/**
 * Update a deliverable master record
 */
export async function updateDeliverableMaster(
  id: number,
  formData: DeliverableMasterFormData
): Promise<{
  success: boolean
  message: string
  data?: DeliverableMaster
}> {
  try {
    console.log(`✏️ Updating deliverable master ${id} using PostgreSQL...`)

    // Check if another record with the same name exists (excluding current record)
    const existingResult = await query(
      `SELECT id FROM deliverable_master 
       WHERE category = $1 AND type = $2 AND deliverable_name = $3 AND id != $4`,
      [formData.category, formData.type, formData.deliverable_name, id]
    )

    if (existingResult.rows && existingResult.rows.length > 0) {
      return {
        success: false,
        message: "A deliverable with this name already exists for the selected category and type",
      }
    }

    const result = await query(
      `UPDATE deliverable_master 
       SET category = $1, type = $2, deliverable_name = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [formData.category, formData.type, formData.deliverable_name, id]
    )

    if (!result.rows || result.rows.length === 0) {
      return {
        success: false,
        message: "Failed to update deliverable master record",
      }
    }

    revalidatePath("/")
    
    return {
      success: true,
      message: "Deliverable master record updated successfully",
      data: result.rows[0],
    }
  } catch (error) {
    console.error("Error in updateDeliverableMaster:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

/**
 * Delete a deliverable master record
 */
export async function deleteDeliverableMaster(id: number): Promise<{
  success: boolean
  message: string
}> {
  try {
    console.log(`🗑️ Deleting deliverable master ${id} using PostgreSQL...`)

    const result = await query(
      "DELETE FROM deliverable_master WHERE id = $1",
      [id]
    )

    revalidatePath("/")
    
    return {
      success: true,
      message: "Deliverable master record deleted successfully",
    }
  } catch (error) {
    console.error("Error in deleteDeliverableMaster:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

/**
 * Get unique categories from deliverable master
 */
export async function getDeliverableMasterCategories(): Promise<string[]> {
  try {
    const result = await query(
      `SELECT DISTINCT category FROM deliverable_master 
       ORDER BY category ASC`
    )

    if (!result.rows || result.rows.length === 0) {
      return ["Main", "Optional"] // Return defaults if no data
    }

    // Extract unique categories
    const categories = result.rows.map(row => row.category)
    return categories.length > 0 ? categories : ["Main", "Optional"]
  } catch (error) {
    console.error("Error fetching deliverable master categories:", error)
    return ["Main", "Optional"] // Return defaults if error
  }
}

/**
 * Get unique types from deliverable master
 */
export async function getDeliverableMasterTypes(): Promise<string[]> {
  try {
    const result = await query(
      `SELECT DISTINCT type FROM deliverable_master 
       ORDER BY type ASC`
    )

    if (!result.rows || result.rows.length === 0) {
      return ["Photo", "Video"] // Return defaults if no data
    }

    // Extract unique types
    const types = result.rows.map(row => row.type)
    return types.length > 0 ? types : ["Photo", "Video"]
  } catch (error) {
    console.error("Error fetching deliverable master types:", error)
    return ["Photo", "Video"] // Return defaults if error
  }
} 