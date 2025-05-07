import type React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDashboardStats } from "@/services/dashboard-service"
import { ErrorBoundary } from "@/components/error-boundary"
import { Users, Building2, Briefcase, TrendingUp, UserPlus, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { getRecentActivities } from "@/services/activity-service"
import { RealTimeDepartmentChart } from "@/components/dashboard/real-time-department-chart"
import { getDepartmentDistribution } from "@/actions/department-actions"
import { BranchDistributionChart } from "@/components/dashboard/branch-distribution-chart"

export const revalidate = 60 // Revalidate this page every 60 seconds

export default async function DashboardPage() {
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
    <div className="flex-1">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ErrorBoundary fallback={<StatCardSkeleton />}>
                <Suspense fallback={<StatCardSkeleton />}>
                  <StatCard
                    title="Total Companies"
                    value={dashboardData.stats.companies.count}
                    trend={dashboardData.stats.companies.trend}
                    icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                  />
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary fallback={<StatCardSkeleton />}>
                <Suspense fallback={<StatCardSkeleton />}>
                  <StatCard
                    title="Total Branches"
                    value={dashboardData.stats.branches.count}
                    trend={dashboardData.stats.branches.trend}
                    icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                  />
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary fallback={<StatCardSkeleton />}>
                <Suspense fallback={<StatCardSkeleton />}>
                  <StatCard
                    title="Employees"
                    value={dashboardData.stats.employees.count}
                    trend={dashboardData.stats.employees.trend}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                  />
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary fallback={<StatCardSkeleton />}>
                <Suspense fallback={<StatCardSkeleton />}>
                  <StatCard
                    title="Clients"
                    value={dashboardData.stats.clients.count}
                    trend={dashboardData.stats.clients.trend}
                    icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <ErrorBoundary fallback={<ChartCardSkeleton className="col-span-4" />}>
                <Suspense fallback={<ChartCardSkeleton className="col-span-4" />}>
                  <Card className="col-span-4">
                    <CardHeader>
                      <CardTitle>Employee Growth</CardTitle>
                      <CardDescription>Monthly employee growth for the current year</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <EmployeeGrowthChart data={dashboardData.employeeGrowth} />
                    </CardContent>
                  </Card>
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary fallback={<ActivityCardSkeleton className="col-span-3" />}>
                <Suspense fallback={<ActivityCardSkeleton className="col-span-3" />}>
                  <Card className="col-span-3">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest actions in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RecentActivityList
                        activities={activities.length > 0 ? activities : dashboardData.recentActivities}
                      />
                    </CardContent>
                  </Card>
                </Suspense>
              </ErrorBoundary>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ErrorBoundary fallback={<ChartCardSkeleton />}>
                <Suspense fallback={<ChartCardSkeleton />}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Employees by Department</CardTitle>
                      <CardDescription>Real-time distribution of employees across departments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RealTimeDepartmentChart initialData={departmentData} />
                    </CardContent>
                  </Card>
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary fallback={<ChartCardSkeleton />}>
                <Suspense fallback={<ChartCardSkeleton />}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Branches by Company</CardTitle>
                      <CardDescription>Distribution of branches across companies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BranchDistributionChart data={dashboardData.branchesByCompany} />
                    </CardContent>
                  </Card>
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary fallback={<ChartCardSkeleton />}>
                <Suspense fallback={<ChartCardSkeleton />}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <ActionButton
                          href="/people/employees/add"
                          icon={<UserPlus className="h-4 w-4" />}
                          title="Add Employee"
                        />
                        <ActionButton
                          href="/organization/clients"
                          icon={<Briefcase className="h-4 w-4" />}
                          title="View Clients"
                        />
                        <ActionButton
                          href="/sales/create-lead"
                          icon={<TrendingUp className="h-4 w-4" />}
                          title="Create Lead"
                        />
                        <ActionButton
                          href="/organization/companies"
                          icon={<Building2 className="h-4 w-4" />}
                          title="View Companies"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Suspense>
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="organization" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Companies</CardTitle>
                  <CardDescription>Manage your organization's companies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/organization/companies"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      View All Companies
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Branches</CardTitle>
                  <CardDescription>Manage your organization's branch locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/organization/branches"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      View All Branches
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>Manage your organization's clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/organization/clients"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      View All Clients
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="people" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Employees</CardTitle>
                  <CardDescription>Manage your organization's employees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/people/employees"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      View All Employees
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Manage your organization's departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/people/departments"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      View All Departments
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Designations</CardTitle>
                  <CardDescription>Manage your organization's designations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/people/designations"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      View All Designations
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>My Leads</CardTitle>
                  <CardDescription>View and manage your assigned leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/sales/my-leads"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      View My Leads
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Lead</CardTitle>
                  <CardDescription>Create a new sales lead</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/sales/create-lead"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      Create Lead
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>Manage your lead sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/sales/lead-sources"
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      View Lead Sources
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
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
