"use client"

import { useState, useEffect } from "react"
import { query } from "@/lib/postgresql-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import { Search, Eye, RefreshCw } from "lucide-react"

interface Employee {
  id: string
  full_name: string
  email: string
  department: string
  designation: string
  last_activity?: string
  activity_count: number
}

export function EmployeeAuditList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Fetching employee audit data...')

      // Get employees with their audit statistics in a single optimized query
      const result = await query(`
        SELECT 
          e.id,
          e.full_name,
          e.email,
          e.department,
          e.designation,
          COUNT(a.id) as activity_count,
          MAX(a.timestamp) as last_activity
        FROM employees e
        LEFT JOIN audit_security.audit_trail a ON e.id::text = a.entity_id AND a.entity_type = 'employees'
        GROUP BY e.id, e.full_name, e.email, e.department, e.designation
        ORDER BY e.full_name
      `)

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch employee audit data')
      }

      const employeesWithAudit = (result.data || []).map(employee => ({
        id: employee.id.toString(),
        full_name: employee.full_name || 'Unknown',
        email: employee.email || '',
        department: employee.department || '',
        designation: employee.designation || '',
        activity_count: parseInt(employee.activity_count) || 0,
        last_activity: employee.last_activity || null,
      }))

      console.log(`✅ Loaded ${employeesWithAudit.length} employees with audit data`)
      setEmployees(employeesWithAudit)
    } catch (err: any) {
      console.error("❌ Error fetching employee audit data:", err)
      setError(err.message || "Failed to fetch employee data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Filter employees based on search query
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchEmployees} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No employees found matching your search criteria</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Activity Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <div>{employee.full_name}</div>
                    <div className="text-xs text-gray-500">{employee.email}</div>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.designation}</TableCell>
                  <TableCell>
                    {employee.last_activity
                      ? format(new Date(employee.last_activity), "MMM d, yyyy h:mm a")
                      : "No activity"}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {employee.activity_count}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/audit/employee/${employee.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View audit log</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
