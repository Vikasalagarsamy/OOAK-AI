"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getEmployeeStats, getDepartmentDistribution, getStatusDistribution } from "@/actions/dashboard-actions"
import { EmployeeStatusChart } from "./employee-status-chart"
import { DepartmentDistributionChart } from "./department-distribution-chart"
import { EmployeeStatCards } from "./employee-stat-cards"
import { RecentEmployees } from "./recent-employees"

export function EmployeeDashboard() {
  const [employeeStats, setEmployeeStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    onLeaveEmployees: 0,
    terminatedEmployees: 0,
    averageTenure: 0,
  })
  const [departmentDistribution, setDepartmentDistribution] = useState<{ name: string; count: number }[]>([])
  const [statusDistribution, setStatusDistribution] = useState<{ status: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch data sequentially to avoid any potential issues
        const stats = await getEmployeeStats()
        setEmployeeStats(stats)

        const deptDist = await getDepartmentDistribution()
        setDepartmentDistribution(deptDist)

        const statusDist = await getStatusDistribution()
        setStatusDistribution(statusDist)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
        <h3 className="text-lg font-semibold">Error</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <EmployeeStatCards stats={employeeStats} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Department Distribution</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Status Distribution</CardTitle>
                <CardDescription>Breakdown of employees by their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeStatusChart data={statusDistribution} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Breakdown of employees by department</CardDescription>
              </CardHeader>
              <CardContent>
                <DepartmentDistributionChart data={departmentDistribution} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recently Added Employees</CardTitle>
              <CardDescription>Employees added in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentEmployees />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Detailed breakdown of employees by department</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <DepartmentDistributionChart data={departmentDistribution} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Employee Status Distribution</CardTitle>
              <CardDescription>Detailed breakdown of employees by their current status</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <EmployeeStatusChart data={statusDistribution} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
