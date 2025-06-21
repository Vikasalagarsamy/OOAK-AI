"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

import type { 
  Deliverable, 
  DeliverableFormData, 
  DeliverableFilters,
  ServicePackage,
  PackageServiceView,
  PackageDeliverableView,
  ServiceWithPackages
} from "@/types/deliverables"
import { getCurrentUser } from "@/lib/auth-utils"
import {
  getDeliverableMasterByCategoryAndType,
  getDeliverableMasterCategories,
  getDeliverableMasterTypes,
} from "@/actions/deliverable-master-actions"

// Deliverables CRUD Operations
export async function getDeliverables(filters?: DeliverableFilters): Promise<Deliverable[]> {
  try {
    console.log("📋 [DELIVERABLES] Fetching deliverables using PostgreSQL...")

    let whereClause = ""
    let params: any[] = []
    let paramIndex = 1

    const conditions: string[] = []

    // Apply filters
    if (filters?.category) {
      conditions.push(`deliverable_cat = $${paramIndex++}`)
      params.push(filters.category)
    }

    if (filters?.type) {
      conditions.push(`deliverable_type = $${paramIndex++}`)
      params.push(filters.type)
    }

    if (filters?.status !== undefined) {
      conditions.push(`status = $${paramIndex++}`)
      params.push(filters.status)
    }

    if (filters?.has_customer !== undefined) {
      conditions.push(`has_customer = $${paramIndex++}`)
      params.push(filters.has_customer)
    }

    if (filters?.has_employee !== undefined) {
      conditions.push(`has_employee = $${paramIndex++}`)
      params.push(filters.has_employee)
    }

    if (filters?.search) {
      conditions.push(`(deliverable_name ILIKE $${paramIndex} OR process_name ILIKE $${paramIndex + 1})`)
      params.push(`%${filters.search}%`, `%${filters.search}%`)
      paramIndex += 2
    }

    if (filters?.package) {
      conditions.push(`package_included->>'${filters.package}' = 'true'`)
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`
    }

    const sqlQuery = `
      SELECT * FROM deliverables 
      ${whereClause}
      ORDER BY deliverable_type ASC, sort_order ASC
    `

    const result = await query(sqlQuery, params)
    console.log(`✅ [DELIVERABLES] Fetched ${result.rows.length} deliverables via PostgreSQL`)
    return result.rows || []
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error in getDeliverables:", error)
    return []
  }
}

export async function getDeliverableById(id: number): Promise<Deliverable | null> {
  try {
    console.log(`🔍 [DELIVERABLES] Fetching deliverable ${id} via PostgreSQL...`)

    const result = await query(`
      SELECT * FROM deliverables WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      console.log(`⚠️ [DELIVERABLES] Deliverable ${id} not found`)
      return null
    }

    console.log(`✅ [DELIVERABLES] Found deliverable ${id}`)
    return result.rows[0] as Deliverable
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error in getDeliverableById:", error)
    return null
  }
}

export async function createDeliverable(
  formData: DeliverableFormData
): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    console.log("➕ [DELIVERABLES] Creating deliverable via PostgreSQL...")

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const result = await query(`
      INSERT INTO deliverables (
        deliverable_cat, deliverable_type, deliverable_id, deliverable_name, process_name,
        has_customer, has_employee, has_qc, has_vendor, link, sort_order,
        timing_type, tat, tat_value, buffer, skippable, employee,
        has_download_option, has_task_process, has_upload_folder_path, process_starts_from, status,
        basic_price, premium_price, elite_price,
        on_start_template, on_complete_template, on_correction_template,
        input_names, stream, stage, package_included, created_date, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
      ) RETURNING id
    `, [
      formData.deliverable_cat,
      formData.deliverable_type,
      formData.deliverable_id,
      formData.deliverable_name.trim(),
      formData.process_name.trim(),
      formData.has_customer,
      formData.has_employee,
      formData.has_qc,
      formData.has_vendor,
      formData.link?.trim() || null,
      formData.sort_order,
      formData.timing_type,
      formData.tat,
      formData.tat_value,
      formData.buffer,
      formData.skippable,
      formData.employee || null,
      formData.has_download_option,
      formData.has_task_process,
      formData.has_upload_folder_path,
      formData.process_starts_from,
      formData.status,
      formData.basic_price || 0.00,
      formData.premium_price || 0.00,
      formData.elite_price || 0.00,
      formData.on_start_template?.trim() || null,
      formData.on_complete_template?.trim() || null,
      formData.on_correction_template?.trim() || null,
      formData.input_names || null,
      formData.stream || null,
      formData.stage?.trim() || null,
      formData.package_included,
      new Date().toISOString(),
      parseInt(currentUser.id)
    ])

    const newId = result.rows[0]?.id
    revalidatePath("/post-production/deliverables")
    
    console.log(`✅ [DELIVERABLES] Created deliverable with ID ${newId}`)
    return {
      success: true,
      message: "Deliverable created successfully",
      id: newId,
    }
  } catch (error: any) {
    console.error("❌ [DELIVERABLES] Error creating deliverable:", error)
    return {
      success: false,
      message: `Failed to create deliverable: ${error.message}`,
    }
  }
}

export async function updateDeliverable(
  id: number,
  formData: DeliverableFormData
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📝 [DELIVERABLES] Updating deliverable ${id} via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    await query(`
      UPDATE deliverables SET
        deliverable_cat = $1, deliverable_type = $2, deliverable_id = $3,
        deliverable_name = $4, process_name = $5, has_customer = $6, has_employee = $7,
        has_qc = $8, has_vendor = $9, link = $10, sort_order = $11, timing_type = $12,
        tat = $13, tat_value = $14, buffer = $15, skippable = $16, employee = $17,
        has_download_option = $18, has_task_process = $19, has_upload_folder_path = $20,
        process_starts_from = $21, status = $22, basic_price = $23, premium_price = $24,
        elite_price = $25, on_start_template = $26, on_complete_template = $27,
        on_correction_template = $28, input_names = $29, stream = $30, stage = $31,
        package_included = $32
      WHERE id = $33
    `, [
      formData.deliverable_cat, formData.deliverable_type, formData.deliverable_id,
      formData.deliverable_name.trim(), formData.process_name.trim(), formData.has_customer,
      formData.has_employee, formData.has_qc, formData.has_vendor, formData.link?.trim() || null,
      formData.sort_order, formData.timing_type, formData.tat, formData.tat_value,
      formData.buffer, formData.skippable, formData.employee || null, formData.has_download_option,
      formData.has_task_process, formData.has_upload_folder_path, formData.process_starts_from,
      formData.status, formData.basic_price || 0.00, formData.premium_price || 0.00,
      formData.elite_price || 0.00, formData.on_start_template?.trim() || null,
      formData.on_complete_template?.trim() || null, formData.on_correction_template?.trim() || null,
      formData.input_names || null, formData.stream || null, formData.stage?.trim() || null,
      formData.package_included, id
    ])

    revalidatePath("/post-production/deliverables")
    console.log(`✅ [DELIVERABLES] Updated deliverable ${id}`)
    return {
      success: true,
      message: "Deliverable updated successfully",
    }
  } catch (error: any) {
    console.error("❌ [DELIVERABLES] Error updating deliverable:", error)
    return {
      success: false,
      message: `Failed to update deliverable: ${error.message}`,
    }
  }
}

export async function deleteDeliverable(
  id: number
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🗑️ [DELIVERABLES] Deleting deliverable ${id} via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const result = await query(`
      DELETE FROM deliverables WHERE id = $1 RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      return { success: false, message: "Deliverable not found" }
    }

    revalidatePath("/post-production/deliverables")
    console.log(`✅ [DELIVERABLES] Deleted deliverable ${id}`)
    return {
      success: true,
      message: "Deliverable deleted successfully",
    }
  } catch (error: any) {
    console.error("❌ [DELIVERABLES] Error deleting deliverable:", error)
    return {
      success: false,
      message: `Failed to delete deliverable: ${error.message}`,
    }
  }
}

// Package Management
export async function getServicePackages(): Promise<ServicePackage[]> {
  try {
    console.log("📦 [DELIVERABLES] Fetching service packages via PostgreSQL...")

    const result = await query(`
      SELECT * FROM service_packages 
      WHERE is_active = true 
      ORDER BY sort_order ASC
    `)

    console.log(`✅ [DELIVERABLES] Fetched ${result.rows.length} service packages`)
    return result.rows || []
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error fetching service packages:", error)
    return []
  }
}

export async function getPackageServices(packageName: string): Promise<PackageServiceView[]> {
  try {
    console.log(`🔍 [DELIVERABLES] Fetching package services for ${packageName} via PostgreSQL...`)

    const result = await query(`
      SELECT * FROM v_package_services 
      WHERE package_name = $1 AND is_included = true
    `, [packageName])

    console.log(`✅ [DELIVERABLES] Fetched ${result.rows.length} package services`)
    return result.rows || []
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error fetching package services:", error)
    return []
  }
}

export async function getPackageDeliverables(packageName: string): Promise<PackageDeliverableView[]> {
  try {
    console.log(`🔍 [DELIVERABLES] Fetching package deliverables for ${packageName} via PostgreSQL...`)

    const result = await query(`
      SELECT * FROM v_package_deliverables 
      WHERE package_name = $1 AND is_included = true
    `, [packageName])

    console.log(`✅ [DELIVERABLES] Fetched ${result.rows.length} package deliverables`)
    return result.rows || []
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error fetching package deliverables:", error)
    return []
  }
}

// Enhanced Services with Package Pricing
export async function getServicesWithPackages(): Promise<ServiceWithPackages[]> {
  try {
    console.log("🔍 [DELIVERABLES] Fetching services with packages via PostgreSQL...")

    const result = await query(`
      SELECT * FROM services 
      WHERE status = 'Active' 
      ORDER BY servicename ASC
    `)

    console.log(`✅ [DELIVERABLES] Fetched ${result.rows.length} services with packages`)
    return result.rows || []
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error fetching services with packages:", error)
    return []
  }
}

export async function updateServicePackagePrice(
  serviceId: number,
  packageType: 'basic' | 'premium' | 'elite',
  price: number
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`💰 [DELIVERABLES] Updating ${packageType} price for service ${serviceId} via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const columnName = `${packageType}_price`
    await query(`
      UPDATE services 
      SET ${columnName} = $1, updated_at = NOW() 
      WHERE id = $2
    `, [price, serviceId])

    revalidatePath("/events/services")
    console.log(`✅ [DELIVERABLES] Updated ${packageType} price for service ${serviceId}`)
    return {
      success: true,
      message: "Service package price updated successfully",
    }
  } catch (error: any) {
    console.error("❌ [DELIVERABLES] Error updating service package price:", error)
    return {
      success: false,
      message: `Failed to update service package price: ${error.message}`,
    }
  }
}

// Bulk Operations
export async function bulkImportDeliverables(
  deliverables: Omit<DeliverableFormData, "created_date" | "created_by">[]
): Promise<{ success: boolean; message: string; imported: number }> {
  try {
    console.log(`📥 [DELIVERABLES] Bulk importing ${deliverables.length} deliverables via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required", imported: 0 }
    }

    let imported = 0
    
    // Use transaction for bulk import
    await transaction(async (client) => {
      for (const deliverable of deliverables) {
        await client.query(`
          INSERT INTO deliverables (
            deliverable_cat, deliverable_type, deliverable_id, deliverable_name, process_name,
            has_customer, has_employee, has_qc, has_vendor, link, sort_order,
            timing_type, tat, tat_value, buffer, skippable, employee,
            has_download_option, has_task_process, has_upload_folder_path, process_starts_from, status,
            basic_price, premium_price, elite_price,
            on_start_template, on_complete_template, on_correction_template,
            input_names, stream, stage, package_included, created_date, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
          )
        `, [
          deliverable.deliverable_cat, deliverable.deliverable_type, deliverable.deliverable_id,
          deliverable.deliverable_name.trim(), deliverable.process_name.trim(), deliverable.has_customer,
          deliverable.has_employee, deliverable.has_qc, deliverable.has_vendor, deliverable.link?.trim() || null,
          deliverable.sort_order, deliverable.timing_type, deliverable.tat, deliverable.tat_value,
          deliverable.buffer, deliverable.skippable, deliverable.employee || null, deliverable.has_download_option,
          deliverable.has_task_process, deliverable.has_upload_folder_path, deliverable.process_starts_from,
          deliverable.status, deliverable.basic_price || 0.00, deliverable.premium_price || 0.00,
          deliverable.elite_price || 0.00, deliverable.on_start_template?.trim() || null,
          deliverable.on_complete_template?.trim() || null, deliverable.on_correction_template?.trim() || null,
          deliverable.input_names || null, deliverable.stream || null, deliverable.stage?.trim() || null,
          deliverable.package_included, new Date().toISOString(), parseInt(currentUser.id)
        ])
        imported++
      }
    })

    revalidatePath("/post-production/deliverables")
    console.log(`✅ [DELIVERABLES] Successfully imported ${imported} deliverables`)
    return {
      success: true,
      message: `Successfully imported ${imported} deliverables`,
      imported,
    }
  } catch (error: any) {
    console.error("❌ [DELIVERABLES] Error importing deliverables:", error)
    return {
      success: false,
      message: `Import failed: ${error.message}`,
      imported: 0,
    }
  }
}

// Fetch employees for stakeholder assignment
export async function getEmployees(): Promise<{ id: number; name: string; department?: string }[]> {
  try {
    console.log("👥 [DELIVERABLES] Fetching employees via PostgreSQL...")

    // Try different approaches based on common employee table schemas
    try {
      // Approach 1: Try with first_name, last_name fields
      const result1 = await query(`
        SELECT id, first_name, last_name, department, job_title, status
        FROM employees 
        WHERE status IN ('active', 'Active', 'ACTIVE')
        ORDER BY first_name ASC
      `)
      
      if (result1.rows.length > 0) {
        const employees = result1.rows.map(emp => ({
          id: emp.id,
          name: emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.first_name,
          department: emp.department || emp.job_title || undefined
        }))
        console.log(`✅ [DELIVERABLES] Fetched ${employees.length} employees (approach 1)`)
        return employees
      }
    } catch (error1) {
      console.log("⚠️ [DELIVERABLES] Approach 1 failed, trying approach 2...")
    }

    try {
      // Approach 2: Try with name field
      const result2 = await query(`
        SELECT id, name, department
        FROM employees 
        WHERE is_active = true
        ORDER BY name ASC
      `)
      
      if (result2.rows.length > 0) {
        console.log(`✅ [DELIVERABLES] Fetched ${result2.rows.length} employees (approach 2)`)
        return result2.rows
      }
    } catch (error2) {
      console.log("⚠️ [DELIVERABLES] Approach 2 failed, trying approach 3...")
    }

    try {
      // Approach 3: Try basic fields only
      const result3 = await query(`
        SELECT id, first_name, last_name
        FROM employees 
        ORDER BY first_name ASC
      `)
      
      const employees = result3.rows.map(emp => ({
        id: emp.id,
        name: emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.first_name,
        department: undefined
      }))
      console.log(`✅ [DELIVERABLES] Fetched ${employees.length} employees (approach 3)`)
      return employees
    } catch (error3) {
      console.error("❌ [DELIVERABLES] All employee fetch attempts failed:", error3)
      return []
    }
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error in getEmployees:", error)
    return []
  }
}

// Fetch deliverable categories (distinct values)
export async function getDeliverableCategories(): Promise<string[]> {
  // Use the new deliverable_master table
  return await getDeliverableMasterCategories()
}

// Fetch deliverable types (distinct values)
export async function getDeliverableTypes(): Promise<string[]> {
  // Use the new deliverable_master table
  return await getDeliverableMasterTypes()
}

// Fetch existing deliverable names for reference
export async function getDeliverableNames(): Promise<{ id: number; name: string; category: string; type: string }[]> {
  try {
    console.log("📝 [DELIVERABLES] Fetching deliverable names via PostgreSQL...")

    const result = await query(`
      SELECT id, deliverable_name, category, type
      FROM deliverable_master 
      ORDER BY deliverable_name ASC
    `)

    const names = result.rows?.map(d => ({
      id: d.id,
      name: d.deliverable_name,
      category: d.category,
      type: d.type
    })) || []

    console.log(`✅ [DELIVERABLES] Fetched ${names.length} deliverable names`)
    return names
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error fetching deliverable names:", error)
    return []
  }
}

// Fetch process names filtered by deliverable name
export async function getProcessNamesByDeliverable(
  deliverableName: string
): Promise<string[]> {
  try {
    console.log(`🔍 [DELIVERABLES] Fetching process names for ${deliverableName} via PostgreSQL...`)

    const result = await query(`
      SELECT DISTINCT process_name
      FROM deliverables 
      WHERE deliverable_name = $1 AND status = 1 AND process_name IS NOT NULL
      ORDER BY process_name ASC
    `, [deliverableName])

    const processNames = result.rows?.map(d => d.process_name).filter(name => name) || []
    console.log(`✅ [DELIVERABLES] Found ${processNames.length} process names`)
    return processNames
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error fetching process names:", error)
    return []
  }
}

// Fetch all unique process names for general use
export async function getAllProcessNames(): Promise<string[]> {
  try {
    console.log("🔍 [DELIVERABLES] Fetching all process names via PostgreSQL...")

    const result = await query(`
      SELECT DISTINCT process_name
      FROM deliverables 
      WHERE status = 1 AND process_name IS NOT NULL
      ORDER BY process_name ASC
    `)

    const processNames = result.rows?.map(d => d.process_name).filter(name => name) || []
    console.log(`✅ [DELIVERABLES] Found ${processNames.length} unique process names`)
    return processNames
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error fetching all process names:", error)
    return []
  }
}

// Fetch deliverable names filtered by category and type from deliverables table
export async function getFilteredDeliverableNames(
  category?: string, 
  type?: string
): Promise<{ id: number; name: string; category: string; type: string }[]> {
  try {
    if (!category || !type) {
      return []
    }

    console.log(`🔍 [DELIVERABLES] Fetching filtered deliverable names for ${category}/${type} via PostgreSQL...`)

    const result = await query(`
      SELECT DISTINCT deliverable_name, deliverable_cat, deliverable_type
      FROM deliverables 
      WHERE deliverable_cat = $1 AND deliverable_type = $2 AND status = 1
      ORDER BY deliverable_name ASC
    `, [category, type])

    // Get unique deliverable names (in case there are duplicate names)
    const uniqueNames = new Map<string, { category: string; type: string }>()
    
    result.rows?.forEach(item => {
      if (item.deliverable_name && !uniqueNames.has(item.deliverable_name)) {
        uniqueNames.set(item.deliverable_name, {
          category: item.deliverable_cat,
          type: item.deliverable_type
        })
      }
    })

    // Convert to the expected format
    const resultNames = Array.from(uniqueNames.entries()).map(([name, details], index) => ({
      id: index + 1, // Use index as ID since we're dealing with unique names
      name: name,
      category: details.category,
      type: details.type
    }))

    console.log(`✅ [DELIVERABLES] Found ${resultNames.length} unique deliverable names for ${category}/${type}`)
    return resultNames
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error in getFilteredDeliverableNames:", error)
    return []
  }
}

/**
 * Calculate total deliverable pricing by summing all process prices
 */
export async function calculateDeliverableTotalPricing(deliverableName: string): Promise<{
  basic_total: number
  premium_total: number
  elite_total: number
  process_count: number
}> {
  try {
    console.log(`💰 [DELIVERABLES] Calculating total pricing for ${deliverableName} via PostgreSQL...`)

    const result = await query(`
      SELECT basic_price, premium_price, elite_price
      FROM deliverables 
      WHERE deliverable_name = $1 AND status = 1
    `, [deliverableName])

    const totals = result.rows?.reduce(
      (acc, process) => ({
        basic_total: acc.basic_total + (process.basic_price || 0),
        premium_total: acc.premium_total + (process.premium_price || 0),
        elite_total: acc.elite_total + (process.elite_price || 0),
        process_count: acc.process_count + 1
      }),
      { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }
    ) || { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }

    console.log(`✅ [DELIVERABLES] Calculated pricing totals for ${deliverableName}:`, totals)
    return totals
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error calculating deliverable total pricing:", error)
    return { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }
  }
}

/**
 * Get all process pricing breakdown for a deliverable
 */
export async function getDeliverableProcessPricing(deliverableName: string): Promise<{
  processes: Array<{
    id: number
    process_name: string
    basic_price: number
    premium_price: number
    elite_price: number
  }>
  totals: {
    basic_total: number
    premium_total: number
    elite_total: number
    process_count: number
  }
}> {
  try {
    console.log(`💰 [DELIVERABLES] Fetching process pricing breakdown for ${deliverableName} via PostgreSQL...`)

    const result = await query(`
      SELECT id, process_name, basic_price, premium_price, elite_price
      FROM deliverables 
      WHERE deliverable_name = $1 AND status = 1
      ORDER BY sort_order ASC
    `, [deliverableName])

    const processes = result.rows?.map(process => ({
      id: process.id,
      process_name: process.process_name,
      basic_price: process.basic_price || 0,
      premium_price: process.premium_price || 0,
      elite_price: process.elite_price || 0
    })) || []

    const totals = processes.reduce(
      (acc, process) => ({
        basic_total: acc.basic_total + process.basic_price,
        premium_total: acc.premium_total + process.premium_price,
        elite_total: acc.elite_total + process.elite_price,
        process_count: acc.process_count + 1
      }),
      { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }
    )

    console.log(`✅ [DELIVERABLES] Process pricing breakdown for ${deliverableName}:`, { processCount: processes.length, totals })
    return { processes, totals }
  } catch (error) {
    console.error("❌ [DELIVERABLES] Error in getDeliverableProcessPricing:", error)
    return { processes: [], totals: { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 } }
  }
} 