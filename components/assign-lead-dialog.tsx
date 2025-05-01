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
    allocation_percentage?: number // Use allocation_percentage instead of percentage
    is_primary?: boolean
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

  // Update the fetchSalesEmployees function
  const fetchSalesEmployees = async () => {
    setFetchingEmployees(true)
    try {
      console.log("Fetching employees for lead assignment with company allocations")

      // Direct database approach - get employees with company allocations
      const { data: employees, error } = await supabase
        .from("employees")
        .select(`
        id, employee_id, first_name, last_name, job_title, department_id, designation_id, status,
        employee_companies(
          id, company_id, branch_id, allocation_percentage, is_primary,
          companies:company_id(id, name),
          branches:branch_id(id, name)
        )
      `)
        .eq("status", "active")
        .order("first_name")

      if (error) {
        console.error("Error fetching employees with allocations:", error)
        // Fall back to basic employee data
        const { data: basicEmployees, error: basicError } = await supabase
          .from("employees")
          .select("id, employee_id, first_name, last_name, job_title")
          .eq("status", "active")
          .order("first_name")

        if (basicError) {
          console.error("Error fetching basic employee data:", basicError)
          setEmployees([])
          setFetchingEmployees(false)
          return
        }

        processEmployees(basicEmployees || [])
        return
      }

      // Process employees with their company allocations
      const processedEmployees = employees.map((emp) => {
        // Map company allocations
        const companies =
          emp.employee_companies?.map((ec) => ({
            company_id: ec.company_id,
            company_name: ec.companies?.name || "Unknown Company",
            branch_id: ec.branch_id,
            branch_name: ec.branches?.name || "Unknown Branch",
            allocation_percentage: ec.allocation_percentage,
            is_primary: ec.is_primary,
          })) || []

        return {
          ...emp,
          companies,
          full_name: `${emp.first_name} ${emp.last_name}`,
        }
      })

      // Filter for sales employees
      const salesEmployees = processedEmployees.filter((emp) => {
        const isSalesDept = emp.department_id === 3 // Assuming 3 is sales dept
        const hasSalesTitle =
          (emp.job_title || "").toLowerCase().includes("sales") ||
          (emp.job_title || "").toLowerCase().includes("account") ||
          (emp.job_title || "").toLowerCase().includes("business development")

        return isSalesDept || hasSalesTitle
      })

      if (salesEmployees.length > 0) {
        setEmployees(salesEmployees)
      } else {
        // If no sales employees found, use all employees
        setEmployees(processedEmployees)
      }

      setFetchingEmployees(false)
    } catch (error) {
      console.error("Exception fetching employees:", error)
      setEmployees([])
      setFetchingEmployees(false)
    }
  }

  // Process and format employee data
  const processEmployees = (employeeData: any[]) => {
    console.log(`Found ${employeeData.length} employees`)

    // Format employees for display
    const formattedEmployees = employeeData.map((emp) => ({
      id: emp.id,
      employee_id: emp.employee_id || "",
      first_name: emp.first_name,
      last_name: emp.last_name,
      full_name: `${emp.first_name} ${emp.last_name}`,
      job_title: emp.job_title || "",
    }))

    // Sort by name
    const sortedEmployees = formattedEmployees.sort((a, b) => {
      return a.full_name.localeCompare(b.full_name)
    })

    setEmployees(sortedEmployees)
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
                          <span>{employee.full_name}</span>
                          {employee.job_title && (
                            <span className="text-xs text-muted-foreground">{employee.job_title}</span>
                          )}
                          {employee.companies && employee.companies.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {employee.companies.map((allocation, idx) => (
                                <div key={idx} className="text-xs flex items-center gap-1">
                                  <Building className="h-3 w-3 text-muted-foreground" />
                                  <span
                                    className={`${allocation.is_primary ? "font-medium text-primary" : "text-muted-foreground"}`}
                                  >
                                    {allocation.company_name}
                                    {allocation.branch_name && ` - ${allocation.branch_name}`}
                                    {allocation.allocation_percentage && ` (${allocation.allocation_percentage}%)`}
                                    {allocation.is_primary && " (Primary)"}
                                  </span>
                                </div>
                              ))}
                            </div>
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
