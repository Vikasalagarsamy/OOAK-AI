"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import type { Service, ServiceFormData, ServiceFilters } from "@/types/services"
import { getCurrentUser } from "@/lib/auth-utils"

/**
 * SERVICES ACTIONS - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for CRUD operations
 * - Enhanced error handling and logging
 * - Service management with package pricing support
 * - Bulk import capabilities with transaction support
 * - All Supabase dependencies eliminated
 */

export async function getServices(filters?: ServiceFilters): Promise<Service[]> {
  try {
    console.log('🔍 Fetching services via PostgreSQL...')
    
    let queryText = `
      SELECT * FROM services 
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    // Apply filters
    if (filters?.status) {
      paramCount++
      queryText += ` AND status = $${paramCount}`
      params.push(filters.status)
    }

    if (filters?.category) {
      paramCount++
      queryText += ` AND category = $${paramCount}`
      params.push(filters.category)
    }

    if (filters?.search) {
      paramCount++
      queryText += ` AND servicename ILIKE $${paramCount}`
      params.push(`%${filters.search}%`)
    }

    queryText += ` ORDER BY created_at DESC`

    const result = await query(queryText, params)
    
    console.log(`✅ Found ${result.rows.length} services`)
    return result.rows || []
  } catch (error) {
    console.error("❌ Error in getServices:", error)
    return []
  }
}

export async function getServiceById(id: number): Promise<Service | null> {
  try {
    console.log(`🔍 Fetching service by ID: ${id}`)
    
    const result = await query(`
      SELECT * FROM services WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      console.log(`⚠️ Service not found with ID: ${id}`)
      return null
    }

    console.log(`✅ Found service: ${result.rows[0].servicename}`)
    return result.rows[0] as Service
  } catch (error) {
    console.error("❌ Error in getServiceById:", error)
    return null
  }
}

export async function createService(
  formData: ServiceFormData & {
    basic_price?: number
    premium_price?: number
    elite_price?: number
    package_included?: {
      basic: boolean
      premium: boolean
      elite: boolean
    }
  }
): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    console.log('➕ Creating new service via PostgreSQL...')
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const result = await query(`
      INSERT INTO services (
        servicename, status, description, category, price, unit,
        basic_price, premium_price, elite_price, package_included, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
      ) RETURNING *
    `, [
      formData.servicename.trim(),
      formData.status,
      formData.description?.trim() || null,
      formData.category || null,
      formData.price || null,
      formData.unit?.trim() || null,
      formData.basic_price || null,
      formData.premium_price || null,
      formData.elite_price || null,
      formData.package_included ? JSON.stringify(formData.package_included) : null
    ])

    const createdService = result.rows[0]
    console.log(`✅ Service created successfully: ${createdService.servicename} (ID: ${createdService.id})`)

    revalidatePath("/events/services")
    return {
      success: true,
      message: "Service created successfully",
      id: createdService.id,
    }
  } catch (error) {
    console.error("❌ Error creating service:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function updateService(
  id: number,
  formData: ServiceFormData & {
    basic_price?: number
    premium_price?: number
    elite_price?: number
    package_included?: {
      basic: boolean
      premium: boolean
      elite: boolean
    }
  }
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📝 Updating service ID: ${id} via PostgreSQL...`)
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const result = await query(`
      UPDATE services SET
        servicename = $1,
        status = $2,
        description = $3,
        category = $4,
        price = $5,
        unit = $6,
        basic_price = $7,
        premium_price = $8,
        elite_price = $9,
        package_included = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      formData.servicename.trim(),
      formData.status,
      formData.description?.trim() || null,
      formData.category || null,
      formData.price || null,
      formData.unit?.trim() || null,
      formData.basic_price || null,
      formData.premium_price || null,
      formData.elite_price || null,
      formData.package_included ? JSON.stringify(formData.package_included) : null,
      id
    ])

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Service not found or no changes made",
      }
    }

    console.log(`✅ Service updated successfully: ${result.rows[0].servicename}`)

    revalidatePath("/events/services")
    return {
      success: true,
      message: "Service updated successfully",
    }
  } catch (error) {
    console.error("❌ Error updating service:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function deleteService(
  id: number
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🗑️ Deleting service ID: ${id} via PostgreSQL...`)
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const result = await query(`
      DELETE FROM services WHERE id = $1 RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Service not found",
      }
    }

    console.log(`✅ Service deleted successfully: ${result.rows[0].servicename}`)

    revalidatePath("/events/services")
    return {
      success: true,
      message: "Service deleted successfully",
    }
  } catch (error) {
    console.error("❌ Error deleting service:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function bulkImportServices(
  services: Omit<ServiceFormData, "status">[]
): Promise<{ success: boolean; message: string; imported: number }> {
  try {
    console.log(`📦 Bulk importing ${services.length} services via PostgreSQL...`)
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required", imported: 0 }
    }

    let importedCount = 0

    // Use transaction for atomic bulk import
    await transaction(async (client) => {
      for (const service of services) {
        const result = await client.query(`
          INSERT INTO services (
            servicename, status, description, category, price, unit, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, NOW()
          ) RETURNING id
        `, [
          service.servicename.trim(),
          "Active",
          service.description?.trim() || null,
          service.category || null,
          service.price || null,
          service.unit?.trim() || null
        ])
        
        if (result.rows.length > 0) {
          importedCount++
        }
      }
    })

    console.log(`✅ Bulk import completed: ${importedCount}/${services.length} services imported`)

    revalidatePath("/events/services")
    return {
      success: true,
      message: `Successfully imported ${importedCount} services`,
      imported: importedCount,
    }
  } catch (error) {
    console.error("❌ Error importing services:", error)
    return {
      success: false,
      message: "An unexpected error occurred during import",
      imported: 0,
    }
  }
}

// Enhanced Services with Package Pricing
export async function getServicesWithPackages(): Promise<Service[]> {
  try {
    console.log('🎁 Fetching services with package pricing via PostgreSQL...')
    
    const result = await query(`
      SELECT * FROM services 
      ORDER BY servicename ASC
    `)

    console.log(`✅ Found ${result.rows.length} services with package pricing`)
    return result.rows || []
  } catch (error) {
    console.error("❌ Error in getServicesWithPackages:", error)
    return []
  }
} 