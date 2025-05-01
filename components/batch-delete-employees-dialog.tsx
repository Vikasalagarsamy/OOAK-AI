"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import type { Employee } from "@/types/employee"
import { logActivity } from "@/services/activity-service"

interface BatchDeleteEmployeesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedEmployees: Employee[]
  onEmployeesDeleted: (deletedIds: string[]) => void
}

export function BatchDeleteEmployeesDialog({
  open,
  onOpenChange,
  selectedEmployees,
  onEmployeesDeleted,
}: BatchDeleteEmployeesDialogProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    success: Employee[]
    failed: { employee: Employee; reason: string }[]
  } | null>(null)
  const { toast } = useToast()

  const handleBatchDelete = async () => {
    if (selectedEmployees.length === 0) return

    setLoading(true)
    setResults(null)

    try {
      // Process employees in batches for better performance
      const batchSize = 5
      const successfulDeletes: Employee[] = []
      const failedDeletes: { employee: Employee; reason: string }[] = []

      // Process employees in batches
      for (let i = 0; i < selectedEmployees.length; i += batchSize) {
        const batch = selectedEmployees.slice(i, i + batchSize)

        // Process each employee in the current batch
        await Promise.all(
          batch.map(async (employee) => {
            try {
              // Try to delete the employee
              const { error } = await supabase.from("employees").delete().eq("id", employee.id)

              if (error) {
                failedDeletes.push({
                  employee,
                  reason: error.message || "Unknown error",
                })
              } else {
                successfulDeletes.push(employee)

                // Log the activity
                await logActivity({
                  actionType: "delete",
                  entityType: "employee",
                  entityId: employee.id.toString(),
                  entityName: `${employee.first_name} ${employee.last_name}`,
                  description: `Employee ${employee.first_name} ${employee.last_name} (${employee.employee_id}) was deleted in batch operation`,
                  userName: "Current User", // Replace with actual user name when available
                })
              }
            } catch (err) {
              failedDeletes.push({
                employee,
                reason: err instanceof Error ? err.message : "Unknown error",
              })
            }
          }),
        )
      }

      // Set results for display
      setResults({
        success: successfulDeletes,
        failed: failedDeletes,
      })

      // Show toast with summary
      if (successfulDeletes.length > 0 && failedDeletes.length === 0) {
        toast({
          title: "Success",
          description: `Successfully deleted ${successfulDeletes.length} employees`,
        })

        // Call the callback to update the parent component
        onEmployeesDeleted(successfulDeletes.map((emp) => emp.id.toString()))

        // Close the dialog after a short delay
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      } else if (successfulDeletes.length > 0 && failedDeletes.length > 0) {
        toast({
          title: "Partial Success",
          description: `Deleted ${successfulDeletes.length} employees, but failed to delete ${failedDeletes.length} employees`,
          variant: "destructive",
        })

        // Call the callback to update the parent component for the successful deletes
        onEmployeesDeleted(successfulDeletes.map((emp) => emp.id.toString()))
      } else {
        toast({
          title: "Error",
          description: `Failed to delete all ${failedDeletes.length} employees`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in batch delete operation:", error)
      toast({
        title: "Error",
        description: `Error during batch delete operation: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Multiple Employees</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedEmployees.length} selected employees? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {results.success.length > 0 && (
              <div>
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                  Successfully deleted ({results.success.length}):
                </h4>
                <ul className="text-sm space-y-1 pl-5 list-disc">
                  {results.success.map((employee) => (
                    <li key={`success-${employee.id}`}>
                      {employee.first_name} {employee.last_name} ({employee.employee_id})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.failed.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                  Failed to delete ({results.failed.length}):
                </h4>
                <ul className="text-sm space-y-1 pl-5 list-disc">
                  {results.failed.map(({ employee, reason }, index) => (
                    <li key={`failed-${employee.id}`}>
                      {employee.first_name} {employee.last_name} ({employee.employee_id}) - {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">You are about to delete the following employees:</p>
            <ul className="mt-2 max-h-[200px] overflow-y-auto text-sm pl-5 list-disc">
              {selectedEmployees.map((employee) => (
                <li key={employee.id}>
                  {employee.first_name} {employee.last_name} ({employee.employee_id})
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button variant="destructive" onClick={handleBatchDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete All"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
