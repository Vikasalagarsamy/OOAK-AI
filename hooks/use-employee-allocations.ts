"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"

export type Allocation = {
  id: string
  employeeId: string
  companyId: string
  companyName: string
  branchId: string
  branchName: string
  projectId?: string
  projectName?: string
  percentage: number
  isPrimary: boolean
  startDate?: string | null
  endDate?: string | null
  status: "active" | "pending" | "completed"
}

export type AllocationFormData = {
  companyId: string
  branchId: string
  projectId?: string
  percentage: number
  isPrimary: boolean
  startDate?: string | null
  endDate?: string | null
}

export function useEmployeeAllocations(employeeId: string) {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Calculate allocation status based on dates
  const calculateStatus = useCallback(
    (startDate?: string | null, endDate?: string | null): "active" | "pending" | "completed" => {
      const now = new Date()
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (end && end < now) return "completed"
      if (start && start > now) return "pending"
      return "active"
    },
    [],
  )

  // Fetch allocations
  const fetchAllocations = useCallback(async () => {
    if (!employeeId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/employees/${employeeId}/allocations`)

      if (!response.ok) {
        throw new Error("Failed to fetch allocations")
      }

      const data = await response.json()

      // Process allocations to include status based on dates
      const processedAllocations = data.map((allocation: any) => ({
        ...allocation,
        status: calculateStatus(allocation.startDate, allocation.endDate),
      }))

      setAllocations(processedAllocations)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast({
        title: "Error",
        description: "Failed to load employee allocations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [employeeId, calculateStatus])

  // Add allocation
  const addAllocation = useCallback(
    async (allocationData: AllocationFormData) => {
      if (!employeeId) return

      try {
        const response = await fetch(`/api/employees/${employeeId}/allocations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...allocationData,
            // Ensure dates are properly formatted
            startDate: allocationData.startDate || null,
            endDate: allocationData.endDate || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add allocation")
        }

        // Refresh allocations to ensure we have the latest data
        await fetchAllocations()

        toast({
          title: "Success",
          description: "Allocation added successfully",
        })

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
        return false
      }
    },
    [employeeId, fetchAllocations],
  )

  // Update allocation
  const updateAllocation = useCallback(
    async (allocationId: string, allocationData: Partial<AllocationFormData>) => {
      if (!employeeId) return

      try {
        const response = await fetch(`/api/employees/${employeeId}/allocations/${allocationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(allocationData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update allocation")
        }

        // Refresh allocations to ensure we have the latest data
        await fetchAllocations()

        toast({
          title: "Success",
          description: "Allocation updated successfully",
        })

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
        return false
      }
    },
    [employeeId, fetchAllocations],
  )

  // Delete allocation
  const deleteAllocation = useCallback(
    async (allocationId: string) => {
      if (!employeeId) return

      try {
        const response = await fetch(`/api/employees/${employeeId}/allocations/${allocationId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to delete allocation")
        }

        // Refresh allocations to ensure we have the latest data
        await fetchAllocations()

        toast({
          title: "Success",
          description: "Allocation deleted successfully",
        })

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
        return false
      }
    },
    [employeeId, fetchAllocations],
  )

  // Calculate total allocation percentage for active allocations
  const calculateTotalPercentage = useCallback(() => {
    return allocations
      .filter((allocation) => allocation.status === "active")
      .reduce((total, allocation) => total + allocation.percentage, 0)
  }, [allocations])

  // Load allocations on component mount and when employeeId changes
  useEffect(() => {
    if (employeeId) {
      fetchAllocations()
    }
  }, [employeeId, fetchAllocations])

  return {
    allocations,
    isLoading,
    error,
    isDirty,
    fetchAllocations,
    addAllocation,
    updateAllocation,
    deleteAllocation,
    calculateTotalPercentage,
    setIsDirty,
  }
}
