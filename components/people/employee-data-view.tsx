"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronUp, Eye, Mail, Phone, Calendar } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"

interface EmployeeDataViewProps {
  data: any[]
  viewMode: "table" | "cards"
  sortConfig: {
    key: string
    direction: "asc" | "desc"
  }
  onSort: (key: string) => void
}

export function EmployeeDataView({ data, viewMode, sortConfig, onSort }: EmployeeDataViewProps) {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" aria-hidden="true" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "on_leave":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            On Leave
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  if (viewMode === "table") {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <ScrollArea className="h-[calc(100vh-350px)]">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onSort("employee_id")}
                >
                  <div className="flex items-center">ID {getSortIcon("employee_id")}</div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onSort("first_name")}
                >
                  <div className="flex items-center">Name {getSortIcon("first_name")}</div>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onSort("job_title")}
                >
                  <div className="flex items-center">Position {getSortIcon("job_title")}</div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onSort("department_name")}
                >
                  <div className="flex items-center">Department {getSortIcon("department_name")}</div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onSort("branch_name")}
                >
                  <div className="flex items-center">Branch {getSortIcon("branch_name")}</div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onSort("hire_date")}
                >
                  <div className="flex items-center">Hire Date {getSortIcon("hire_date")}</div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onSort("status")}
                >
                  <div className="flex items-center">Status {getSortIcon("status")}</div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((employee) => (
                  <TableRow key={employee.id} className="group">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(employee.first_name, employee.last_name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{employee.employee_id}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{employee.designation_title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-xs">
                          <Mail className="h-3 w-3 mr-1 text-muted-foreground" aria-hidden="true" />
                          <span className="truncate max-w-[150px]">{employee.email}</span>
                        </div>
                        {employee.phone && (
                          <div className="flex items-center text-xs">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" aria-hidden="true" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{employee.job_title}</TableCell>
                    <TableCell>{employee.department_name}</TableCell>
                    <TableCell>{employee.branch_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" aria-hidden="true" />
                        {formatDate(employee.hire_date)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/people/employees/${employee.id}`}
                          aria-label={`View details for ${employee.first_name} ${employee.last_name}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">View details</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    )
  }

  // Card view
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.length === 0 ? (
        <div className="col-span-full h-24 flex items-center justify-center bg-white rounded-lg shadow-sm border">
          <p className="text-muted-foreground">No employees found.</p>
        </div>
      ) : (
        data.map((employee) => (
          <div
            key={employee.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(employee.first_name, employee.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{employee.job_title}</p>
                </div>
                <div className="ml-auto">{getStatusBadge(employee.status)}</div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Employee ID:</span>
                <span className="font-medium">{employee.employee_id}</span>

                <span className="text-muted-foreground">Department:</span>
                <span>{employee.department_name}</span>

                <span className="text-muted-foreground">Branch:</span>
                <span>{employee.branch_name}</span>

                <span className="text-muted-foreground">Hire Date:</span>
                <span>{formatDate(employee.hire_date)}</span>

                <span className="text-muted-foreground">Company:</span>
                <span>{employee.primary_company_name}</span>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center text-sm">
                  <Mail className="h-3 w-3 mr-2 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center text-sm mt-1">
                    <Phone className="h-3 w-3 mr-2 text-muted-foreground" aria-hidden="true" />
                    {employee.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="p-2 bg-muted/20 border-t">
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link
                  href={`/people/employees/${employee.id}`}
                  aria-label={`View details for ${employee.first_name} ${employee.last_name}`}
                >
                  <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
