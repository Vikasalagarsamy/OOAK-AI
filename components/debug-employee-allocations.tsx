"use client"

import { useEffect, useState } from "react"
import { getEmployeeCompanies } from "@/actions/employee-actions"
import type { EmployeeCompany } from "@/types/employee-company"

export function DebugEmployeeAllocations({ employeeId }: { employeeId: string }) {
  const [allocations, setAllocations] = useState<EmployeeCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAllocations() {
      try {
        setLoading(true)
        const result = await getEmployeeCompanies(employeeId)
        console.log("Debug - Fetched allocations:", result)
        setAllocations(result || [])
      } catch (err) {
        console.error("Error fetching allocations:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    if (employeeId) {
      fetchAllocations()
    }
  }, [employeeId])

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      <h3 className="text-sm font-medium mb-2">Debug: Employee Allocations</h3>
      {loading ? (
        <p>Loading allocations...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : allocations.length === 0 ? (
        <p>No allocations found in debug component</p>
      ) : (
        <div className="text-xs">
          <p>Found {allocations.length} allocations:</p>
          <pre className="mt-2 p-2 bg-gray-100 overflow-auto max-h-40">{JSON.stringify(allocations, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
