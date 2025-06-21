import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    console.log('🔍 Testing organization tables...')
    
    // Test each table and create sample data if empty
    const results = {
      companies: { exists: false, count: 0, error: null as string | null },
      branches: { exists: false, count: 0, error: null as string | null },
      clients: { exists: false, count: 0, error: null as string | null },
      suppliers: { exists: false, count: 0, error: null as string | null },
      vendors: { exists: false, count: 0, error: null as string | null },
      roles: { exists: false, count: 0, error: null as string | null }
    }

    // Test companies table
    try {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(5)
      
      if (companiesError) {
        results.companies.error = companiesError.message
      } else {
        results.companies.exists = true
        results.companies.count = companies?.length || 0
        
        // If empty, create sample data
        if (companies?.length === 0) {
          const { data: newCompanies, error: insertError } = await supabase
            .from('companies')
            .insert([
              {
                name: 'Tech Solutions Inc',
                email: 'info@techsolutions.com',
                phone: '+1-555-0101',
                address: '123 Tech Street, Silicon Valley, CA 94000',
                status: 'active'
              },
              {
                name: 'Global Enterprises Ltd',
                email: 'contact@globalent.com',
                phone: '+1-555-0102',
                address: '456 Business Ave, New York, NY 10001',
                status: 'active'
              }
            ])
            .select()
          
          if (!insertError && newCompanies) {
            results.companies.count = newCompanies.length
          }
        }
      }
    } catch (error: any) {
      results.companies.error = error.message
    }

    // Test branches table
    try {
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .limit(5)
      
      if (branchesError) {
        results.branches.error = branchesError.message
      } else {
        results.branches.exists = true
        results.branches.count = branches?.length || 0
        
        // If empty and companies exist, create sample data
        if (branches?.length === 0 && results.companies.count > 0) {
          const { data: newBranches, error: insertError } = await supabase
            .from('branches')
            .insert([
              {
                name: 'Main Branch',
                company_id: 1,
                address: '123 Main Street',
                city: 'New York',
                state: 'NY',
                phone: '+1-555-0101',
                email: 'main@company.com',
                status: 'active'
              }
            ])
            .select()
          
          if (!insertError && newBranches) {
            results.branches.count = newBranches.length
          }
        }
      }
    } catch (error: any) {
      results.branches.error = error.message
    }

    // Test other tables similarly
    const tables = ['clients', 'suppliers', 'vendors', 'roles']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(5)
        
        if (error) {
          results[table as keyof typeof results].error = error.message
        } else {
          results[table as keyof typeof results].exists = true
          results[table as keyof typeof results].count = data?.length || 0
          
          // Create sample data if empty
          if (data?.length === 0) {
            let sampleData: any[] = []
            
            switch (table) {
              case 'clients':
                sampleData = [
                  { name: 'ABC Corp', email: 'contact@abc.com', phone: '+1-555-0201', status: 'active' },
                  { name: 'XYZ Ltd', email: 'info@xyz.com', phone: '+1-555-0202', status: 'active' }
                ]
                break
              case 'suppliers':
                sampleData = [
                  { name: 'Supply Co', email: 'orders@supply.com', phone: '+1-555-0301', status: 'active' },
                  { name: 'Materials Inc', email: 'sales@materials.com', phone: '+1-555-0302', status: 'active' }
                ]
                break
              case 'vendors':
                sampleData = [
                  { name: 'Service Pro', email: 'support@service.com', phone: '+1-555-0401', status: 'active' },
                  { name: 'Tech Vendor', email: 'info@techvendor.com', phone: '+1-555-0402', status: 'active' }
                ]
                break
              case 'roles':
                sampleData = [
                  { title: 'CEO', description: 'Chief Executive Officer', department: 'Executive', level: 'executive', status: 'active' },
                  { title: 'Sales Manager', description: 'Sales Team Leader', department: 'Sales', level: 'senior', status: 'active' },
                  { title: 'Developer', description: 'Software Developer', department: 'Technology', level: 'mid', status: 'active' }
                ]
                break
            }
            
            if (sampleData.length > 0) {
              const { data: newData, error: insertError } = await supabase
                .from(table)
                .insert(sampleData)
                .select()
              
              if (!insertError && newData) {
                results[table as keyof typeof results].count = newData.length
              }
            }
          }
        }
      } catch (error: any) {
        results[table as keyof typeof results].error = error.message
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Organization tables tested and sample data created',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test organization tables error:', error)
    return NextResponse.json(
      { error: 'Failed to test organization tables' },
      { status: 500 }
    )
  }
} 