"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getRecentEmployees } from "@/actions/dashboard-actions"
import { formatDistanceToNow } from "date-fns"
import type { Employee } from "@/types/employee"

export function RecentEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRecentEmployees()
        setEmployees(data)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching recent employees:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <div className="flex justify-center items-center h-32">Loading recent employees...</div>
  }

  if (employees.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No employees added recently</div>
  }

  return (
    <div className="space-y-4">
      {employees.map((employee) => (
        <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>
                {employee.first_name.charAt(0)}
                {employee.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/people/employees/${employee.id}`} className="font-medium hover:underline">
                {employee.first_name} {employee.last_name}
              </Link>
              <div className="text-sm text-muted-foreground">
                {employee.job_title || "No Job Title"} • {employee.department_name || "No Department"}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={
                employee.status === "active"
                  ? "success"
                  : employee.status === "inactive"
                    ? "secondary"
                    : employee.status === "on_leave"
                      ? "warning"
                      : "destructive"
              }
            >
              {employee.status.replace("_", " ")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Added {formatDistanceToNow(new Date(employee.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
