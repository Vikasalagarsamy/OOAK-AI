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
import { Loader2, Check, X, User, RefreshCw, Building, MapPin, Briefcase } from "lucide-react"

interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  full_name: string
  company_id?: number | null
  branch_id?: number | null
  designation?: string
  company_name?: string
  is_sales_role?: boolean
}

interface ReassignLeadDialogProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReassignComplete?: (success: boolean) => void
}

export function ReassignLeadDialog({ lead, open, onOpenChange, onReassignComplete }: ReassignLeadDialogProps) {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetchingEmployees, setFetchingEmployees] = useState(false)

  // Reset selected employee when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedEmployeeId("")
    }
  }, [open])

  // Fetch employees when dialog opens with a lead
  useEffect(() => {
    if (open && lead) {
      fetchEmployees()
    }
  }, [open, lead])

  const fetchEmployees = async () => {
    if (!lead) {
      console.warn("Cannot fetch employees: lead is null")
      return
    }

    // Ensure company_id is a valid number
    const companyId =
      typeof lead.company_id === "number"
        ? lead.company_id
        : lead.company_id
          ? Number.parseInt(lead.company_id.toString(), 10)
          : null

    if (!companyId || isNaN(companyId)) {
      console.error("Invalid company ID:", lead.company_id)
      toast({
        title: "Error",
        description: "Invalid company information. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Ensure branch_id is a valid number or null
    const branchId =
      typeof lead.branch_id === "number"
        ? lead.branch_id
        : lead.branch_id
          ? Number.parseInt(lead.branch_id.toString(), 10)
          : null

    setFetchingEmployees(true)
    try {
      // Get employees from the same company and branch
      const employeesData = await getEmployeesByCompanyAndBranch(
        companyId,
        branchId,
        lead.location || lead.branch_location || null,
      )

      // Filter out the currently assigned employee
      const filteredEmployees = employeesData.filter((emp) => {
        // Ensure assigned_to is a number for comparison
        const assignedTo =
          typeof lead.assigned_to === "number"
            ? lead.assigned_to
            : lead.assigned_to
              ? Number.parseInt(lead.assigned_to.toString(), 10)
              : null

        return emp.id !== assignedTo
      })

      console.log("Filtered employees:", filteredEmployees) // Add this for debugging
      setEmployees(filteredEmployees)
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
    if (!lead) {
      toast({
        title: "Error",
        description: "Cannot reassign: lead information is missing.",
        variant: "destructive",
      })
      return
    }

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
      // Ensure we have a valid lead ID
      const leadId = typeof lead.id === "number" ? lead.id : lead.id ? Number.parseInt(lead.id.toString(), 10) : null

      if (!leadId || isNaN(leadId)) {
        throw new Error("Invalid lead ID")
      }

      // Parse the selected employee ID
      const employeeId = Number.parseInt(selectedEmployeeId, 10)
      if (isNaN(employeeId)) {
        throw new Error("Invalid employee ID")
      }

      const employee = employees.find((emp) => emp.id === employeeId)
      if (!employee) {
        throw new Error("Selected employee not found")
      }

      // Call the server action to reassign the lead
      const result = await reassignLead(leadId.toString(), employeeId.toString())

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Lead reassigned to ${employee.full_name} successfully`,
        })
        if (onReassignComplete) {
          onReassignComplete(true)
        }
        onOpenChange(false) // Close the dialog on success
      } else {
        throw new Error(result.error || "Failed to reassign lead")
      }
    } catch (error) {
      console.error("Error reassigning lead:", error)
      toast({
        title: "Error",
        description: `Failed to reassign lead: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      if (onReassignComplete) {
        onReassignComplete(false)
      }
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
            {lead ? (
              <>
                Reassign lead {lead.lead_number} ({lead.client_name}) to a different resource.
                {lead.assigned_to_name && (
                  <div className="mt-1 font-medium">Currently assigned to: {lead.assigned_to_name}</div>
                )}
              </>
            ) : (
              "Please select a lead to reassign."
            )}
          </DialogDescription>
        </DialogHeader>

        {lead ? (
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>Company: {lead.company_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {lead.branch_name ? `Branch: ${lead.branch_name}` : `Location: ${lead.location || "Unknown"}`}
                </span>
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
                        No resources available for this lead
                      </SelectItem>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()} className="py-2">
                          <div className="flex flex-col">
                            <span>{employee.full_name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {employee.designation || "Staff"}
                              {employee.company_name && ` • ${employee.company_name}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <div className="text-xs text-muted-foreground">
                Only showing resources that can be assigned to this lead.
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">No lead selected or lead data is missing.</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={loading || !selectedEmployeeId || employees.length === 0 || !lead}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reassigning...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Reassign Lead
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
