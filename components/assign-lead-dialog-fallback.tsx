"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
import { query } from "@/lib/postgresql-client"
import { UserCog, Loader2, Check, X, User } from "lucide-react"
import { useDialogPosition } from "@/hooks/use-dialog-position"


interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  full_name: string
}

interface AssignLeadDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (success: boolean) => void
  triggerRef?: React.RefObject<HTMLElement>
}

export function AssignLeadDialog({ lead, open, onOpenChange, onComplete, triggerRef }: AssignLeadDialogProps) {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetchingEmployees, setFetchingEmployees] = useState(true)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Get optimal dialog position based on trigger element
  const position = useDialogPosition(triggerRef || { current: null }, dialogRef, open)

  // Fetch employees on component mount
  useEffect(() => {
    if (open) {
      fetchEmployees()
    } else {
      // Reset state when dialog closes
      setSelectedEmployeeId("")
    }
  }, [open])

  const fetchEmployees = async () => {
    setFetchingEmployees(true)
    try {
      // Fallback approach: Get all active employees using PostgreSQL
      // In a real application, you would implement proper department filtering
      const result = await query(
        `SELECT id, employee_id, first_name, last_name 
         FROM employees 
         WHERE status = $1 
         ORDER BY first_name`,
        ['ACTIVE']
      )

      // Transform the data to include full_name
      const employeesWithFullName = result.rows.map((emp) => ({
        id: emp.id,
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: `${emp.first_name} ${emp.last_name}`,
      }))

      setEmployees(employeesWithFullName)
      console.log(`✅ Loaded ${employeesWithFullName.length} active employees`)
    } catch (error) {
      console.error("❌ Error fetching employees:", error)
      toast({
        title: "Error",
        description: "Failed to fetch employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFetchingEmployees(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee to assign this lead to.",
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
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        ref={dialogRef}
        className="sm:max-w-[425px] overflow-y-auto"
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          transform: position.transform,
          maxHeight: position.maxHeight,
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Assign Lead
          </DialogTitle>
          <DialogDescription>
            Assign lead {lead.lead_number} ({lead.client_name}) to a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Employee
            </Label>
            {fetchingEmployees ? (
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading employees...</span>
              </div>
            ) : (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <SelectItem value="no-employees" disabled>
                      No employees found
                    </SelectItem>
                  ) : (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.full_name} ({employee.employee_id})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
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
