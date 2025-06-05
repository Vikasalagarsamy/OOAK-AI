"use client"

import { useRealTimeDashboard } from "@/hooks/use-real-time-dashboard"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { BranchDistributionChart } from "@/components/dashboard/branch-distribution-chart"
import { RealTimeDepartmentChart } from "@/components/dashboard/real-time-department-chart"
import { PersonalizedHeader } from "@/components/dashboard/personalized-header"
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
      {/* Personalized Header */}
      <PersonalizedHeader />

      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Your Dashboard</h2>
          <p className="text-muted-foreground">Real-time insights and analytics at your fingertips.</p>
        </div>

        <div className="flex items-center gap-2">
          {status === "connected" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 hover:bg-green-100 transition-colors duration-300">
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

          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData} 
            disabled={status === "connecting"} 
            className="ml-2 hover:scale-105 transition-transform duration-300"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${status === "connecting" ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards stats={data.stats} loading={status === "connecting"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 hover:scale-[1.02] group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg"></div>
            <div className="relative z-10">
              <CardTitle className="group-hover:text-blue-800 transition-colors duration-300">Employee Growth</CardTitle>
              <CardDescription className="group-hover:text-blue-600/80 transition-colors duration-300">Monthly employee count over time</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg"></div>
            <div className="relative z-10">
              {status === "connecting" ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="relative">
                  {/* Real-time indicator */}
                  {status === "connected" && (
                    <div className="absolute top-0 right-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md z-10 hover:bg-green-100 transition-colors duration-300">
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
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                        name="Employees"
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Data freshness indicator */}
                  <div className="absolute bottom-0 right-0 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-tl-md group-hover:bg-background/90 transition-colors duration-300">
                    {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : "Waiting for data..."}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300 hover:scale-[1.02] group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-violet-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg"></div>
            <div className="relative z-10">
              <CardTitle className="group-hover:text-purple-800 transition-colors duration-300">Department Distribution</CardTitle>
              <CardDescription className="group-hover:text-purple-600/80 transition-colors duration-300">Employees by department</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-violet-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg"></div>
            <div className="relative z-10">
              {status === "connecting" ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <RealTimeDepartmentChart initialData={data.employeesByDepartment} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300 hover:scale-[1.02] group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg"></div>
            <div className="relative z-10">
              <CardTitle className="group-hover:text-emerald-800 transition-colors duration-300">Branch Distribution</CardTitle>
              <CardDescription className="group-hover:text-emerald-600/80 transition-colors duration-300">Branches by company</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg"></div>
            <div className="relative z-10">
              {status === "connecting" ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <BranchDistributionChart data={data.branchesByCompany} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300 hover:scale-[1.02] group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg"></div>
            <div className="relative z-10">
              <CardTitle className="group-hover:text-amber-800 transition-colors duration-300">Quick Actions</CardTitle>
              <CardDescription className="group-hover:text-amber-600/80 transition-colors duration-300">Frequently used actions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg"></div>
            <div className="relative z-10">
              <QuickActions />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <RecentActivity activities={data.recentActivities.map(activity => ({
          ...activity,
          type: activity.type as any // Cast to satisfy the ActivityType requirement
        }))} />
      </div>
    </div>
  )
}
