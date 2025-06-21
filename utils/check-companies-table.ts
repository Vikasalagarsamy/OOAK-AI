import { query, transaction } from "@/lib/postgresql-client"

/**
 * CHECK COMPANIES TABLE - NOW 100% POSTGRESQL
 * ===========================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized table verification and creation
 * - All Supabase dependencies eliminated
 */

export async function checkCompaniesTable(): Promise<boolean> {
  try {
    console.log('🏢 Checking companies table existence and structure via PostgreSQL...')

    // Check if companies table exists
    const tableExistsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'companies'
      ) as table_exists
    `)

    const tableExists = tableExistsResult.rows[0]?.table_exists || false

    if (!tableExists) {
      console.log('⚠️ Companies table does not exist, creating it...')
      return await createCompaniesTable()
    }

    console.log('✅ Companies table exists')
    return true

  } catch (error: any) {
    console.error('❌ Error checking companies table via PostgreSQL:', error)
    return false
  }
}

/**
 * Create the companies table with proper structure
 */
async function createCompaniesTable(): Promise<boolean> {
  try {
    console.log('🏗️ Creating companies table via PostgreSQL...')

    const created = await transaction(async (client) => {
      // Create the companies table
      await client.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          company_code VARCHAR(20) NOT NULL UNIQUE,
          address TEXT,
          city VARCHAR(100),
          state VARCHAR(100),
          postal_code VARCHAR(20),
          country VARCHAR(100),
          phone VARCHAR(20),
          email VARCHAR(255),
          website VARCHAR(255),
          status VARCHAR(20) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
        CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_code_unique ON companies(company_code);
      `)

      // Add a sample company if none exists
      const existingCompaniesResult = await client.query(`
        SELECT COUNT(*) as count FROM companies
      `)
      
      const companyCount = Number.parseInt(existingCompaniesResult.rows[0].count, 10)
      
      if (companyCount === 0) {
        await client.query(`
          INSERT INTO companies (
            name, company_code, address, city, state, postal_code, country, status
          ) VALUES (
            'Sample Company', 
            'SAMPLE001', 
            '123 Main St', 
            'Sample City', 
            'Sample State', 
            '12345', 
            'Sample Country', 
            'ACTIVE'
          )
        `)
        console.log('✅ Added sample company to new companies table')
      }

      return true
    })

    if (created) {
      console.log('✅ Companies table created successfully with proper structure')
    }

    return created

  } catch (error: any) {
    console.error('❌ Error creating companies table via PostgreSQL:', error)
    return false
  }
}

/**
 * Verify companies table structure and fix if needed
 */
export async function verifyCompaniesTableStructure(): Promise<{
  isValid: boolean
  issues: string[]
  fixed: boolean
}> {
  try {
    console.log('🔍 Verifying companies table structure via PostgreSQL...')

    const issues: string[] = []
    let fixed = false

    // Check if table exists
    const tableExistsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'companies'
      ) as table_exists
    `)

    if (!tableExistsResult.rows[0]?.table_exists) {
      issues.push('Companies table does not exist')
      const created = await createCompaniesTable()
      if (created) {
        fixed = true
        console.log('✅ Created missing companies table')
      }
      return { isValid: created, issues, fixed }
    }

    // Check required columns
    const columnsResult = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'companies'
      ORDER BY ordinal_position
    `)

    const existingColumns = columnsResult.rows.map(row => row.column_name)
    const requiredColumns = [
      'id', 'name', 'company_code', 'address', 'city', 
      'state', 'postal_code', 'country', 'phone', 
      'email', 'website', 'status', 'created_at', 'updated_at'
    ]

    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))
    
    if (missingColumns.length > 0) {
      issues.push(`Missing columns: ${missingColumns.join(', ')}`)
    }

    // Check for unique constraint on company_code
    const constraintsResult = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
        AND table_name = 'companies'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%company_code%'
    `)

    if (constraintsResult.rows.length === 0) {
      issues.push('Missing unique constraint on company_code')
    }

    const isValid = issues.length === 0

    if (isValid) {
      console.log('✅ Companies table structure is valid')
    } else {
      console.log(`⚠️ Companies table has ${issues.length} structural issues`)
    }

    return { isValid, issues, fixed }

  } catch (error: any) {
    console.error('❌ Error verifying companies table structure via PostgreSQL:', error)
    return {
      isValid: false,
      issues: [`Error verifying structure: ${error.message}`],
      fixed: false
    }
  }
}

/**
 * Get companies table statistics
 */
export async function getCompaniesTableStats(): Promise<{
  totalCompanies: number
  activeCompanies: number
  inactiveCompanies: number
  recentCompanies: number
}> {
  try {
    console.log('📊 Getting companies table statistics via PostgreSQL...')

    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_companies,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_companies,
        COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END) as inactive_companies,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_companies
      FROM companies
    `)

    const stats = statsResult.rows[0]
    
    console.log(`✅ Companies stats: ${stats.total_companies} total, ${stats.active_companies} active`)

    return {
      totalCompanies: Number.parseInt(stats.total_companies, 10),
      activeCompanies: Number.parseInt(stats.active_companies, 10),
      inactiveCompanies: Number.parseInt(stats.inactive_companies, 10),
      recentCompanies: Number.parseInt(stats.recent_companies, 10)
    }

  } catch (error: any) {
    console.error('❌ Error getting companies table stats via PostgreSQL:', error)
    return {
      totalCompanies: 0,
      activeCompanies: 0,
      inactiveCompanies: 0,
      recentCompanies: 0
    }
  }
} 