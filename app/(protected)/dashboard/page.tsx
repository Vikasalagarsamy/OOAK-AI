import type React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/services/dashboard-service"
import { Users, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { getRecentActivities } from "@/services/activity-service"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { DashboardMenu } from "@/components/dashboard/dashboard-menu"

export const revalidate = 60 // Revalidate this page every 60 seconds

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?reason=unauthenticated")
  }

  // Fetch dashboard data with error handling
  let dashboardData
  let activities = []

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your dashboard. Here's a quick overview of your system.</p>
      </div>

      <Suspense fallback={<DashboardMenuSkeleton />}>
        <DashboardMenu />
      </Suspense>

      {/* Additional dashboard content can go here */}
    </div>
  )
}

function DashboardMenuSkeleton() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Quick Navigation</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="p-6 flex flex-col items-center justify-center space-y-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

// Menu skeleton loader
function MenuSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
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
