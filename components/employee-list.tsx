"use client"

import { useState } from "react"
import type { Employee } from "@/types/employee"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Pencil, Trash2, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface EmployeeListProps {
  employees: Employee[]
  loading?: boolean
  onEditEmployee: (id: number) => void
  onDeleteEmployee: (id: number) => void
  onViewEmployee: (id: number) => void
  selectedEmployees: number[]
  setSelectedEmployees: (ids: number[]) => void
}

export default function EmployeeList({
  employees,
  loading,
  onEditEmployee,
  onDeleteEmployee,
  onViewEmployee,
  selectedEmployees,
  setSelectedEmployees,
}: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Safely access properties with fallbacks
  const safeEmployees = employees.map((employee) => ({
    id: employee?.id || 0,
    employee_id: employee?.employee_id || "N/A",
    first_name: employee?.first_name || "",
    last_name: employee?.last_name || "",
    email: employee?.email || "",
    job_title: employee?.job_title || "N/A",
    department: employee?.department || employee?.departments?.name || "Not Assigned",
    status: employee?.status || "Unknown",
    // Don't include location as it might not exist
  }))

  const filteredEmployees = safeEmployees.filter(
    (employee) =>
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      onDeleteEmployee(deletingId)
    } catch (error) {
      console.error("Error deleting employee:", error)
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployees((prevSelected) => {
      const isSelected = prevSelected.includes(employeeId)
      if (isSelected) {
        return prevSelected.filter((id) => id !== employeeId)
      } else {
        return [...prevSelected, employeeId]
      }
    })
  }

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>

    switch (status.toLowerCase()) {
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
      case "terminated":
        return <Badge variant="destructive">Terminated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading employees...</p>
        </CardContent>
      </Card>
    )
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No employees added yet. Add your first employee to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full sm:w-[300px]"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No employees found matching your search.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEmployees(filteredEmployees.map((emp) => emp.id))
                        } else {
                          setSelectedEmployees([])
                        }
                      }}
                      aria-label="Select all employees"
                    />
                  </TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                        aria-label={`Select ${employee.first_name} ${employee.last_name}`}
                      />
                    </TableCell>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={employee.email || ""}>
                      {employee.email}
                    </TableCell>
                    <TableCell>{employee.job_title}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => onViewEmployee(employee.id)}>
                                <Eye className="h-4 w-4 text-blue-600" />
                                <span className="sr-only">View</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View employee details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => onEditEmployee(employee.id)}>
                                <Pencil className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit employee information</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDeletingId(employee.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete employee</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
