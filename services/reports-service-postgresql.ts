"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

// Shared interface for report filters
export interface ReportFilters {
  dateRange?: DateRange
  leadSourceIds?: number[]
  employeeIds?: number[]
  statuses?: string[]
  companyIds?: number[]
  branchIds?: number[]
}

export interface LeadReport {
  id: number
  company_name: string
  contact_person: string
  phone: string
  email: string
  status: string
  expected_value: number
  created_at: string
  assigned_to_name: string
  branch_name: string
}

// Lead source report data
export async function getLeadSourceReportData(filters: ReportFilters = {}) {
  try {
    console.log('📊 Generating lead source report via PostgreSQL...')

    let whereConditions = []
    let params = []
    let paramCount = 0

    // Apply date filters if provided
    if (filters.dateRange?.from) {
      paramCount++
      whereConditions.push(`l.created_at >= $${paramCount}`)
      params.push(format(filters.dateRange.from, "yyyy-MM-dd"))
    }

    if (filters.dateRange?.to) {
      paramCount++
      whereConditions.push(`l.created_at <= $${paramCount}`)
      params.push(format(filters.dateRange.to, "yyyy-MM-dd"))
    }

    // Apply other filters
    if (filters.leadSourceIds?.length) {
      paramCount++
      whereConditions.push(`l.lead_source_id = ANY($${paramCount})`)
      params.push(filters.leadSourceIds)
    }

    if (filters.employeeIds?.length) {
      paramCount++
      whereConditions.push(`l.assigned_to = ANY($${paramCount})`)
      params.push(filters.employeeIds)
    }

    if (filters.statuses?.length) {
      paramCount++
      whereConditions.push(`l.status = ANY($${paramCount})`)
      params.push(filters.statuses)
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    const result = await query(`
      SELECT 
        l.id,
        l.lead_number,
        l.status,
        l.created_at,
        l.updated_at,
        l.lead_source_id,
        ls.name as lead_source_name,
        l.assigned_to,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      LEFT JOIN employees e ON l.assigned_to = e.id
      ${whereClause}
      ORDER BY l.created_at DESC
    `, params)

    console.log('✅ Lead source report generated successfully via PostgreSQL')
    
    return result.rows
  } catch (error) {
    console.error("Error fetching lead source report data (PostgreSQL):", error)
    return []
  }
}

// Get filter options (lead sources, employees, etc.)
export async function getReportFilterOptions() {
  try {
    console.log('📊 Fetching report filter options via PostgreSQL...')

    const [leadSourcesResult, employeesResult, companiesResult, branchesResult] = await Promise.all([
      query(`SELECT id, name FROM lead_sources ORDER BY name`),
      query(`SELECT id, CONCAT(first_name, ' ', last_name) as name FROM employees WHERE status = 'active' ORDER BY first_name, last_name`),
      query(`SELECT id, name FROM companies ORDER BY name`),
      query(`SELECT id, name FROM branches ORDER BY name`)
    ])

    console.log('✅ Report filter options fetched successfully via PostgreSQL')
    
    return {
      leadSources: leadSourcesResult.rows,
      employees: employeesResult.rows,
      companies: companiesResult.rows,
      branches: branchesResult.rows,
      statuses: [
        { id: "NEW", name: "New" },
        { id: "ASSIGNED", name: "Assigned" },
        { id: "CONTACTED", name: "Contacted" },
        { id: "QUALIFIED", name: "Qualified" },
        { id: "PROPOSAL", name: "Proposal" },
        { id: "NEGOTIATION", name: "Negotiation" },
        { id: "WON", name: "Won" },
        { id: "LOST", name: "Lost" },
        { id: "REJECTED", name: "Rejected" }
      ]
    }
  } catch (error) {
    console.error("Error fetching report filter options (PostgreSQL):", error)
    return {
      leadSources: [],
      employees: [],
      companies: [],
      branches: [],
      statuses: []
    }
  }
}

export async function getLeadsReport(filters: ReportFilters = {}) {
  try {
    console.log('📊 Generating leads report via PostgreSQL...')

    let whereConditions = []
    let params = []
    let paramCount = 0

    if (filters.dateRange?.from) {
      paramCount++
      whereConditions.push(`l.created_at >= $${paramCount}`)
      params.push(format(filters.dateRange.from, "yyyy-MM-dd"))
    }

    if (filters.dateRange?.to) {
      paramCount++
      whereConditions.push(`l.created_at <= $${paramCount}`)
      params.push(format(filters.dateRange.to, "yyyy-MM-dd"))
    }

    if (filters.statuses?.length) {
      paramCount++
      whereConditions.push(`l.status = ANY($${paramCount})`)
      params.push(filters.statuses)
    }

    if (filters.employeeIds?.length) {
      paramCount++
      whereConditions.push(`l.assigned_to = ANY($${paramCount})`)
      params.push(filters.employeeIds)
    }

    if (filters.branchIds?.length) {
      paramCount++
      whereConditions.push(`l.branch_id = ANY($${paramCount})`)
      params.push(filters.branchIds)
    }

    if (filters.companyIds?.length) {
      paramCount++
      whereConditions.push(`l.company_id = ANY($${paramCount})`)
      params.push(filters.companyIds)
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    const result = await query(`
      SELECT 
        l.id,
        l.company_name,
        l.contact_person,
        l.phone,
        l.email,
        l.status,
        l.expected_value,
        l.created_at,
        CONCAT(e.first_name, ' ', e.last_name) as assigned_to_name,
        b.name as branch_name
      FROM leads l
      LEFT JOIN employees e ON l.assigned_to = e.id
      LEFT JOIN branches b ON l.branch_id = b.id
      ${whereClause}
      ORDER BY l.created_at DESC
    `, params)

    console.log('✅ Leads report generated successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows,
      count: result.rows.length
    }
  } catch (error) {
    console.error("Error generating leads report (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      count: 0
    }
  }
} 