import { NextResponse } from "next/server"
import { query } from "@/lib/postgresql-client"

interface Company {
  id: number
  name: string
  company_code: string
  is_active: boolean
}

interface Branch {
  id: number
  name: string
  company_id: number
  address: string
  company_name: string
  is_active: boolean
}

interface LeadSource {
  id: number
  name: string
  description: string
  is_active: boolean
}

interface Company {
  id: number
  name: string
  company_code: string
  is_active: boolean
}

interface Branch {
  id: number
  name: string
  company_id: number
  address: string
  company_name: string
  is_active: boolean
}

interface LeadSource {
  id: number
  name: string
  description: string
  is_active: boolean
}

export async function GET() {
  try {
    console.log('🏢 [CREATE_LEAD_DATA] Fetching form data via PostgreSQL...')
    
    // Test connection first
    await query('SELECT 1')
    console.log('✅ [CREATE_LEAD_DATA] Database connection successful')
    
    // Check which tables exist first
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('companies', 'branches', 'lead_sources')
    `)
    
    const existingTables = tablesResult.rows.map(row => row.table_name)
    console.log('📋 [CREATE_LEAD_DATA] Found tables:', existingTables)
    
    // Check which tables have is_active column
    const columnCheckResult = await query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('companies', 'branches', 'lead_sources') 
      AND column_name = 'is_active'
    `)
    
    const hasActiveColumn = {
      companies: columnCheckResult.rows.some(row => row.table_name === 'companies'),
      branches: columnCheckResult.rows.some(row => row.table_name === 'branches'),
      lead_sources: columnCheckResult.rows.some(row => row.table_name === 'lead_sources')
    }
    
    console.log('📋 [CREATE_LEAD_DATA] Active column availability:', hasActiveColumn)
    
    // Initialize results with proper types
    let companies: Company[] = []
    let branches: Branch[] = []
    let leadSources: LeadSource[] = []
    
    // Fetch companies if table exists
    if (existingTables.includes('companies')) {
      const companiesQuery = hasActiveColumn.companies 
        ? 'SELECT id, name, company_code FROM companies WHERE is_active = true ORDER BY name ASC'
        : 'SELECT id, name, company_code FROM companies ORDER BY name ASC'
      const companiesResult = await query(companiesQuery)
      companies = companiesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        company_code: row.company_code,
        is_active: true
      }))
    }
    
    // Fetch branches if table exists
    if (existingTables.includes('branches')) {
      const branchesQuery = hasActiveColumn.branches
        ? `SELECT 
            b.id, 
            b.name, 
            b.company_id, 
            b.address,
            c.name as company_name
          FROM branches b
          LEFT JOIN companies c ON b.company_id = c.id
          WHERE b.is_active = true
          ORDER BY c.name, b.name`
        : `SELECT 
            b.id, 
            b.name, 
            b.company_id, 
            b.address,
            c.name as company_name
          FROM branches b
          LEFT JOIN companies c ON b.company_id = c.id
          ORDER BY c.name, b.name`
      const branchesResult = await query(branchesQuery)
      branches = branchesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        company_id: row.company_id,
        address: row.address,
        company_name: row.company_name,
        is_active: true
      }))
    }
    
    // Fetch lead sources if table exists
    if (existingTables.includes('lead_sources')) {
      const leadSourcesQuery = hasActiveColumn.lead_sources
        ? 'SELECT id, name, description, is_active FROM lead_sources WHERE is_active = true ORDER BY name ASC'
        : 'SELECT id, name, description FROM lead_sources ORDER BY name ASC'
      const leadSourcesResult = await query(leadSourcesQuery)
      leadSources = leadSourcesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        is_active: row.is_active !== undefined ? row.is_active : true
      }))
    }

    console.log(`✅ [CREATE_LEAD_DATA] Retrieved ${companies.length} companies, ${branches.length} branches, ${leadSources.length} lead sources`)

    return NextResponse.json({
      success: true,
      data: {
        companies,
        branches,
        leadSources,
        stats: {
          totalCompanies: companies.length,
          totalBranches: branches.length,
          totalLeadSources: leadSources.length,
          activeLeadSources: leadSources.filter(ls => ls.is_active).length
        }
      }
    })

  } catch (error: any) {
    console.error('❌ [CREATE_LEAD_DATA] Error fetching form data:', error)
    console.error('❌ [CREATE_LEAD_DATA] Error details:', {
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch create lead form data',
      details: error.message
    }, { status: 500 })
  }
}
