"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { getReassignmentMetrics } from "@/utils/monitor-lead-reassignment"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export function ReassignmentPerformanceDashboard() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const data = await getReassignmentMetrics(startDate?.toISOString(), endDate?.toISOString())
      setMetrics(data)
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lead Reassignment Performance</h2>
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm mr-2">Start:</span>
            <DatePicker date={startDate} setDate={setStartDate} />
          </div>
          <div>
            <span className="text-sm mr-2">End:</span>
            <DatePicker date={endDate} setDate={setEndDate} />
          </div>
          <Button onClick={fetchMetrics} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Reassignments</CardTitle>
            <CardDescription>Number of leads reassigned per day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {metrics?.dailyReassignments?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.dailyReassignments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reassignment by Reason</CardTitle>
            <CardDescription>Distribution of reassignment reasons</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {metrics?.reasonCounts?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.reasonCounts}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="reason"
                    label={({ reason, percent }) => `${reason}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.reasonCounts.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Performance</CardTitle>
            <CardDescription>Average processing time and error rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Avg. Processing Time</p>
                <p className="text-3xl font-bold">
                  {metrics?.avgProcessingTime?.avg_ms ? `${Math.round(metrics.avgProcessingTime.avg_ms)}ms` : "N/A"}
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Error Count</p>
                <p className="text-3xl font-bold">{metrics?.errorCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Overall reassignment system health</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>System Status</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      metrics.errors.length === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {metrics.errors.length === 0 ? "Healthy" : "Issues Detected"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Reassignments</span>
                  <span className="font-medium">
                    {metrics.dailyReassignments.reduce((sum: number, item: any) => sum + item.count, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Rate</span>
                  <span className="font-medium">
                    {metrics.dailyReassignments.length > 0
                      ? `${((metrics.errorCount / metrics.dailyReassignments.reduce((sum: number, item: any) => sum + item.count, 0)) * 100).toFixed(2)}%`
                      : "0%"}
                  </span>
                </div>
                {metrics.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-800">Errors:</p>
                    <ul className="list-disc pl-5 text-sm text-red-700">
                      {metrics.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
