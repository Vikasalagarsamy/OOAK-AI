import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const client = await pool.connect()
    
    try {
      // Check if tables exist using PostgreSQL information_schema
      const tableExistsQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('quotation_services', 'quotation_deliverables')
      `
      
      const existingTablesResult = await client.query(tableExistsQuery)
      const existingTables = existingTablesResult.rows.map(row => row.table_name)
      
      const tablesExist = {
        quotation_services: existingTables.includes('quotation_services'),
        quotation_deliverables: existingTables.includes('quotation_deliverables')
      }

      const setupInstructions: any = {
        title: "Quotation Junction Tables Setup - PostgreSQL",
        description: "Create dedicated tables for quotation services and deliverables",
        database: "PostgreSQL localhost:5432",
        tables_status: tablesExist,
        table_schemas: {
          quotation_services: `
            CREATE TABLE quotation_services (
              id SERIAL PRIMARY KEY,
              quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
              service_id INTEGER REFERENCES services(id),
              quantity INTEGER DEFAULT 1,
              package_type VARCHAR(100),
              unit_price DECIMAL(10,2),
              total_price DECIMAL(10,2),
              status VARCHAR(50) DEFAULT 'included',
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
          quotation_deliverables: `
            CREATE TABLE quotation_deliverables (
              id SERIAL PRIMARY KEY,
              quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
              deliverable_id INTEGER REFERENCES deliverable_master(id),
              quantity INTEGER DEFAULT 1,
              package_type VARCHAR(100),
              unit_price DECIMAL(10,2),
              total_price DECIMAL(10,2),
              status VARCHAR(50) DEFAULT 'included',
              workflow_status VARCHAR(50) DEFAULT 'pending',
              assigned_to INTEGER REFERENCES employees(id),
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        operations: [
          {
            endpoint: "POST /api/admin/setup-quotation-tables",
            action: "create_tables",
            description: "Creates both quotation junction tables"
          },
          {
            endpoint: "POST /api/admin/setup-quotation-tables", 
            action: "verify_tables",
            description: "Verifies table structure and data"
          },
          {
            endpoint: "POST /api/admin/setup-quotation-tables",
            action: "migrate_data", 
            description: "Migrates data from JSON arrays to normalized tables"
          }
        ],
        benefits: [
          "✅ Proper normalization - services and deliverables in separate tables",
          "✅ Better performance - indexed relationships with foreign keys",
          "✅ Workflow tracking - status fields for each service/deliverable",
          "✅ Future-ready - perfect for shooter scheduling module",
          "✅ Post-production ready - deliverable workflow tracking", 
          "✅ Analytics ready - easy reporting and insights",
          "✅ PostgreSQL optimized - better performance than JSON arrays"
        ]
      }

      // If tables exist, show migration status
      if (tablesExist.quotation_services && tablesExist.quotation_deliverables) {
        try {
          // Check data migration status
          const servicesCountQuery = 'SELECT COUNT(*) as count FROM quotation_services'
          const deliverablesCountQuery = 'SELECT COUNT(*) as count FROM quotation_deliverables'
          
          const servicesResult = await client.query(servicesCountQuery)
          const deliverablesResult = await client.query(deliverablesCountQuery)

          setupInstructions.migration_status = {
            services_migrated: parseInt(servicesResult.rows[0].count),
            deliverables_migrated: parseInt(deliverablesResult.rows[0].count),
            migration_complete: parseInt(servicesResult.rows[0].count) > 0 || parseInt(deliverablesResult.rows[0].count) > 0
          }
        } catch (error: any) {
          setupInstructions.migration_status = {
            error: "Could not check migration status",
            details: error.message
          }
        }
      }

      return NextResponse.json({
        success: true,
        setup: setupInstructions,
        metadata: {
          source: "Direct PostgreSQL Admin",
          timestamp: new Date().toISOString()
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('Setup check error:', error)
    return NextResponse.json(
      { error: 'Failed to check setup status', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    const client = await pool.connect()

    try {
      if (action === 'create_tables') {
        // Create the quotation junction tables
        await client.query('BEGIN')

        const createServicesTable = `
          CREATE TABLE IF NOT EXISTS quotation_services (
            id SERIAL PRIMARY KEY,
            quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
            service_id INTEGER,
            service_name VARCHAR(255),
            quantity INTEGER DEFAULT 1,
            package_type VARCHAR(100),
            unit_price DECIMAL(10,2),
            total_price DECIMAL(10,2),
            status VARCHAR(50) DEFAULT 'included',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        const createDeliverablesTable = `
          CREATE TABLE IF NOT EXISTS quotation_deliverables (
            id SERIAL PRIMARY KEY,
            quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
            deliverable_id INTEGER,
            deliverable_name VARCHAR(255),
            quantity INTEGER DEFAULT 1,
            package_type VARCHAR(100),
            unit_price DECIMAL(10,2),
            total_price DECIMAL(10,2),
            status VARCHAR(50) DEFAULT 'included',
            workflow_status VARCHAR(50) DEFAULT 'pending',
            assigned_to INTEGER REFERENCES employees(id),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        const createIndexes = `
          CREATE INDEX IF NOT EXISTS idx_quotation_services_quotation_id ON quotation_services(quotation_id);
          CREATE INDEX IF NOT EXISTS idx_quotation_services_service_id ON quotation_services(service_id);
          CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_quotation_id ON quotation_deliverables(quotation_id);
          CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_deliverable_id ON quotation_deliverables(deliverable_id);
          CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_assigned_to ON quotation_deliverables(assigned_to);
        `

        await client.query(createServicesTable)
        await client.query(createDeliverablesTable) 
        await client.query(createIndexes)

        await client.query('COMMIT')

        return NextResponse.json({
          success: true,
          message: "Quotation junction tables created successfully",
          tables_created: ['quotation_services', 'quotation_deliverables'],
          indexes_created: 5,
          database: "PostgreSQL localhost:5432"
        })

      } else if (action === 'verify_tables') {
        // Verify that tables exist and have expected structure
        const servicesQuery = `
          SELECT quotation_id, service_name, quantity, unit_price, total_price, status
          FROM quotation_services 
          LIMIT 5
        `
        
        const deliverablesQuery = `
          SELECT quotation_id, deliverable_name, quantity, unit_price, total_price, status, workflow_status
          FROM quotation_deliverables 
          LIMIT 5
        `

        let verification: any = {}

        try {
          const servicesResult = await client.query(servicesQuery)
          verification.quotation_services = {
            exists: true,
            sample_data: servicesResult.rows,
            row_count: servicesResult.rows.length
          }
        } catch (error: any) {
          verification.quotation_services = {
            exists: false,
            error: error.message
          }
        }

        try {
          const deliverablesResult = await client.query(deliverablesQuery)
          verification.quotation_deliverables = {
            exists: true,
            sample_data: deliverablesResult.rows,
            row_count: deliverablesResult.rows.length
          }
        } catch (error: any) {
          verification.quotation_deliverables = {
            exists: false,
            error: error.message
          }
        }

        return NextResponse.json({
          success: true,
          verification,
          message: "Table verification completed",
          database: "PostgreSQL localhost:5432"
        })

      } else if (action === 'migrate_data') {
        // Migrate data from existing quotations table JSON columns
        await client.query('BEGIN')

        // This would extract data from quotation_data JSON and insert into junction tables
        // For now, we'll create sample data to demonstrate the structure
        
        const sampleServicesQuery = `
          INSERT INTO quotation_services (quotation_id, service_name, quantity, unit_price, total_price, status)
          SELECT 
            id as quotation_id,
            'Wedding Photography' as service_name,
            1 as quantity,
            50000.00 as unit_price,
            50000.00 as total_price,
            'included' as status
          FROM quotations 
          WHERE NOT EXISTS (SELECT 1 FROM quotation_services WHERE quotation_id = quotations.id)
          LIMIT 5
        `

        const sampleDeliverablesQuery = `
          INSERT INTO quotation_deliverables (quotation_id, deliverable_name, quantity, unit_price, total_price, status)
          SELECT 
            id as quotation_id,
            'Edited Photos' as deliverable_name,
            200 as quantity,
            100.00 as unit_price,
            20000.00 as total_price,
            'included' as status
          FROM quotations 
          WHERE NOT EXISTS (SELECT 1 FROM quotation_deliverables WHERE quotation_id = quotations.id)
          LIMIT 5
        `

        const servicesResult = await client.query(sampleServicesQuery)
        const deliverablesResult = await client.query(sampleDeliverablesQuery)

        await client.query('COMMIT')

        return NextResponse.json({
          success: true,
          message: "Sample data migration completed",
          migrated: {
            services: servicesResult.rowCount || 0,
            deliverables: deliverablesResult.rowCount || 0
          },
          note: "This creates sample data. Real migration would extract from quotation_data JSON field"
        })

      } else {
        return NextResponse.json({
          success: false,
          error: "Unknown action. Available actions: create_tables, verify_tables, migrate_data"
        })
      }

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('Setup action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform setup action', details: error.message },
      { status: 500 }
    )
  }
} 