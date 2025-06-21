import { pool } from '@/lib/postgresql-client'
import { type NextRequest, NextResponse } from "next/server"

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// Security: Whitelist of allowed SQL operations
const ALLOWED_OPERATIONS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE TABLE', 'ALTER TABLE', 
  'DROP TABLE', 'CREATE INDEX', 'DROP INDEX', 'TRUNCATE'
]

// Dangerous operations that require extra confirmation
const DANGEROUS_OPERATIONS = [
  'DELETE', 'DROP', 'TRUNCATE', 'ALTER TABLE'
]

export async function POST(request: NextRequest) {
  try {
    const { sql, confirm_dangerous } = await request.json()

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ 
        error: "SQL query is required and must be a string" 
      }, { status: 400 })
    }

    // Basic security checks
    const sqlUpper = sql.trim().toUpperCase()
    const operation = sqlUpper.split(' ')[0]

    // Check if operation is allowed
    if (!ALLOWED_OPERATIONS.some(op => sqlUpper.startsWith(op))) {
      return NextResponse.json({ 
        error: `Operation '${operation}' is not allowed. Allowed operations: ${ALLOWED_OPERATIONS.join(', ')}`,
        securityLevel: 'BLOCKED'
      }, { status: 403 })
    }

    // Check for dangerous operations
    const isDangerous = DANGEROUS_OPERATIONS.some(op => sqlUpper.startsWith(op))
    if (isDangerous && !confirm_dangerous) {
      return NextResponse.json({ 
        error: `This is a dangerous operation (${operation}). Set confirm_dangerous: true to proceed.`,
        securityLevel: 'REQUIRES_CONFIRMATION',
        operation: operation
      }, { status: 400 })
    }

    const client = await pool.connect()
    const startTime = Date.now()

    try {
      console.log(`🔧 Admin SQL Execution: ${operation} (${sql.length} chars)`)
      
      // Execute the SQL query
      const result = await client.query(sql)
      const executionTime = Date.now() - startTime

      console.log(`✅ SQL executed successfully in ${executionTime}ms`)

      // Log the execution for audit purposes
      const auditLogQuery = `
        INSERT INTO admin_audit_log (
          operation, sql_query, execution_time_ms, rows_affected, 
          executed_at, security_level
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `

      // Try to log to audit table (if it exists)
      try {
        await client.query(auditLogQuery, [
          operation,
          sql.substring(0, 1000), // Truncate long queries
          executionTime,
          result.rowCount || 0,
          new Date().toISOString(),
          isDangerous ? 'DANGEROUS' : 'NORMAL'
        ])
      } catch (auditError) {
        console.warn('⚠️ Could not log to audit table (table may not exist):', auditError)
      }

      return NextResponse.json({ 
        success: true,
        operation: operation,
        rowsAffected: result.rowCount || 0,
        executionTime: `${executionTime}ms`,
        data: result.rows || [],
        metadata: {
          source: "Direct PostgreSQL Admin",
          timestamp: new Date().toISOString(),
          securityLevel: isDangerous ? 'DANGEROUS' : 'NORMAL'
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error("❌ Error executing admin SQL:", error)
    
    // Provide detailed error information
    let errorDetails = {
      message: error.message || 'Unknown error',
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    }

    return NextResponse.json({
      error: "SQL execution failed",
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint to show allowed operations and security info
export async function GET() {
  return NextResponse.json({
    status: "Admin SQL Executor - PostgreSQL",
    allowedOperations: ALLOWED_OPERATIONS,
    dangerousOperations: DANGEROUS_OPERATIONS,
    security: {
      operationWhitelist: "Enabled",
      dangerousOperationConfirmation: "Required",
      auditLogging: "Enabled (if admin_audit_log table exists)"
    },
    usage: {
      endpoint: "POST /api/admin/execute-sql",
      body: {
        sql: "string (required)",
        confirm_dangerous: "boolean (required for dangerous operations)"
      }
    },
    examples: [
      {
        operation: "SELECT",
        sql: "SELECT COUNT(*) FROM employees",
        dangerous: false
      },
      {
        operation: "DELETE", 
        sql: "DELETE FROM logs WHERE created_at < '2024-01-01'",
        dangerous: true,
        note: "Requires confirm_dangerous: true"
      }
    ],
    metadata: {
      database: "PostgreSQL localhost:5432",
      timestamp: new Date().toISOString()
    }
  })
}
