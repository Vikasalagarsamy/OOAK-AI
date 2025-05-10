import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Briefcase } from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={trend.isPositive ? "text-green-500" : "text-red-500"}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </span>{" "}
            from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  // This would normally come from an API or database
  const stats = {
    companies: { count: 4, trend: { value: 10, isPositive: true } },
    branches: { count: 12, trend: { value: 5, isPositive: true } },
    employees: { count: 142, trend: { value: 12, isPositive: true } },
    clients: { count: 87, trend: { value: 3, isPositive: false } },
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Companies"
        value={stats.companies.count}
        icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
        trend={stats.companies.trend}
      />
      <StatCard
        title="Total Branches"
        value={stats.branches.count}
        icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
        trend={stats.branches.trend}
      />
      <StatCard
        title="Employees"
        value={stats.employees.count}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        trend={stats.employees.trend}
      />
      <StatCard
        title="Clients"
        value={stats.clients.count}
        icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
        trend={stats.clients.trend}
      />
    </div>
  )
}
