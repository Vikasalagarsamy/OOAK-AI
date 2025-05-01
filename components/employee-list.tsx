"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { getEmployees } from "@/actions/employee-actions"
import type { Employee } from "@/types/employee"
import Link from "next/link"
import { DeleteEmployeeDialog } from "./delete-employee-dialog"
import { BatchDeleteEmployeesDialog } from "./batch-delete-employees-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Employee>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees()
        setEmployees(data || [])
        setFilteredEmployees(data || [])
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching employees:", error)
        toast({
          title: "Error",
          description: "Failed to load employees. Please try again.",
          variant: "destructive",
        })
        setEmployees([])
        setFilteredEmployees([])
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [toast])

  // Filter and sort employees
  useEffect(() => {
    if (!employees) return

    const filtered = employees.filter((employee) => {
      const searchString =
        `${employee.first_name} ${employee.last_name} ${employee.employee_id} ${employee.email || ""} ${employee.job_title || ""}`.toLowerCase()
      return searchString.includes(searchQuery.toLowerCase())
    })

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1
      if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc" ? (aValue < bValue ? -1 : 1) : bValue < aValue ? -1 : 1
    })

    setFilteredEmployees(sorted)
  }, [employees, searchQuery, sortField, sortDirection])

  const handleSort = (field: keyof Employee) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteDialogOpen(true)
  }

  // Handle optimistic UI update when an employee is deleted
  const handleEmployeeDeleted = useCallback(
    (employeeId: string) => {
      setEmployees((currentEmployees) => currentEmployees.filter((emp) => emp.id.toString() !== employeeId))

      // Refresh the data from the server
      router.refresh()
    },
    [router],
  )

  const renderSortIcon = (field: keyof Employee) => {
    if (field !== sortField) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  // Handle selecting/deselecting a single employee
  const handleSelectEmployee = (employee: Employee, isChecked: boolean) => {
    if (isChecked) {
      setSelectedEmployees((prev) => [...prev, employee])
    } else {
      setSelectedEmployees((prev) => prev.filter((emp) => emp.id !== employee.id))
    }
  }

  // Handle selecting/deselecting all employees
  const handleSelectAllEmployees = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedEmployees(filteredEmployees)
    } else {
      setSelectedEmployees([])
    }
  }

  // Check if an employee is selected
  const isEmployeeSelected = (employeeId: string | number) => {
    return selectedEmployees.some((emp) => emp.id === employeeId)
  }

  // Handle batch delete
  const handleBatchDelete = () => {
    if (selectedEmployees.length > 0) {
      setIsBatchDeleteDialogOpen(true)
    } else {
      toast({
        title: "No employees selected",
        description: "Please select at least one employee to delete.",
        variant: "destructive",
      })
    }
  }

  // Handle batch delete completion
  const handleBatchDeleteComplete = (deletedIds: string[]) => {
    // Remove deleted employees from the state
    setEmployees((currentEmployees) => currentEmployees.filter((emp) => !deletedIds.includes(emp.id.toString())))

    // Clear selection
    setSelectedEmployees([])

    // Refresh the data
    router.refresh()
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading employees...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {selectedEmployees.length > 0 && (
          <Button variant="destructive" onClick={handleBatchDelete}>
            Delete Selected ({selectedEmployees.length})
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length}
                  onCheckedChange={handleSelectAllEmployees}
                  aria-label="Select all employees"
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("employee_id")}>
                <div className="flex items-center gap-1">
                  Employee ID
                  {renderSortIcon("employee_id")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("first_name")}>
                <div className="flex items-center gap-1">
                  Name
                  {renderSortIcon("first_name")}
                </div>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Primary Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className={isEmployeeSelected(employee.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={isEmployeeSelected(employee.id)}
                      onCheckedChange={(checked) => handleSelectEmployee(employee, !!checked)}
                      aria-label={`Select ${employee.first_name} ${employee.last_name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{employee.employee_id}</TableCell>
                  <TableCell>
                    <Link href={`/people/employees/${employee.id}`} className="hover:underline">
                      {employee.first_name} {employee.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>{employee.email || "-"}</TableCell>
                  <TableCell>{employee.job_title || "-"}</TableCell>
                  <TableCell>{employee.department_name || "-"}</TableCell>
                  <TableCell>{employee.primary_company_name || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        employee.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/people/employees/${employee.id}`}>
                              <Button variant="ghost" size="icon" aria-label="View employee details">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/people/employees/${employee.id}/edit`}>
                              <Button variant="ghost" size="icon" aria-label="Edit employee">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit employee</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(employee)}
                              aria-label="Delete employee"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteEmployeeDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        employee={employeeToDelete}
        onDelete={handleEmployeeDeleted}
      />

      <BatchDeleteEmployeesDialog
        open={isBatchDeleteDialogOpen}
        onOpenChange={setIsBatchDeleteDialogOpen}
        selectedEmployees={selectedEmployees}
        onEmployeesDeleted={handleBatchDeleteComplete}
      />
    </div>
  )
}
