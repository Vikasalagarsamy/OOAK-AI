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
import { reassignLead, getEmployeesByCompanyAndBranch } from "@/actions/lead-reassignment-actions"
import { Loader2, Check, X, User, RefreshCw, Building, MapPin } from "lucide-react"

interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  full_name: string
  company_id?: number | null
  branch_id?: number | null
  role?: string
  location?: string
  is_sales_role?: boolean
}

interface ReassignLeadDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onReassignComplete: (success: boolean) => void
}

export function ReassignLeadDialog({ lead, open, onOpenChange, onReassignComplete }: ReassignLeadDialogProps) {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetchingEmployees, setFetchingEmployees] = useState(true)

  // Fetch employees on component mount and when dialog opens
  useEffect(() => {
    if (open) {
      fetchEmployees()
    }
  }, [open, lead.company_id, lead.branch_id, lead.location])

  const fetchEmployees = async () => {
    setFetchingEmployees(true)
    try {
      // Get employees from the same company, branch, and location
      const employeesData = await getEmployeesByCompanyAndBranch(
        lead.company_id,
        lead.branch_id,
        lead.location || lead.branch_location || null,
      )

      // Filter out the currently assigned employee
      const filteredEmployees = employeesData.filter((emp) => emp.id !== lead.assigned_to)

      // Additional validation to ensure only sales roles are included
      // This is a safeguard in case the server-side filtering missed something
      const salesOnlyEmployees = filteredEmployees.filter((emp) => {
        const role = (emp.role || "").toLowerCase()

        // Explicitly exclude executive roles
        if (
          role.includes("ceo") ||
          role.includes("cto") ||
          role.includes("cfo") ||
          role.includes("chief") ||
          role.includes("director") ||
          role.includes("head")
        ) {
          return false
        }

        // Include only if role contains sales-related terms
        return (
          role.includes("sales") ||
          role.includes("account manager") ||
          role.includes("business development") ||
          role.includes("account executive")
        )
      })

      // Sort employees to prioritize those in the same location as the lead
      const sortedEmployees = [...salesOnlyEmployees].sort((a, b) => {
        // If lead has a location, prioritize employees with matching location
        if (lead.location) {
          const aMatchesLocation = (a.location || "").toLowerCase() === lead.location.toLowerCase()
          const bMatchesLocation = (b.location || "").toLowerCase() === lead.location.toLowerCase()

          if (aMatchesLocation && !bMatchesLocation) return -1
          if (!aMatchesLocation && bMatchesLocation) return 1
        }

        // Otherwise sort alphabetically by name
        return a.full_name.localeCompare(b.full_name)
      })

      setEmployees(sortedEmployees)
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast({
        title: "Error",
        description: "Failed to fetch available resources. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFetchingEmployees(false)
    }
  }

  const handleReassign = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select a resource to reassign this lead to.",
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

      // Make sure we're passing the correct types to reassignLead
      const result = await reassignLead(
        Number(lead.id), // Ensure lead.id is a number
        lead.lead_number,
        lead.client_name,
        employeeId, // This is already a number
        employee.full_name,
      )

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        onReassignComplete(true)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error reassigning lead:", error)
      toast({
        title: "Error",
        description: `Failed to reassign lead: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      onReassignComplete(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reassign Lead
          </DialogTitle>
          <DialogDescription>
            Reassign lead {lead.lead_number} ({lead.client_name}) to a different resource.
            {lead.assigned_to_name && (
              <div className="mt-1 font-medium">Currently assigned to: {lead.assigned_to_name}</div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" />
              <span>Company: {lead.company_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{lead.location ? `Location: ${lead.location}` : `Branch: ${lead.branch_name}`}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Select New Resource
            </Label>
            {fetchingEmployees ? (
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading available resources...</span>
              </div>
            ) : (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resource" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <SelectItem value="no-employees" disabled>
                      No sales resources available for this branch
                    </SelectItem>
                  ) : (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()} className="py-2">
                        <div className="flex flex-col">
                          <span>{employee.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {employee.role || "Sales"}
                            {employee.location ? ` • ${employee.location}` : ""}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            <div className="text-xs text-muted-foreground">
              {lead.location
                ? `Prioritizing sales personnel in ${lead.location}.`
                : "Only showing sales personnel and account managers for this lead."}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="gap-1">
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
          <Button
            onClick={handleReassign}
            disabled={loading || !selectedEmployeeId || employees.length === 0}
            className="gap-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Reassigning...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Reassign Lead</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
