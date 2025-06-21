import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    console.log('🔧 Creating comprehensive sample data with PostgreSQL...')
    
    const client = await pool.connect()
    
    try {
      // Begin transaction for atomic sample data creation
      await client.query('BEGIN')

      const creationResults = {
        employees_processed: 0,
        leads_created: 0,
        quotations_created: 0,
        companies_created: 0,
        notifications_created: 0
      }

      // 1. Create/Update Vikas Alagarsamy employee
      console.log('👤 Creating primary employee...')
      
      // Check if employee exists
      const { rows: existingEmployee } = await client.query(
        'SELECT * FROM employees WHERE id = $1 OR email = $2',
        [87, 'vikas.alagarsamy1987@gmail.com']
      )
      
      let primaryEmployeeId = 87
      
      if (existingEmployee.length === 0) {
        // Create new employee
        const { rows: newEmployee } = await client.query(`
          INSERT INTO employees (id, name, first_name, last_name, email, department_id, phone, status, employee_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING id
        `, [
          87,
          'Vikas Alagarsamy',
          'Vikas',
          'Alagarsamy',
          'vikas.alagarsamy1987@gmail.com',
          2,
          '+919677362524',
          'active',
          'EMP001'
        ])
        
        primaryEmployeeId = newEmployee[0].id
        console.log(`✅ Created employee: ${primaryEmployeeId}`)
        creationResults.employees_processed++
      } else {
        // Update existing employee
        await client.query(`
          UPDATE employees 
          SET name = $1, first_name = $2, last_name = $3, email = $4, phone = $5, status = $6, employee_id = $7, updated_at = NOW()
          WHERE id = $8
        `, [
          'Vikas Alagarsamy',
          'Vikas',
          'Alagarsamy',
          'vikas.alagarsamy1987@gmail.com',
          '+919677362524',
          'active',
          'EMP001',
          existingEmployee[0].id
        ])
        
        primaryEmployeeId = existingEmployee[0].id
        console.log(`✅ Updated existing employee: ${primaryEmployeeId}`)
        creationResults.employees_processed++
      }

      // 2. Create sample companies if they don't exist
      console.log('🏢 Creating sample companies...')
      try {
        const { rows: companyCheck } = await client.query('SELECT COUNT(*) as count FROM companies')
        
        if (parseInt(companyCheck[0].count) === 0) {
          const sampleCompanies = [
            {
              id: 1,
              name: 'OOAK Photography & Videography',
              company_code: 'OOAK',
              contact_email: 'info@ooak.photography',
              contact_phone: '+91-9677362524',
              address: 'Chennai, Tamil Nadu, India'
            },
            {
              id: 2,
              name: 'Elite Wedding Studios',
              company_code: 'ELITE',
              contact_email: 'contact@eliteweddings.com',
              contact_phone: '+91-9876543210',
              address: 'Bangalore, Karnataka, India'
            }
          ]

          for (const company of sampleCompanies) {
            await client.query(`
              INSERT INTO companies (id, name, company_code, contact_email, contact_phone, address, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING
            `, [
              company.id,
              company.name,
              company.company_code,
              company.contact_email,
              company.contact_phone,
              company.address
            ])
            creationResults.companies_created++
          }
          console.log(`✅ Created ${creationResults.companies_created} companies`)
        }
      } catch (companyError) {
        console.log('ℹ️ Companies table may not exist, skipping company creation')
      }

      // 3. Create a comprehensive lead
      console.log('📈 Creating sample lead...')
      
      // Check if lead exists
      const { rows: existingLead } = await client.query(
        'SELECT * FROM leads WHERE client_name = $1',
        ['Jothi Alagarsamy']
      )
      
      let leadId = null
      
      if (existingLead.length === 0) {
        // Create new lead with comprehensive data
        const { rows: newLead } = await client.query(`
          INSERT INTO leads (
            client_name, bride_name, groom_name, phone, email, 
            assigned_to, status, lead_source,
            notes, follow_up_date, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING id
        `, [
          'Jothi Alagarsamy',
          'Jothi',
          'Alagarsamy',
          '+919677362525',
          'jothi.alagarsamy@example.com',
          primaryEmployeeId,
          'QUALIFIED',
          'Instagram',
          'Premium wedding package inquiry from Instagram. Interested in December wedding with full coverage.',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        ])
        
        leadId = newLead[0].id
        console.log(`✅ Created lead: ${leadId}`)
        creationResults.leads_created++
      } else {
        leadId = existingLead[0].id
        console.log(`✅ Lead already exists: ${leadId}`)
      }

      // 4. Create a comprehensive quotation
      console.log('💰 Creating sample quotation...')
      
      const quotationData = {
        client_name: 'Jothi Alagarsamy',
        bride_name: 'Jothi',
        groom_name: 'Alagarsamy',
        mobile: '+919677362525',
        email: 'jothi.alagarsamy@example.com',
        events: [
          {
            id: 'event-1',
            event_name: 'Wedding Ceremony',
            event_date: '2024-12-15',
            event_location: 'Chennai',
            venue_name: 'Grand Palace Hotel',
            start_time: '10:00',
            end_time: '18:00',
            expected_crowd: '200-300',
            selected_package: 'premium',
            selected_services: ['photography', 'videography', 'drone'],
            selected_deliverables: ['edited_photos', 'highlight_video', 'raw_footage']
          },
          {
            id: 'event-2',
            event_name: 'Reception',
            event_date: '2024-12-16',
            event_location: 'Chennai',
            venue_name: 'Grand Palace Hotel',
            start_time: '18:00',
            end_time: '23:00',
            expected_crowd: '300-400',
            selected_package: 'premium'
          }
        ],
        default_package: 'premium',
        selected_services: ['photography', 'videography', 'drone', 'live_streaming'],
        selected_deliverables: ['edited_photos', 'highlight_video', 'full_ceremony_video'],
        total_breakdown: {
          base_package: 35000,
          additional_services: 15000,
          travel_charges: 5000,
          total: 55000
        }
      }
      
      // Check if quotation exists
      const { rows: existingQuotation } = await client.query(
        'SELECT * FROM quotations WHERE client_name = $1 AND lead_id = $2',
        ['Jothi Alagarsamy', leadId]
      )
      
      if (existingQuotation.length === 0) {
        // Create new quotation
        const quotationNumber = `QUO-${Date.now()}`
        const { rows: newQuotation } = await client.query(`
          INSERT INTO quotations (
            lead_id, quotation_number, slug, client_name, bride_name, groom_name,
            mobile, email, default_package, total_amount, status, workflow_status,
            created_by, quotation_data, notes, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
          RETURNING id, quotation_number
        `, [
          leadId,
          quotationNumber,
          `jothi-alagarsamy-${Date.now()}`,
          'Jothi Alagarsamy',
          'Jothi',
          'Alagarsamy',
          '+919677362525',
          'jothi.alagarsamy@example.com',
          'premium',
          55000,
          'pending_approval',
          'draft',
          primaryEmployeeId.toString(),
          JSON.stringify(quotationData),
          'Premium wedding package with comprehensive coverage for ceremony and reception'
        ])
        
        console.log(`✅ Created quotation: ${newQuotation[0].quotation_number}`)
        creationResults.quotations_created++
      } else {
        // Update existing quotation
        await client.query(`
          UPDATE quotations 
          SET created_by = $1, total_amount = $2, quotation_data = $3, updated_at = NOW()
          WHERE id = $4
        `, [
          primaryEmployeeId.toString(),
          55000,
          JSON.stringify(quotationData),
          existingQuotation[0].id
        ])
        console.log(`✅ Updated quotation: ${existingQuotation[0].quotation_number}`)
      }

      // 5. Create sample notifications
      console.log('🔔 Creating sample notifications...')
      try {
        const notificationData = [
          {
            id: `sample_notification_${Date.now()}_1`,
            user_id: primaryEmployeeId,
            type: 'quotation',
            priority: 'medium',
            title: '📝 New Quotation Created',
            message: `Quotation for Jothi Alagarsamy created successfully - ₹55,000`,
            metadata: JSON.stringify({
              quotation_id: leadId,
              client_name: 'Jothi Alagarsamy',
              amount: 55000
            })
          },
          {
            id: `sample_notification_${Date.now()}_2`,
            user_id: primaryEmployeeId,
            type: 'lead',
            priority: 'high',
            title: '🎯 New Lead Qualified',
            message: `Lead from Instagram has been qualified and requires follow-up`,
            metadata: JSON.stringify({
              lead_id: leadId,
              source: 'Instagram',
              status: 'QUALIFIED'
            })
          }
        ]

        for (const notification of notificationData) {
          await client.query(`
            INSERT INTO notifications (id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
          `, [
            notification.id,
            notification.user_id,
            notification.type,
            notification.priority,
            notification.title,
            notification.message,
            notification.metadata
          ])
          creationResults.notifications_created++
        }
        console.log(`✅ Created ${creationResults.notifications_created} notifications`)
      } catch (notificationError) {
        console.log('ℹ️ Notifications table may not exist, skipping notification creation')
      }

      // Commit transaction
      await client.query('COMMIT')

      // 6. Verify the results and get comprehensive statistics
      const { rows: finalQuotations } = await client.query(`
        SELECT q.id, q.quotation_number, q.client_name, q.total_amount, q.status, q.created_by
        FROM quotations q
        WHERE q.created_by = $1
      `, [primaryEmployeeId.toString()])

      const { rows: finalLeads } = await client.query(`
        SELECT l.id, l.client_name, l.assigned_to, l.status, l.lead_source
        FROM leads l
        WHERE l.assigned_to = $1
      `, [primaryEmployeeId])

      const { rows: businessStats } = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
          (SELECT COUNT(*) FROM quotations) as total_quotations,
          (SELECT COUNT(*) FROM leads) as total_leads,
          (SELECT COALESCE(SUM(total_amount), 0) FROM quotations) as total_revenue,
          (SELECT COUNT(*) FROM companies) as total_companies
      `)

      const totalTime = Date.now() - startTime

      console.log(`✅ Sample data creation completed in ${totalTime}ms`)
      console.log(`   └─ Quotations: ${finalQuotations.length}`)
      console.log(`   └─ Leads: ${finalLeads.length}`)
      console.log(`   └─ Total Revenue: ₹${businessStats[0].total_revenue}`)

      return NextResponse.json({
        success: true,
        message: 'Comprehensive sample data created successfully with PostgreSQL!',
        database: 'PostgreSQL localhost:5432',
        creation_results: creationResults,
        business_statistics: {
          active_employees: parseInt(businessStats[0].active_employees),
          total_quotations: parseInt(businessStats[0].total_quotations),
          total_leads: parseInt(businessStats[0].total_leads),
          total_revenue: parseFloat(businessStats[0].total_revenue),
          total_companies: parseInt(businessStats[0].total_companies),
          creation_time: `${totalTime}ms`
        },
        results: {
          quotations: finalQuotations.length,
          leads: finalLeads.length,
          totalRevenue: finalQuotations.reduce((sum, q) => sum + (q.total_amount || 0), 0),
          quotationDetails: finalQuotations[0],
          leadDetails: finalLeads[0]
        },
        sample_data: {
          quotations: finalQuotations,
          leads: finalLeads,
          primary_employee_id: primaryEmployeeId
        },
        performance_metrics: {
          total_creation_time: `${totalTime}ms`,
          database_response: totalTime < 1000 ? 'excellent' : totalTime < 2000 ? 'good' : 'acceptable',
          connection_pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          }
        },
        metadata: {
          source: 'PostgreSQL Comprehensive Sample Data Creator',
          creation_version: '2.0',
          migration_status: 'Phase 8.1 - Data Setup & Sample Management',
          timestamp: new Date().toISOString(),
          features: [
            'Atomic Transaction Processing',
            'Comprehensive Business Data',
            'Lead-to-Quotation Workflow',
            'Multi-Event Quotations',
            'Notification System Integration',
            'Business Intelligence Ready'
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
    console.error('❌ Error creating sample data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create sample data',
      details: {
        message: error.message || String(error),
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      troubleshooting: [
        'Verify PostgreSQL is running on localhost:5432',
        'Check all required tables exist (employees, leads, quotations, companies)',
        'Ensure proper foreign key relationships are set up',
        'Verify database permissions for data insertion',
        'Check that department_id 2 exists in departments table'
      ],
      metadata: {
        source: 'PostgreSQL Comprehensive Sample Data Creator',
        error_timestamp: new Date().toISOString(),
        creation_version: '2.0'
      }
    }, { status: 500 })
  }
} 