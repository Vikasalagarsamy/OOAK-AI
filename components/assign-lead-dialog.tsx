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

// Employee interface with location and match score
interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  full_name: string
  role?: string
  location?: string
  branch_id?: number
  branch_name?: string
  match_score?: number
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

  // Fetch sales employees using our new database function
  const fetchSalesEmployees = async () => {
    setFetchingEmployees(true)
    try {
      console.log(`Fetching sales employees for lead in location: ${lead.location || "Not specified"}`)

      // Use our new database function to get employees with proper scoring
      const { data: salesEmployees, error: salesError } = await supabase.rpc("get_sales_employees_for_lead", {
        lead_company_id: lead.company_id,
        lead_location: lead.location || "",
      })

      if (salesError) {
        console.error("Error fetching sales employees:", salesError)
        setEmployees([])
        setFetchingEmployees(false)
        return
      }

      if (!salesEmployees || salesEmployees.length === 0) {
        console.log("No sales employees found for this lead")
        setEmployees([])
        setFetchingEmployees(false)
        return
      }

      console.log(`Found ${salesEmployees.length} sales employees for this lead`)

      // Get branch names for display
      const branchIds = salesEmployees.map((emp) => emp.branch_id).filter((id) => id !== null) as number[]

      const { data: branches } = await supabase.from("branches").select("id, name").in("id", branchIds)

      const branchMap = new Map()
      if (branches) {
        branches.forEach((branch) => {
          branchMap.set(branch.id, branch.name)
        })
      }

      // Format employees for display
      const formattedEmployees = salesEmployees.map((emp) => ({
        id: emp.id,
        employee_id: emp.employee_id || "",
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: `${emp.first_name} ${emp.last_name}`,
        role: emp.job_title || emp.role || "Sales Representative",
        location: emp.location || "Not specified",
        branch_id: emp.branch_id,
        branch_name: emp.branch_id ? branchMap.get(emp.branch_id) || "Unknown Branch" : "No Branch",
        match_score: emp.match_score,
      }))

      setEmployees(formattedEmployees)
    } catch (error) {
      console.error("Exception fetching sales employees:", error)
      setEmployees([])
    } finally {
      setFetchingEmployees(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select a sales team member to assign this lead to.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Assign Lead
          </DialogTitle>
          <DialogDescription>
            Assign lead {lead.lead_number} ({lead.client_name}) to a sales representative.
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
              Select Sales Team Member
            </Label>
            {fetchingEmployees ? (
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading sales team members...</span>
              </div>
            ) : (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sales team member" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <SelectItem value="no-employees" disabled>
                      No sales team members found
                    </SelectItem>
                  ) : (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()} className="py-2">
                        <div className="flex flex-col">
                          <span>{employee.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {employee.role || "Sales"}
                            {employee.location && employee.location !== "Not specified"
                              ? ` • ${employee.location}`
                              : ""}
                            {employee.branch_name && employee.branch_name !== "Unknown Branch"
                              ? ` • ${employee.branch_name}`
                              : ""}
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
                : "Showing sales representatives, account managers, and business development personnel."}
            </div>
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
