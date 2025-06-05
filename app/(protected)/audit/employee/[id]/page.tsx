"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ChevronLeft, AlertCircle, User } from "lucide-react"

interface AuditLog {
  id: number
  entity_id: string
  entity_type: string
  action: string
  user_id: string
  timestamp: string
  old_values: any
  new_values: any
  ip_address: string
  user_agent: string
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  employee_id: string
  email: string
  [key: string]: any
}

export default function EmployeeAuditPage() {
  const params = useParams()
  const router = useRouter()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const employeeId = (() => {
    try {
      if (typeof params.id === "string") {
        return Number.parseInt(params.id)
      } else if (Array.isArray(params.id) && params.id.length > 0) {
        return Number.parseInt(params.id[0])
      } else {
        console.error("Invalid ID parameter:", params.id)
        return 0
      }
    } catch (error) {
      console.error("Error parsing employee ID:", error)
      return 0
    }
  })()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch employee details
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("id", employeeId)
          .limit(1)
          .single()

        if (employeeError) {
          throw employeeError
        }

        setEmployee(employeeData)

        // Fetch audit logs for this employee
        const { data: logsData, error: logsError } = await supabase
          .from("audit_security.audit_trail")
          .select("*")
          .eq("entity_type", "employees")
          .eq("entity_id", employeeId.toString())
          .order("timestamp", { ascending: false })

        if (logsError) {
          throw logsError
        }

        setAuditLogs(logsData || [])
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    if (employeeId) {
      fetchData()
    }
  }, [employeeId])

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy h:mm a")
    } catch (e) {
      return timestamp
    }
  }

  const renderChanges = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return "No changes recorded"

    const changes = []

    // Compare old and new values
    if (oldValues && newValues) {
      const allKeys = [...new Set([...Object.keys(oldValues), ...Object.keys(newValues)])]

      for (const key of allKeys) {
        const oldValue = oldValues[key]
        const newValue = newValues[key]

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push(
            <div key={key} className="mb-1">
              <span className="font-medium">{key}: </span>
              <span className="text-red-500 line-through">{JSON.stringify(oldValue)}</span>
              <span className="mx-1">→</span>
              <span className="text-green-500">{JSON.stringify(newValue)}</span>
            </div>,
          )
        }
      }
    } else if (newValues) {
      // Only new values (create)
      for (const [key, value] of Object.entries(newValues)) {
        changes.push(
          <div key={key} className="mb-1">
            <span className="font-medium">{key}: </span>
            <span className="text-green-500">{JSON.stringify(value)}</span>
          </div>,
        )
      }
    } else if (oldValues) {
      // Only old values (delete)
      for (const [key, value] of Object.entries(oldValues)) {
        changes.push(
          <div key={key} className="mb-1">
            <span className="font-medium">{key}: </span>
            <span className="text-red-500 line-through">{JSON.stringify(value)}</span>
          </div>,
        )
      }
    }

    return changes.length ? changes : "No changes detected"
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading Employee Audit History...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Employee Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>The employee with ID {employeeId} could not be found.</p>
            <Button className="mt-4" onClick={() => router.push("/people/employees")}>
              View All Employees
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          Audit History: {employee.first_name} {employee.last_name}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Details
          </CardTitle>
          <CardDescription>Basic information about the employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Employee ID</p>
              <p>{employee.employee_id || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p>
                {employee.first_name} {employee.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p>{employee.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Job Title</p>
              <p>{employee.job_title || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p
                className={`${
                  employee.status === "active"
                    ? "text-green-600"
                    : employee.status === "inactive"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {employee.status || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p>{employee.location || "N/A"}</p>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push(`/people/employees/${employeeId}`)}>
              View Full Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
          <CardDescription>
            {auditLogs.length
              ? `Showing ${auditLogs.length} audit log entries for this employee`
              : "No audit history found for this employee"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No audit logs found for this employee</p>
              <p className="text-sm mt-2">Changes to this employee record will be tracked here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action === "create"
                              ? "bg-green-100 text-green-800"
                              : log.action === "update"
                                ? "bg-blue-100 text-blue-800"
                                : log.action === "delete"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell>{log.user_id}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-xs overflow-auto max-h-32">
                          {renderChanges(log.old_values, log.new_values)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
