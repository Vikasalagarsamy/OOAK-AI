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
import { Loader2, AlertCircle, Info, Building, Briefcase, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getEmployeesForLeadAssignment, assignLeadToEmployee } from "@/actions/simple-employee-selection"
import type { Lead } from "@/types/lead"
import type { Employee } from "@/types/employee"

// Update the interface to make lead optional
interface AssignLeadDialogProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssignComplete?: () => void
  onAssigned?: () => void // Adding this to maintain compatibility with existing code
}

// Update the component to handle null lead
export function AssignLeadDialog({ lead, open, onOpenChange, onAssignComplete, onAssigned }: AssignLeadDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open && lead) {
      fetchEmployees()
    } else {
      // Reset state when dialog closes
      setSelectedEmployeeId("")
      setError(null)
    }
  }, [open, lead])

  const fetchEmployees = async () => {
    if (!lead) return

    setLoading(true)
    setError(null)
    try {
      // Make sure we're passing valid IDs
      const companyId = lead.company_id || undefined
      const branchId = lead.branch_id || undefined

      console.log(`Fetching employees for lead: ${lead.id}, company: ${companyId}, branch: ${branchId}`)
      const employees = await getEmployeesForLeadAssignment(companyId, branchId)
      console.log(`Fetched ${employees.length} employees`)

      setEmployees(employees)

      if (employees.length === 0) {
        setError("No eligible employees found. Please ensure there are active employees in the system.")
      }

      // Reset selection
      setSelectedEmployeeId("")
    } catch (error) {
      console.error("Error fetching employees:", error)
      setError("Failed to load employees. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!lead) {
      toast({
        title: "Error",
        description: "Lead data is missing. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee to assign the lead to.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await assignLeadToEmployee(lead.id, Number.parseInt(selectedEmployeeId))

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Close dialog first
        onOpenChange(false)
        // Then trigger refresh callbacks
        if (onAssignComplete) {
          onAssignComplete()
        }
        if (onAssigned) {
          onAssigned()
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error assigning lead:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // If lead is null, don't render the dialog content
  if (!lead && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
            <DialogDescription>Lead data is missing. Please try again.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Lead</DialogTitle>
          <DialogDescription>
            {lead
              ? `Assign lead #${lead.lead_number} - ${lead.client_name} to a team member.`
              : "Loading lead details..."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Lead info */}
          {lead && (
            <div className="bg-muted/40 p-3 rounded-md space-y-1 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {lead.company_name && (
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium ml-1">{lead.company_name}</span>
                  </div>
                )}
                {lead.branch_name && (
                  <div>
                    <span className="text-muted-foreground">Branch:</span>
                    <span className="font-medium ml-1">{lead.branch_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info message */}
          {lead && (
            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-700 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Employee Selection</p>
                <p className="text-xs mt-0.5">
                  {lead.company_id
                    ? `Showing employees allocated to ${lead.company_name || "this company"}`
                    : "Showing all active employees with sales employees prioritized"}
                </p>
              </div>
            </div>
          )}

          {/* Employee selection */}
          <div className="grid gap-2">
            <Label htmlFor="employee">Select Team Member</Label>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select team member" />
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
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{employee.name}</span>
                            {employee.is_primary && (
                              <span className="text-amber-500">
                                <Star className="h-3 w-3 inline" />
                              </span>
                            )}
                            {employee.status && employee.status.toLowerCase() !== "active" && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-1 rounded">
                                {employee.status}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {employee.designation && (
                              <>
                                <Briefcase className="h-3 w-3" />
                                <span>{employee.designation}</span>
                              </>
                            )}
                          </div>

                          {lead && lead.company_id && (
                            <div
                              className={`mt-1 text-xs p-1 rounded flex items-center gap-1 ${
                                employee.allocation_percentage > 0
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              <Building className="h-3 w-3" />
                              <span>
                                {lead.company_name || "Company"}
                                {lead.branch_name && ` - ${lead.branch_name}`}
                                {employee.is_primary && " (Primary)"}
                                {employee.allocation_percentage > 0 && ` (${employee.allocation_percentage}%)`}
                                {employee.allocation_percentage === 0 && " (No allocation)"}
                              </span>
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={submitting || !selectedEmployeeId || !lead}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Assign Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
