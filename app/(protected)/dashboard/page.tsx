import type React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ChartCard } from "@/components/dashboard/chart-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { BranchDistributionChart } from "@/components/dashboard/branch-distribution-chart"
import { ProtectedPage } from "@/components/protected-page"

export const revalidate = 60 // Revalidate this page every 60 seconds

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <Suspense fallback={<div>Loading stats...</div>}>
          <StatsCards />
        </Suspense>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<div>Loading chart...</div>}>
            <ChartCard />
          </Suspense>

          <Suspense fallback={<div>Loading distribution...</div>}>
            <BranchDistributionChart />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Suspense fallback={<div>Loading activity...</div>}>
              <RecentActivity />
            </Suspense>
          </div>

          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </ProtectedPage>
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
