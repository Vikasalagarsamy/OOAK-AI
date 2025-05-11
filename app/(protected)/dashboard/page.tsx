import { Suspense } from "react"
import { getDashboardStats } from "@/services/dashboard-service"
import { Skeleton } from "@/components/ui/skeleton"
import { getRecentActivities } from "@/services/activity-service"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/navigation/dashboard-nav"

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
        <DashboardNav />
      </Suspense>

      {/* Additional dashboard content can go here */}
    </div>
  )
}

function DashboardMenuSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
      </div>
    </div>
  )
}
