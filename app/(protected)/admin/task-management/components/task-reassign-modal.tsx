"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, User, Building, MapPin, CheckCircle, AlertCircle } from "lucide-react"

interface Employee {
  id: number
  name: string
  employee_id: string
  company_id?: number
  branch_id?: number
  is_primary?: boolean
}

interface Task {
  id: number
  task_title: string
  task_description: string
  assigned_to: string
  assigned_to_employee_id: number
  lead_id?: number
  metadata?: any
}

interface TaskReassignModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onReassignSuccess: () => void
}

export default function TaskReassignModal({ isOpen, onClose, task, onReassignSuccess }: TaskReassignModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [reassigning, setReassigning] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Load available employees when modal opens
  useEffect(() => {
    if (isOpen && task) {
      loadAvailableEmployees()
    }
  }, [isOpen, task])

  const loadAvailableEmployees = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/tasks/reassign?taskId=${task?.id}`)
      const data = await response.json()
      
      if (data.success) {
        setEmployees(data.employees || [])
        console.log(`📋 Loaded ${data.employees?.length || 0} available employees`)
      } else {
        setError(data.error || 'Failed to load employees')
      }
    } catch (err) {
      console.error('Error loading employees:', err)
      setError('Failed to load available employees')
    } finally {
      setLoading(false)
    }
  }

  const handleReassign = async () => {
    if (!selectedEmployee || !task) return

    try {
      setReassigning(true)
      setError("")
      setMessage("")
      
      console.log(`🔄 Reassigning task ${task.id} to employee ${selectedEmployee.id}`)
      
      const response = await fetch('/api/tasks/reassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          newEmployeeId: selectedEmployee.id,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage(data.message)
        console.log('✅ Task reassigned successfully:', data)
        
        // Show success message briefly then close
        setTimeout(() => {
          onReassignSuccess()
          onClose()
        }, 1500)
      } else {
        setError(data.error || 'Failed to reassign task')
      }
    } catch (err) {
      console.error('Error reassigning task:', err)
      setError('Failed to reassign task')
    } finally {
      setReassigning(false)
    }
  }

  const handleClose = () => {
    setSelectedEmployee(null)
    setMessage("")
    setError("")
    onClose()
  }

  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Reassign Task</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a new employee to assign this task and its associated lead
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Task Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{task.task_title}</p>
              <p className="text-sm text-gray-600">{task.task_description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span>Currently assigned to: <strong>{task.assigned_to}</strong></span>
                {task.lead_id && (
                  <Badge variant="outline">
                    Lead #{task.lead_id} will also be reassigned
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading available employees...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">{message}</span>
          </div>
        )}

        {/* Employee Selection */}
        {!loading && employees.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Select New Assignee</h3>
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedEmployee?.id === employee.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-600">ID: {employee.employee_id}</p>
                      </div>
                    </div>
                    {employee.is_primary && (
                      <Badge variant="secondary" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Employees Available */}
        {!loading && employees.length === 0 && !error && (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No employees available for reassignment</p>
            <p className="text-sm text-gray-500 mt-1">
              Check if there are active employees in the same branch/company
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={reassigning}>
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={!selectedEmployee || reassigning}
            className="min-w-[120px]"
          >
            {reassigning ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Reassigning...
              </div>
            ) : (
              'Reassign Task'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 