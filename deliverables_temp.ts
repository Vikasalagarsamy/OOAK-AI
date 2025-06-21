"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
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
    console.log("📋 Fetching deliverables using PostgreSQL...")

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
    return result.rows || []
  } catch (error) {
    console.error("Error in getDeliverables:", error)
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

