import type React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/services/dashboard-service"
import { Users, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { getRecentActivities } from "@/services/activity-service"
import { getDepartmentDistribution } from "@/actions/department-actions"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"

export const revalidate = 60 // Revalidate this page every 60 seconds

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?reason=unauthenticated")
  }

  // Fetch dashboard data with error handling
  let dashboardData
  let activities = []
  let departmentData = []

  try {
    dashboardData = await getDashboardStats()
  } catch (error) {
    console.error("Error loading dashboard data:", error)
    // Set default data
    dashboardData = {
      stats: {
        companies: { count: 0, trend: { isPositive: true, value: 0 } },
        branches: { count: 0, trend: { isPositive: true, value: 0 } },
        employees: { count: 0, trend: { isPositive: true, value: 0 } },
        clients: { count: 0, trend: { isPositive: true, value: 0 } },
      },
      employeesByDepartment: [],
      branchesByCompany: [
        { company: "Acme Corp", count: 5 },
        { company: "TechCorp", count: 3 },
        { company: "Global Industries", count: 7 },
        { company: "Startup Inc", count: 1 },
        { company: "Enterprise Ltd", count: 4 },
      ],
      employeeGrowth: [
        { month: "Jan", count: 42 },
        { month: "Feb", count: 47 },
        { month: "Mar", count: 53 },
        { month: "Apr", count: 58 },
        { month: "May", count: 62 },
        { month: "Jun", count: 68 },
      ],
      recentActivities: [],
    }
  }

  try {
    activities = await getRecentActivities(5)
  } catch (error) {
    console.error("Error loading activities:", error)
    activities = []
  }

  try {
    console.log("Dashboard: Fetching department data...")
    departmentData = await getDepartmentDistribution()
    console.log("Dashboard: Received department data:", departmentData)

    if (!departmentData || departmentData.length === 0) {
      console.log("Dashboard: No department data returned, using fallback data")
      departmentData = [
        { department: "Engineering", count: 24 },
        { department: "Marketing", count: 13 },
        { department: "Sales", count: 18 },
        { department: "Finance", count: 8 },
        { department: "HR", count: 5 },
      ]
    }
  } catch (error) {
    console.error("Dashboard: Error loading department data:", error)
    departmentData = [
      { department: "Engineering", count: 24 },
      { department: "Marketing", count: 13 },
      { department: "Sales", count: 18 },
      { department: "Finance", count: 8 },
      { department: "HR", count: 5 },
    ]
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.username || user.email || "User"}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You are logged in as {user.roleName || "User"}.</p>
          </CardContent>
        </Card>

        <Suspense fallback={<DashboardCardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your recent system activity will appear here.</p>
            </CardContent>
          </Card>
        </Suspense>

        <Suspense fallback={<DashboardCardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-muted">View Profile</button>
                <button className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-muted">
                  Update Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-muted">View Reports</button>
              </div>
            </CardContent>
          </Card>
        </Suspense>
      </div>
    </div>
  )
}

function DashboardCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  )
}

// Supporting component for Action Buttons
function ActionButton({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-accent transition-colors"
    >
      <div className="mb-2">{icon}</div>
      <span className="text-sm text-center">{title}</span>
    </Link>
  )
}

// Supporting component for Stat Cards
function StatCard({
  title,
  value,
  trend,
  icon,
}: {
  title: string
  value: number
  trend: { isPositive: boolean; value: number }
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {trend.value > 0 && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {trend.isPositive ? (
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span className={trend.isPositive ? "text-green-500" : "text-red-500"}>{trend.value}% from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Supporting component for Recent Activity list
function RecentActivityList({ activities }: { activities: any[] }) {
  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
      ) : (
        activities.map((activity, i) => (
          <div key={i} className="flex items-start">
            <div className="mr-4 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{activity.action || "User action"}</p>
              <p className="text-sm text-muted-foreground">
                {activity.details || "Activity details"} · {activity.timestamp || "Just now"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Chart components
function EmployeeGrowthChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <div className="h-[300px] w-full flex items-end justify-between px-2">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <div
            className="bg-primary/90 hover:bg-primary rounded-t w-14 transition-all"
            style={{ height: `${(item.count / Math.max(...data.map((d) => d.count))) * 220}px` }}
          ></div>
          <div className="mt-2 text-xs text-muted-foreground">{item.month}</div>
          <div className="text-sm font-medium">{item.count}</div>
        </div>
      ))}
    </div>
  )
}

// Skeleton loaders
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full flex items-center justify-center">
          <div className="animate-pulse rounded-md bg-muted h-[200px] w-full"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-8 w-8 rounded-full mr-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full max-w-[250px]" />
                  <Skeleton className="h-3 w-full max-w-[200px]" />
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
