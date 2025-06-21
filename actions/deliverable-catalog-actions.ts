"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"
import type { 
  DeliverableCatalog,
  DeliverableCatalogFormData,
  DeliverableCatalogFilters,
  DeliverableCatalogSummary,
  DeliverableCatalogResponse,
  DeliverableCategory,
  DeliverableType
} from "@/types/deliverable-catalog"

// =====================================================
// DELIVERABLE CATALOG CRUD OPERATIONS
// =====================================================

export async function getDeliverableCatalog(filters?: DeliverableCatalogFilters): Promise<DeliverableCatalog[]> {
  try {
    console.log("📋 Fetching deliverable catalog using PostgreSQL...")

    let whereClause = "WHERE status = $1"
    let params: any[] = [1]
    let paramIndex = 2

    // Apply filters
    if (filters?.category) {
      whereClause += ` AND deliverable_category = $${paramIndex++}`
      params.push(filters.category)
    }

    if (filters?.type) {
      whereClause += ` AND deliverable_type = $${paramIndex++}`
      params.push(filters.type)
    }

    if (filters?.search) {
      whereClause += ` AND (deliverable_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`
      params.push(`%${filters.search}%`, `%${filters.search}%`)
      paramIndex += 2
    }

    const sqlQuery = `
      SELECT * FROM deliverable_catalog 
      ${whereClause}
      ORDER BY deliverable_category ASC, deliverable_type ASC, deliverable_name ASC
    `

    const result = await query(sqlQuery, params)
    return result.rows || []
  } catch (error) {
    console.error("Error in getDeliverableCatalog:", error)
    return []
  }
}

export async function getDeliverableCatalogSummary(filters?: DeliverableCatalogFilters): Promise<DeliverableCatalogSummary[]> {
  try {
    console.log("📊 Fetching deliverable catalog summary using PostgreSQL...")

    let whereClause = "WHERE status = $1"
    let params: any[] = [1]
    let paramIndex = 2

    // Apply filters
    if (filters?.category) {
      whereClause += ` AND deliverable_cat = $${paramIndex++}`
      params.push(filters.category)
    }

    if (filters?.type) {
      whereClause += ` AND deliverable_type = $${paramIndex++}`
      params.push(filters.type)
    }

    if (filters?.search) {
      whereClause += ` AND (deliverable_name ILIKE $${paramIndex} OR process_name ILIKE $${paramIndex + 1})`
      params.push(`%${filters.search}%`, `%${filters.search}%`)
      paramIndex += 2
    }

    const sqlQuery = `
      SELECT id, deliverable_name, deliverable_cat, deliverable_type, 
             basic_price, premium_price, elite_price, package_included, 
             process_name, status, created_date
      FROM deliverables 
      ${whereClause}
      ORDER BY deliverable_cat ASC, deliverable_type ASC, deliverable_name ASC
    `

    const result = await query(sqlQuery, params)
    
    // Map the data to match the expected interface
    const mappedData = (result.rows || []).map(item => ({
      id: item.id,
      deliverable_name: item.deliverable_name,
      deliverable_category: item.deliverable_cat as DeliverableCategory,
      deliverable_type: item.deliverable_type as DeliverableType,
      description: item.process_name,
      basic_price: item.basic_price || 0,
      premium_price: item.premium_price || 0,
      elite_price: item.elite_price || 0,
      package_included: item.package_included || { basic: false, premium: false, elite: false },
      status: item.status,
      created_date: item.created_date,
      updated_date: item.created_date, // Using created_date as fallback
      workflow_count: 0,
      total_basic_price: item.basic_price || 0,
      total_premium_price: item.premium_price || 0,
      total_elite_price: item.elite_price || 0
    }))

    return mappedData
  } catch (error) {
    console.error("Error in getDeliverableCatalogSummary:", error)
    return []
  }
}

export async function getDeliverableCatalogById(id: number): Promise<DeliverableCatalog | null> {
  try {
    const result = await query(
      "SELECT * FROM deliverable_catalog WHERE id = $1 AND status = $2",
      [id, 1]
    )

    if (!result.rows || result.rows.length === 0) {
      return null
    }

    return result.rows[0] as DeliverableCatalog
  } catch (error) {
    console.error("Error in getDeliverableCatalogById:", error)
    return null
  }
}

export async function createDeliverableCatalog(
  formData: DeliverableCatalogFormData
): Promise<DeliverableCatalogResponse> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    // Check for duplicate name within same category and type
    const existingResult = await query(
      `SELECT id FROM deliverables 
       WHERE deliverable_name = $1 AND deliverable_cat = $2 AND deliverable_type = $3 AND status = $4`,
      [formData.deliverable_name.trim(), formData.deliverable_category, formData.deliverable_type, 1]
    )

    if (existingResult.rows && existingResult.rows.length > 0) {
      return { 
        success: false, 
        message: `Deliverable "${formData.deliverable_name}" already exists in ${formData.deliverable_category}/${formData.deliverable_type}` 
      }
    }

    const result = await query(
      `INSERT INTO deliverables (
        deliverable_name, deliverable_cat, deliverable_type, process_name,
        basic_price, premium_price, elite_price, package_included, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id`,
      [
        formData.deliverable_name.trim(),
        formData.deliverable_category,
        formData.deliverable_type,
        formData.deliverable_name.trim(), // Using deliverable_name as process_name
        formData.basic_price || 0,
        formData.premium_price || 0,
        formData.elite_price || 0,
        formData.package_included,
        1,
        parseInt(currentUser.id)
      ]
    )

    revalidatePath("/post-production/deliverables")
    return {
      success: true,
      message: "Deliverable created successfully",
      id: result.rows[0].id,
    }
  } catch (error) {
    console.error("Error creating deliverable:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function updateDeliverableCatalog(
  id: number,
  formData: DeliverableCatalogFormData
): Promise<DeliverableCatalogResponse> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    // Check for duplicate name within same category and type (excluding current record)
    const existingResult = await query(
      `SELECT id FROM deliverable_catalog 
       WHERE deliverable_name = $1 AND deliverable_category = $2 AND deliverable_type = $3 
       AND status = $4 AND id != $5`,
      [formData.deliverable_name.trim(), formData.deliverable_category, formData.deliverable_type, 1, id]
    )

    if (existingResult.rows && existingResult.rows.length > 0) {
      return { 
        success: false, 
        message: `Deliverable "${formData.deliverable_name}" already exists in ${formData.deliverable_category}/${formData.deliverable_type}` 
      }
    }

    await query(
      `UPDATE deliverable_catalog SET 
        deliverable_name = $1, deliverable_category = $2, deliverable_type = $3,
        description = $4, basic_price = $5, premium_price = $6, elite_price = $7,
        package_included = $8, updated_by = $9
       WHERE id = $10`,
      [
        formData.deliverable_name.trim(),
        formData.deliverable_category,
        formData.deliverable_type,
        formData.description?.trim() || null,
        formData.basic_price || 0,
        formData.premium_price || 0,
        formData.elite_price || 0,
        formData.package_included,
        parseInt(currentUser.id),
        id
      ]
    )

    revalidatePath("/post-production/deliverables")
    return {
      success: true,
      message: "Deliverable updated successfully",
    }
  } catch (error) {
    console.error("Error updating deliverable catalog:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function deleteDeliverableCatalog(
  id: number
): Promise<DeliverableCatalogResponse> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    // Check if there are workflows associated with this catalog item
    const workflowsResult = await query(
      "SELECT id FROM deliverable_workflows WHERE deliverable_catalog_id = $1 AND status = $2",
      [id, 1]
    )

    if (workflowsResult.rows && workflowsResult.rows.length > 0) {
      return {
        success: false,
        message: `Cannot delete deliverable. It has ${workflowsResult.rows.length} associated workflow(s). Please delete workflows first.`
      }
    }

    // Soft delete by setting status to 0
    await query(
      "UPDATE deliverable_catalog SET status = $1, updated_by = $2 WHERE id = $3",
      [0, parseInt(currentUser.id), id]
    )

    revalidatePath("/post-production/deliverables")
    return {
      success: true,
      message: "Deliverable deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting deliverable catalog:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function getDeliverableCatalogCategories(): Promise<string[]> {
  return ["Main", "Optional"]
}

export async function getDeliverableCatalogTypes(): Promise<string[]> {
  return ["Photo", "Video"]
}

export async function getDeliverableCatalogNames(
  category?: string,
  type?: string
): Promise<{ id: number; name: string; category: string; type: string }[]> {
  try {
    let whereClause = "WHERE status = $1"
    let params: any[] = [1]
    let paramIndex = 2

    if (category) {
      whereClause += ` AND deliverable_category = $${paramIndex++}`
      params.push(category)
    }

    if (type) {
      whereClause += ` AND deliverable_type = $${paramIndex++}`
      params.push(type)
    }

    const result = await query(
      `SELECT id, deliverable_name, deliverable_category, deliverable_type 
       FROM deliverable_catalog 
       ${whereClause}
       ORDER BY deliverable_name ASC`,
      params
    )

    return result.rows?.map(d => ({
      id: d.id,
      name: d.deliverable_name,
      category: d.deliverable_category,
      type: d.deliverable_type
    })) || []
  } catch (error) {
    console.error("Error in getDeliverableCatalogNames:", error)
    return []
  }
}

export async function bulkImportDeliverableCatalog(
  catalogs: Omit<DeliverableCatalogFormData, "created_date" | "created_by">[]
): Promise<{ success: boolean; message: string; imported: number }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required", imported: 0 }
    }

    let imported = 0

    await transaction(async (client) => {
      for (const catalog of catalogs) {
        await client.query(
          `INSERT INTO deliverable_catalog (
            deliverable_name, deliverable_category, deliverable_type, description,
            basic_price, premium_price, elite_price, status, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            catalog.deliverable_name.trim(),
            catalog.deliverable_category,
            catalog.deliverable_type,
            catalog.description?.trim() || null,
            catalog.basic_price || 0,
            catalog.premium_price || 0,
            catalog.elite_price || 0,
            1,
            parseInt(currentUser.id),
            parseInt(currentUser.id)
          ]
        )
        imported++
      }
    })

    revalidatePath("/post-production/deliverables")
    return {
      success: true,
      message: `Successfully imported ${imported} deliverables`,
      imported
    }
  } catch (error) {
    console.error("Error in bulkImportDeliverableCatalog:", error)
    return {
      success: false,
      message: "An unexpected error occurred during import",
      imported: 0
    }
  }
} 