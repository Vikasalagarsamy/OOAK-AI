import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    console.log('🔧 Setting up sample data with PostgreSQL...')
    
    const client = await pool.connect()
    
    try {
      // Begin transaction for atomic data setup
      await client.query('BEGIN')

      const setupResults = {
        departments_processed: 0,
        employees_created: 0,
        companies_created: 0,
        existing_data_found: false,
        database_initialized: false
      }

      // 1. Setup departments if they don't exist
      console.log('🏢 Setting up departments...')
      const departments = [
        { id: 1, name: 'Administration', description: 'Administrative department' },
        { id: 2, name: 'Sales', description: 'Sales department' },
        { id: 3, name: 'HR', description: 'Human Resources department' },
        { id: 4, name: 'Finance', description: 'Finance and Accounting department' },
        { id: 5, name: 'Operations', description: 'Operations and Production department' }
      ]

      for (const dept of departments) {
        // Check if department exists
        const { rows: existingDept } = await client.query(
          'SELECT id FROM departments WHERE id = $1',
          [dept.id]
        )

        if (existingDept.length === 0) {
          // Insert new department
          await client.query(
            'INSERT INTO departments (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
            [dept.id, dept.name, dept.description]
          )
          console.log(`✅ Created department: ${dept.name}`)
        } else {
          console.log(`ℹ️ Department already exists: ${dept.name}`)
        }
        setupResults.departments_processed++
      }

      // 2. Setup companies if table exists and is empty
      console.log('🏢 Setting up companies...')
      try {
        const { rows: companyCount } = await client.query('SELECT COUNT(*) as count FROM companies')
        
        if (parseInt(companyCount[0].count) === 0) {
          const sampleCompanies = [
            {
              id: 1,
              name: 'OOAK Photography & Videography',
              company_code: 'OOAK',
              contact_email: 'info@ooak.photography',
              contact_phone: '+91-9677362524',
              address: 'Chennai, Tamil Nadu, India',
              is_active: true
            },
            {
              id: 2,
              name: 'Creative Studios',
              company_code: 'CREATIVE',
              contact_email: 'contact@creativestudios.com',
              contact_phone: '+91-9876543210',
              address: 'Bangalore, Karnataka, India',
              is_active: true
            }
          ]

          for (const company of sampleCompanies) {
            await client.query(`
              INSERT INTO companies (id, name, company_code, contact_email, contact_phone, address, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING
            `, [
              company.id,
              company.name,
              company.company_code,
              company.contact_email,
              company.contact_phone,
              company.address,
              company.is_active
            ])
            setupResults.companies_created++
          }
          console.log(`✅ Created ${setupResults.companies_created} companies`)
        } else {
          console.log(`ℹ️ Companies already exist: ${companyCount[0].count} records`)
          setupResults.existing_data_found = true
        }
      } catch (companyError) {
        console.log('ℹ️ Companies table may not exist, skipping company setup')
      }

      // 3. Check if employees exist, if not create sample employees
      console.log('👥 Setting up sample employees...')
      const { rows: existingEmployees } = await client.query('SELECT COUNT(*) as count FROM employees')
      
      if (parseInt(existingEmployees[0].count) === 0) {
        const sampleEmployees = [
          {
            name: 'Vikas Alagarsamy',
            first_name: 'Vikas',
            last_name: 'Alagarsamy',
            email: 'vikas@ooak.photography',
            department_id: 2,
            phone: '+919677362524',
            status: 'active',
            employee_id: 'EMP001'
          },
          {
            name: 'Sarah Johnson',
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah@ooak.photography',
            department_id: 2,
            phone: '+919876543211',
            status: 'active',
            employee_id: 'EMP002'
          },
          {
            name: 'Mike Chen',
            first_name: 'Mike',
            last_name: 'Chen',
            email: 'mike@ooak.photography',
            department_id: 2,
            phone: '+919876543212',
            status: 'active',
            employee_id: 'EMP003'
          },
          {
            name: 'Priya Sharma',
            first_name: 'Priya',
            last_name: 'Sharma',
            email: 'priya@ooak.photography',
            department_id: 4,
            phone: '+919876543213',
            status: 'active',
            employee_id: 'EMP004'
          },
          {
            name: 'Raj Kumar',
            first_name: 'Raj',
            last_name: 'Kumar',
            email: 'raj@ooak.photography',
            department_id: 5,
            phone: '+919876543214',
            status: 'active',
            employee_id: 'EMP005'
          }
        ]

        for (const employee of sampleEmployees) {
          await client.query(`
            INSERT INTO employees (name, first_name, last_name, email, department_id, phone, status, employee_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          `, [
            employee.name,
            employee.first_name,
            employee.last_name,
            employee.email,
            employee.department_id,
            employee.phone,
            employee.status,
            employee.employee_id
          ])
          setupResults.employees_created++
        }
        console.log(`✅ Created ${setupResults.employees_created} sample employees`)
      } else {
        console.log(`ℹ️ Employees already exist: ${existingEmployees[0].count} records`)
        setupResults.existing_data_found = true
      }

      // 4. Setup sample lead sources if table exists
      console.log('📊 Setting up lead sources...')
      try {
        const { rows: leadSourceCount } = await client.query('SELECT COUNT(*) as count FROM lead_sources')
        
        if (parseInt(leadSourceCount[0].count) === 0) {
          const sampleLeadSources = [
            { name: 'Instagram', description: 'Social media platform', is_active: true },
            { name: 'Website', description: 'Company website inquiries', is_active: true },
            { name: 'Referral', description: 'Customer referrals', is_active: true },
            { name: 'Google Ads', description: 'Google advertising', is_active: true },
            { name: 'Facebook', description: 'Facebook social media', is_active: true },
            { name: 'WhatsApp', description: 'WhatsApp direct contact', is_active: true }
          ]

          for (const source of sampleLeadSources) {
            await client.query(`
              INSERT INTO lead_sources (name, description, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, NOW(), NOW())
            `, [source.name, source.description, source.is_active])
          }
          console.log(`✅ Created ${sampleLeadSources.length} lead sources`)
        }
      } catch (leadSourceError) {
        console.log('ℹ️ Lead sources table may not exist, skipping lead source setup')
      }

      // Commit transaction
      await client.query('COMMIT')
      setupResults.database_initialized = true

      // Get current data for response
      const { rows: finalEmployees } = await client.query(`
        SELECT e.id, e.name, e.email, e.department_id, d.name as department_name, e.status
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        ORDER BY e.id
      `)

      const { rows: finalDepartments } = await client.query('SELECT id, name, description FROM departments ORDER BY id')

      // Get business statistics
      const { rows: businessStats } = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
          (SELECT COUNT(*) FROM departments) as total_departments,
          (SELECT COUNT(*) FROM companies) as total_companies
      `)

      const totalTime = Date.now() - startTime

      console.log(`✅ Sample data setup completed in ${totalTime}ms`)
      console.log(`   └─ Departments: ${setupResults.departments_processed}`)
      console.log(`   └─ Employees: ${setupResults.employees_created} created`)
      console.log(`   └─ Companies: ${setupResults.companies_created} created`)

      return NextResponse.json({
        success: true,
        message: 'Sample data setup completed with PostgreSQL',
        database: 'PostgreSQL localhost:5432',
        setup_results: setupResults,
        business_statistics: {
          active_employees: parseInt(businessStats[0].active_employees),
          total_departments: parseInt(businessStats[0].total_departments),
          total_companies: parseInt(businessStats[0].total_companies),
          setup_time: `${totalTime}ms`
        },
        data: {
          employees_count: finalEmployees.length,
          departments_count: finalDepartments.length,
          employees: finalEmployees,
          departments: finalDepartments
        },
        performance_metrics: {
          total_setup_time: `${totalTime}ms`,
          database_response: totalTime < 500 ? 'excellent' : 'good',
          connection_pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          }
        },
        metadata: {
          source: 'PostgreSQL Sample Data Setup',
          setup_version: '2.0',
          migration_status: 'Phase 8.1 - Data Setup & Sample Management',
          timestamp: new Date().toISOString(),
          features: [
            'Atomic Transaction Setup',
            'Comprehensive Sample Data',
            'Business Entity Creation',
            'Department Hierarchy Setup',
            'Lead Source Configuration',
            'Performance Monitoring'
          ]
        }
      })

    } catch (error: any) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Error setting up sample data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to setup sample data',
      details: {
        message: error.message || String(error),
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      troubleshooting: [
        'Verify PostgreSQL is running on localhost:5432',
        'Check employees and departments tables exist',
        'Ensure proper database permissions',
        'Verify database schema is up to date'
      ],
      metadata: {
        source: 'PostgreSQL Sample Data Setup',
        error_timestamp: new Date().toISOString(),
        setup_version: '2.0'
      }
    }, { status: 500 })
  }
} 