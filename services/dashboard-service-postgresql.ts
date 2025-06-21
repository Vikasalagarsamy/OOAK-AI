// 🎯 MIGRATED: Dashboard Service - PostgreSQL Version
// Original: services/dashboard-service.ts (Supabase)
// Migrated: Direct PostgreSQL queries

import { query, transaction } from "@/lib/postgresql-client"

export async function getDashboardStats() {
  try {
    // Replace: const { count: companies } = await supabase.from("companies").select("*", { count: "exact", head: true })
    const companiesResult = await query('SELECT COUNT(*) as count FROM companies')
    const companies = parseInt(companiesResult.rows[0].count)

    // Replace: const { count: branches } = await supabase.from("branches").select("*", { count: "exact", head: true })  
    const branchesResult = await query('SELECT COUNT(*) as count FROM branches')
    const branches = parseInt(branchesResult.rows[0].count)

    // Replace: const { count: employees } = await supabase.from("employees").select("*", { count: "exact", head: true })
    const employeesResult = await query('SELECT COUNT(*) as count FROM employees')
    const employees = parseInt(employeesResult.rows[0].count)

    // Replace: const { count: clients } = await supabase.from("clients").select("*", { count: "exact", head: true })
    const clientsResult = await query('SELECT COUNT(*) as count FROM clients')
    const clients = parseInt(clientsResult.rows[0].count)

    return {
      companies,
      branches, 
      employees,
      clients,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    throw new Error('Failed to fetch dashboard statistics')
  }
}

// Example transaction usage
export async function createCompanyWithBranch(companyData: any, branchData: any) {
  return await transaction(async (client) => {
    // Insert company
    const companyResult = await client.query(
      'INSERT INTO companies (name, email, phone) VALUES ($1, $2, $3) RETURNING id',
      [companyData.name, companyData.email, companyData.phone]
    )
    
    const companyId = companyResult.rows[0].id
    
    // Insert branch
    const branchResult = await client.query(
      'INSERT INTO branches (company_id, name, location) VALUES ($1, $2, $3) RETURNING id',
      [companyId, branchData.name, branchData.location]
    )
    
    return {
      company_id: companyId,
      branch_id: branchResult.rows[0].id
    }
  })
}
