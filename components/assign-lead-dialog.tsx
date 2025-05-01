"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import type { Lead } from "@/types/lead"
import { assignLead } from "@/actions/lead-actions"
import { supabase } from "@/lib/supabase"
import { UserCog, Loader2, Check, X, User, MapPin, Building } from "lucide-react"

// Employee interface with only columns we know exist
interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  full_name: string
  job_title?: string
  // Add company and branch allocation information
  companies?: {
    company_id: number
    company_name: string
    branch_id?: number
    branch_name?: string
    percentage?: number // Make percentage optional
    is_primary?: boolean
    location?: string
  }[]
}

interface AssignLeadDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (success: boolean) => void
}

export function AssignLeadDialog({ lead, open, onOpenChange, onComplete }: AssignLeadDialogProps) {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetchingEmployees, setFetchingEmployees] = useState(true)

  // Fetch employees when dialog opens
  useEffect(() => {
    if (open) {
      fetchSalesEmployees()
    }
  }, [open, lead])

  // Update the fetchSalesEmployees function to better handle employee company-branch allocations
  const fetchSalesEmployees = async () => {
    setFetchingEmployees(true)
    try {
      console.log("Fetching employees for lead assignment with company-branch allocations")

      // First attempt: Try to get employees with their allocations using a direct query
      try {
        // Query employees with their company and branch allocations
        const { data: employeesWithAllocations, error: allocationsError } = await supabase
          .from("employees")
          .select(`
            id, 
            employee_id, 
            first_name, 
            last_name, 
            job_title,
            status,
            department_id,
            role
          `)
          .eq("status", "active")
          .or(
            `job_title.ilike.%sales%,job_title.ilike.%account%,job_title.ilike.%business development%,role.ilike.%sales%`,
          )

        if (allocationsError) {
          console.error("Error fetching employees with allocations:", allocationsError)
          throw allocationsError
        }

        if (employeesWithAllocations && employeesWithAllocations.length > 0) {
          console.log(`Found ${employeesWithAllocations.length} sales employees, fetching their allocations`)

          // For each employee, fetch their company-branch allocations
          const employeesWithDetails = await Promise.all(
            employeesWithAllocations.map(async (employee) => {
              // Get company allocations for this employee
              const { data: allocations, error: allocError } = await supabase
                .from("employee_companies")
                .select(`
                  id,
                  company_id,
                  branch_id,
                  allocation_percentage,
                  is_primary,
                  companies(id, name),
                  branches(id, name, location)
                `)
                .eq("employee_id", employee.id)

              if (allocError) {
                console.warn(`Error fetching allocations for employee ${employee.id}:`, allocError)
                return {
                  ...employee,
                  companies: [],
                }
              }

              // Format the allocations data
              const companies = (allocations || []).map((allocation) => ({
                company_id: allocation.company_id,
                company_name: allocation.companies?.name || "Unknown Company",
                branch_id: allocation.branch_id,
                branch_name: allocation.branches?.name || "Unknown Branch",
                location: allocation.branches?.location,
                percentage: allocation.allocation_percentage,
                is_primary: allocation.is_primary,
              }))

              return {
                ...employee,
                companies,
              }
            }),
          )

          processEmployees(employeesWithDetails)
          return
        }
      } catch (directQueryError) {
        console.error("Error with direct query approach:", directQueryError)
      }

      // Fallback: Get basic employee data if the detailed query fails
      console.log("Falling back to basic employee query")
      const { data: basicEmployees, error: basicError } = await supabase
        .from("employees")
        .select("id, employee_id, first_name, last_name, job_title")
        .eq("status", "active")

      if (basicError) {
        console.error("Error fetching basic employee data:", basicError)
        setEmployees([])
        setFetchingEmployees(false)
        return
      }

      if (!basicEmployees || basicEmployees.length === 0) {
        console.log("No employees found")
        setEmployees([])
        setFetchingEmployees(false)
        return
      }

      processEmployees(basicEmployees)
    } catch (error) {
      console.error("Exception fetching employees:", error)
      setEmployees([])
      setFetchingEmployees(false)
    }
  }

  // Process and format employee data
  const processEmployees = (employeeData: any[]) => {
    console.log(`Processing ${employeeData.length} employees`)

    // Format employees for display
    const formattedEmployees = employeeData.map((emp) => {
      // Ensure we have the basic employee data
      const employee = {
        id: emp.id,
        employee_id: emp.employee_id || "",
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: `${emp.first_name} ${emp.last_name}`,
        job_title: emp.job_title || "",
        companies: emp.companies || [],
      }

      // Log employee allocations for debugging
      if (employee.companies && employee.companies.length > 0) {
        console.log(`Employee ${employee.full_name} has ${employee.companies.length} company allocations`)
      }

      return employee
    })

    // Sort by name
    const sortedEmployees = formattedEmployees.sort((a, b) => {
      return a.full_name.localeCompare(b.full_name)
    })

    // Filter to prioritize employees with matching company/branch to the lead
    const prioritizedEmployees = sortedEmployees.sort((a, b) => {
      const aHasMatchingCompany =
        a.companies?.some(
          (c) => c.company_name === lead.company_name || (lead.branch_name && c.branch_name === lead.branch_name),
        ) || false

      const bHasMatchingCompany =
        b.companies?.some(
          (c) => c.company_name === lead.company_name || (lead.branch_name && c.branch_name === lead.branch_name),
        ) || false

      if (aHasMatchingCompany && !bHasMatchingCompany) return -1
      if (!aHasMatchingCompany && bHasMatchingCompany) return 1
      return 0
    })

    setEmployees(prioritizedEmployees)
    setFetchingEmployees(false)
  }

  const handleAssign = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select a team member to assign this lead to.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const employeeId = Number.parseInt(selectedEmployeeId, 10)
      const employee = employees.find((emp) => emp.id === employeeId)

      if (!employee) {
        throw new Error("Selected employee not found")
      }

      const result = await assignLead(lead.id, lead.lead_number, lead.client_name, employeeId, employee.full_name)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        onComplete(true)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error assigning lead:", error)
      toast({
        title: "Error",
        description: `Failed to assign lead: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      onComplete(false)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get role display text
  const getRoleDisplay = (employee: Employee): string => {
    if (employee.job_title) return employee.job_title
    return "Team Member"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Assign Lead
          </DialogTitle>
          <DialogDescription>
            Assign lead {lead.lead_number} ({lead.client_name}) to a team member.
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Building className="h-3.5 w-3.5" />
                <span>Company: {lead.company_name}</span>
              </div>
              {lead.branch_name && (
                <div className="flex items-center gap-1 text-sm">
                  <Building className="h-3.5 w-3.5" />
                  <span>Branch: {lead.branch_name}</span>
                </div>
              )}
              {lead.location && (
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Location: {lead.location}</span>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Team Member
            </Label>
            {fetchingEmployees ? (
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading team members...</span>
              </div>
            ) : (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <SelectItem value="no-employees" disabled>
                      No team members found
                    </SelectItem>
                  ) : (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()} className="py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{employee.full_name}</span>
                          {employee.job_title && (
                            <span className="text-xs text-muted-foreground">{employee.job_title}</span>
                          )}
                          {employee.companies && employee.companies.length > 0 ? (
                            <div className="mt-1 space-y-0.5">
                              {employee.companies.map((allocation, idx) => (
                                <div key={idx} className="text-xs flex items-center gap-1">
                                  <Building className="h-3 w-3 text-muted-foreground" />
                                  <span
                                    className={`${allocation.is_primary ? "font-medium" : ""} ${
                                      allocation.company_name === lead.company_name
                                        ? "text-green-600"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {allocation.company_name}
                                    {allocation.branch_name && ` - ${allocation.branch_name}`}
                                    {allocation.percentage && ` (${allocation.percentage}%)`}
                                    {allocation.is_primary && " (Primary)"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-amber-600">No company allocations</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            <div className="text-xs text-muted-foreground">Select a team member to handle this lead.</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="gap-1">
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedEmployeeId} className="gap-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Assign Lead</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
