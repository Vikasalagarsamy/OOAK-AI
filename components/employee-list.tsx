"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Search, CheckCircle2, XCircle, Clock, AlertCircle, User, Building2 } from "lucide-react"
import { DeleteEmployeeDialog } from "@/components/delete-employee-dialog"
import { BatchDeleteEmployeesDialog } from "@/components/batch-delete-employees-dialog"
import { deleteEmployee } from "@/actions/employee-actions"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Employee } from "@/types/employee"

interface EmployeeListProps {
  employees: Employee[]
}

export function EmployeeList({ employees }: EmployeeListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredEmployees = employees.filter((employee) => {
    const searchTermLower = searchTerm.toLowerCase()
    return (
      employee.first_name?.toLowerCase().includes(searchTermLower) ||
      employee.last_name?.toLowerCase().includes(searchTermLower) ||
      employee.email?.toLowerCase().includes(searchTermLower) ||
      employee.employee_id?.toLowerCase().includes(searchTermLower) ||
      employee.job_title?.toLowerCase().includes(searchTermLower) ||
      employee.departments?.name?.toLowerCase().includes(searchTermLower) ||
      employee.designations?.name?.toLowerCase().includes(searchTermLower) ||
      employee.companies?.name?.toLowerCase().includes(searchTermLower) ||
      employee.branches?.name?.toLowerCase().includes(searchTermLower)
    )
  })

  const handleSelectEmployee = (id: string) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((empId) => empId !== id))
    } else {
      setSelectedEmployees([...selectedEmployees, id])
    }
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id.toString()))
    }
  }

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!employeeToDelete) return

    setIsDeleting(true)

    try {
      await deleteEmployee(employeeToDelete.id.toString())
      toast({
        title: "Employee deleted",
        description: `${employeeToDelete.first_name} ${employeeToDelete.last_name} has been deleted.`,
      })
      router.refresh()
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "on_leave":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "terminated":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "Active"
      case "inactive":
        return "Inactive"
      case "on_leave":
        return "On Leave"
      case "terminated":
        return "Terminated"
      default:
        return "Unknown"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "on_leave":
        return "bg-amber-100 text-amber-800"
      case "terminated":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search employees..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {selectedEmployees.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBatchDeleteDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedEmployees.length})
            </Button>
          )}
          <Button asChild>
            <Link href="/people/employees/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id.toString())}
                      onChange={() => handleSelectEmployee(employee.id.toString())}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/people/employees/${employee.id}`} className="font-medium hover:underline">
                      {employee.first_name} {employee.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>{employee.employee_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(employee.status || "")}
                      <Badge className={getStatusColor(employee.status || "")}>
                        {getStatusText(employee.status || "")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{employee.job_title || "—"}</TableCell>
                  <TableCell>{employee.departments?.name || "—"}</TableCell>
                  <TableCell>
                    {employee.companies?.name ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{employee.companies.name}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">Company Allocations:</p>
                              {employee.allocations?.map((allocation) => (
                                <div key={allocation.id} className="text-xs">
                                  {allocation.company_name} ({allocation.branch_name}):{" "}
                                  {allocation.allocation_percentage}%{allocation.is_primary && " (Primary)"}
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/people/employees/${employee.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(employee)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteEmployeeDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        employeeName={employeeToDelete ? `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : ""}
      />

      <BatchDeleteEmployeesDialog
        isOpen={isBatchDeleteDialogOpen}
        onClose={() => setIsBatchDeleteDialogOpen(false)}
        employeeIds={selectedEmployees}
        onSuccess={() => {
          setSelectedEmployees([])
          router.refresh()
        }}
      />
    </div>
  )
}
