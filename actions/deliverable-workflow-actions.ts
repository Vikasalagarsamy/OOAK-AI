"use server"

import { query, transaction } from "@/lib/postgresql-client"
import type { 
  DeliverableWorkflow, 
  DeliverableWorkflowFormData, 
  DeliverableWorkflowResponse,
  DeliverableWorkflowDetails,
  DeliverableWorkflowFilters,
  DeliverableCatalog
} from '@/types/deliverable-catalog'

// =====================================================
// DELIVERABLE CATALOG FUNCTIONS (SERVER-SIDE)
// =====================================================

export async function getDeliverableCatalogForWorkflow(): Promise<DeliverableCatalog[]> {
  try {
    console.log("📋 Fetching deliverable catalog for workflow using PostgreSQL...")

    const result = await query(
      `SELECT * FROM deliverable_catalog 
       WHERE status = $1 
       ORDER BY deliverable_category ASC, deliverable_type ASC, deliverable_name ASC`,
      [1]
    )

    return (result.rows || []) as unknown as DeliverableCatalog[]
  } catch (error) {
    console.error('Error in getDeliverableCatalogForWorkflow:', error)
    return []
  }
}

// =====================================================
// WORKFLOW CRUD OPERATIONS
// =====================================================

export async function getDeliverableWorkflows(filters?: DeliverableWorkflowFilters): Promise<DeliverableWorkflowDetails[]> {
  try {
    console.log("🔄 Fetching deliverable workflows using PostgreSQL...")

    let whereClause = "WHERE status = $1"
    let params: any[] = [1]
    let paramIndex = 2

    if (filters?.deliverable_catalog_id) {
      whereClause += ` AND deliverable_catalog_id = $${paramIndex++}`
      params.push(filters.deliverable_catalog_id)
    }

    if (filters?.process_name) {
      whereClause += ` AND process_name ILIKE $${paramIndex++}`
      params.push(`%${filters.process_name}%`)
    }

    if (filters?.has_customer !== undefined) {
      whereClause += ` AND has_customer = $${paramIndex++}`
      params.push(filters.has_customer)
    }

    if (filters?.has_employee !== undefined) {
      whereClause += ` AND has_employee = $${paramIndex++}`
      params.push(filters.has_employee)
    }

    if (filters?.has_qc !== undefined) {
      whereClause += ` AND has_qc = $${paramIndex++}`
      params.push(filters.has_qc)
    }

    if (filters?.has_vendor !== undefined) {
      whereClause += ` AND has_vendor = $${paramIndex++}`
      params.push(filters.has_vendor)
    }

    const sqlQuery = `
      SELECT * FROM deliverable_workflow_details 
      ${whereClause}
      ORDER BY sort_order ASC
    `

    const result = await query(sqlQuery, params)
    return (result.rows || []) as unknown as DeliverableWorkflowDetails[]
  } catch (error) {
    console.error('Error in getDeliverableWorkflows:', error)
    return []
  }
}

export async function createDeliverableWorkflow(formData: DeliverableWorkflowFormData): Promise<DeliverableWorkflowResponse> {
  try {
    console.log("➕ Creating deliverable workflow using PostgreSQL...")

    const result = await query(
      `INSERT INTO deliverable_workflows (
        deliverable_catalog_id, process_name, process_description, sort_order,
        has_customer, has_employee, has_qc, has_vendor, timing_type, tat, tat_value,
        buffer, skippable, has_download_option, has_task_process, has_upload_folder_path,
        process_starts_from, on_start_template, on_complete_template, on_correction_template,
        employee, input_names, link, stream, stage, process_basic_price, process_premium_price,
        process_elite_price, status, created_date, updated_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      ) RETURNING id`,
      [
        formData.deliverable_catalog_id,
        formData.process_name,
        formData.process_description,
        formData.sort_order,
        formData.has_customer,
        formData.has_employee,
        formData.has_qc,
        formData.has_vendor,
        formData.timing_type,
        formData.tat,
        formData.tat_value,
        formData.buffer,
        formData.skippable,
        formData.has_download_option,
        formData.has_task_process,
        formData.has_upload_folder_path,
        formData.process_starts_from,
        formData.on_start_template,
        formData.on_complete_template,
        formData.on_correction_template,
        formData.employee,
        formData.input_names,
        formData.link,
        formData.stream,
        formData.stage,
        formData.process_basic_price,
        formData.process_premium_price,
        formData.process_elite_price,
        1,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )

    if (!result.rows || result.rows.length === 0) {
      return {
        success: false,
        message: 'Failed to create workflow'
      }
    }

    return {
      success: true,
      message: 'Workflow created successfully',
      id: result.rows[0].id
    }
  } catch (error) {
    console.error('Error in createDeliverableWorkflow:', error)
    return {
      success: false,
      message: `Failed to create workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function updateDeliverableWorkflow(id: number, formData: DeliverableWorkflowFormData): Promise<DeliverableWorkflowResponse> {
  try {
    console.log(`✏️ Updating deliverable workflow ${id} using PostgreSQL...`)

    const result = await query(
      `UPDATE deliverable_workflows SET
        deliverable_catalog_id = $1, process_name = $2, process_description = $3,
        sort_order = $4, has_customer = $5, has_employee = $6, has_qc = $7,
        has_vendor = $8, timing_type = $9, tat = $10, tat_value = $11,
        buffer = $12, skippable = $13, has_download_option = $14,
        has_task_process = $15, has_upload_folder_path = $16, process_starts_from = $17,
        on_start_template = $18, on_complete_template = $19, on_correction_template = $20,
        employee = $21, input_names = $22, link = $23, stream = $24, stage = $25,
        process_basic_price = $26, process_premium_price = $27, process_elite_price = $28,
        updated_date = $29
       WHERE id = $30
       RETURNING id`,
      [
        formData.deliverable_catalog_id,
        formData.process_name,
        formData.process_description,
        formData.sort_order,
        formData.has_customer,
        formData.has_employee,
        formData.has_qc,
        formData.has_vendor,
        formData.timing_type,
        formData.tat,
        formData.tat_value,
        formData.buffer,
        formData.skippable,
        formData.has_download_option,
        formData.has_task_process,
        formData.has_upload_folder_path,
        formData.process_starts_from,
        formData.on_start_template,
        formData.on_complete_template,
        formData.on_correction_template,
        formData.employee,
        formData.input_names,
        formData.link,
        formData.stream,
        formData.stage,
        formData.process_basic_price,
        formData.process_premium_price,
        formData.process_elite_price,
        new Date().toISOString(),
        id
      ]
    )

    if (!result.rows || result.rows.length === 0) {
      return {
        success: false,
        message: 'Failed to update workflow'
      }
    }

    return {
      success: true,
      message: 'Workflow updated successfully',
      id: result.rows[0].id
    }
  } catch (error) {
    console.error('Error in updateDeliverableWorkflow:', error)
    return {
      success: false,
      message: `Failed to update workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function deleteDeliverableWorkflow(id: number): Promise<DeliverableWorkflowResponse> {
  try {
    console.log(`🗑️ Deleting deliverable workflow ${id} using PostgreSQL...`)

    await query(
      "UPDATE deliverable_workflows SET status = $1, updated_date = $2 WHERE id = $3",
      [0, new Date().toISOString(), id]
    )

    return {
      success: true,
      message: 'Workflow deleted successfully'
    }
  } catch (error) {
    console.error('Error in deleteDeliverableWorkflow:', error)
    return {
      success: false,
      message: `Failed to delete workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 