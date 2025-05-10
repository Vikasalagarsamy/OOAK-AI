"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface ChartCardProps {
  className?: string
  employeesByDepartment?: Array<{ department: string; count: number }>
  branchesByCompany?: Array<{ company: string; count: number }>
  employeeGrowth?: Array<{ month: string; count: number }>
}

export function ChartCard({
  className,
  employeesByDepartment = [],
  branchesByCompany = [],
  employeeGrowth = [],
}: ChartCardProps) {
  const [mounted, setMounted] = useState(false)

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

  // Format data for pie chart
  const formatPieData = (data: any[]) => {
    return data.map((item) => ({
      name: item.department || item.company,
      value: item.count,
    }))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View detailed analytics about your organization</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[350px] flex items-center justify-center">
            <div className="animate-pulse rounded-md bg-muted h-[300px] w-full mx-6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>View detailed analytics about your organization</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="departments">
          <div className="flex justify-center p-1">
            <TabsList>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="companies">Companies</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="departments" className="h-[350px] mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium mb-2">Employees by Department</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={employeesByDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="department" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-medium mb-2">Department Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(employeesByDepartment)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(employeesByDepartment).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="companies" className="h-[350px] mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium mb-2">Branches by Company</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchesByCompany}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="company" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-medium mb-2">Company Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(branchesByCompany)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(branchesByCompany).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="growth" className="h-[350px] mt-0">
            <div className="p-4 h-full">
              <h3 className="text-sm font-medium mb-2">Employee Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={employeeGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
