"use client"

import { useRealTimeDashboard } from "@/hooks/use-real-time-dashboard"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { BranchDistributionChart } from "@/components/dashboard/branch-distribution-chart"
import { RealTimeDepartmentChart } from "@/components/dashboard/real-time-department-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, WifiOff, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function RealTimeDashboard({ initialData }: { initialData?: any }) {
  const { data, status, lastUpdated, refreshData } = useRealTimeDashboard(initialData)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the Company Branch Manager dashboard.</p>
        </div>

        <div className="flex items-center gap-2">
          {status === "connected" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              <span>Live</span>
            </Badge>
          )}

          {status === "connecting" && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
              <Wifi className="h-3 w-3 animate-pulse" />
              <span>Connecting...</span>
            </Badge>
          )}

          {status === "error" && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </Badge>
          )}

          {lastUpdated && (
            <span className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}

          <Button variant="outline" size="sm" onClick={refreshData} disabled={status === "connecting"} className="ml-2">
            <RefreshCw className={`h-4 w-4 mr-1 ${status === "connecting" ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards stats={data.stats} loading={status === "connecting"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employee Growth</CardTitle>
            <CardDescription>Monthly employee count over time</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "connecting" ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="relative">
                {/* Real-time indicator */}
                {status === "connected" && (
                  <div className="absolute top-0 right-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md z-10">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live Data
                  </div>
                )}

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.employeeGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={40} />
                    <Tooltip
                      formatter={(value) => [`${value} employees`, "Count"]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                      name="Employees"
                      isAnimationActive={true}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Data freshness indicator */}
                <div className="absolute bottom-0 right-0 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-tl-md">
                  {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : "Waiting for data..."}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "connecting" ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <RealTimeDepartmentChart initialData={data.employeesByDepartment} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Branch Distribution</CardTitle>
            <CardDescription>Branches by company</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "connecting" ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <BranchDistributionChart data={data.branchesByCompany} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <RecentActivity activities={data.recentActivities} />
      </div>
    </div>
  )
}
