import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Fixing employee departments (PostgreSQL)')
    
    const client = await pool.connect()
    
    try {
      // Check current employees
      const allEmployeesQuery = `
        SELECT id, name, department_id
        FROM employees
      `
      const allEmployeesResult = await client.query(allEmployeesQuery)
      const allEmployees = allEmployeesResult.rows

      console.log('Current employees from PostgreSQL:', allEmployees)

      if (!allEmployees || allEmployees.length === 0) {
        // Create the employees we need
        const employeesToCreate = [
          {
            name: 'Vikas Alagarsamy',
            first_name: 'Vikas',
            last_name: 'Alagarsamy',
            email: 'vikas@company.com',
            department_id: 2, // Sales department ID
            designation_id: 5, // CEO designation for sales
            job_title: 'Business Owner'
          },
          {
            name: 'Navya N Kumar',
            first_name: 'Navya',
            last_name: 'Kumar',
            email: 'navya@company.com',
            department_id: 2, // Sales department ID
            designation_id: 4, // Managing Director designation for sales
            job_title: 'Sales Representative'
          }
        ]

        const insertQuery = `
          INSERT INTO employees (name, first_name, last_name, email, department_id, designation_id, job_title)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `

        const createdEmployees = []
        for (const emp of employeesToCreate) {
          const result = await client.query(insertQuery, [
            emp.name, emp.first_name, emp.last_name, emp.email, emp.department_id, emp.designation_id, emp.job_title
          ])
          createdEmployees.push(result.rows[0])
        }

        console.log(`✅ Created ${createdEmployees.length} employees in PostgreSQL`)

        return NextResponse.json({
          success: true,
          message: `Created ${createdEmployees.length} employees`,
          employees: createdEmployees,
          metadata: {
            source: "Direct PostgreSQL",
            timestamp: new Date().toISOString()
          }
        })
      } else {
        // Update existing employees to have Sales department (department_id = 2)
        const updates = []
        for (const emp of allEmployees) {
          if (emp.department_id !== 2) {
            const updateQuery = `
              UPDATE employees 
              SET department_id = $1 
              WHERE id = $2
            `
            await client.query(updateQuery, [2, emp.id]) // Sales department ID = 2
            updates.push(emp.name)
          }
        }

        console.log(`✅ Updated ${updates.length} employees to Sales department in PostgreSQL`)

        return NextResponse.json({
          success: true,
          message: `Updated ${updates.length} employees to Sales department`,
          updated: updates,
          all_employees: allEmployees,
          metadata: {
            source: "Direct PostgreSQL",
            timestamp: new Date().toISOString()
          }
        })
      }
      
    } finally {
      client.release()
    }
    
  } catch (error: any) {
    console.error('❌ Error fixing employee departments:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error.message
    }, { status: 500 })
  }
} 