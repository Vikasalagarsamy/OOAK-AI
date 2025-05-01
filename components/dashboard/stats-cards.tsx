"use client"

import { CreditCard, Building2, Users, Briefcase } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"

interface StatItem {
  count: number
  trend: {
    isPositive: boolean
    value: number
  }
}

interface DashboardStats {
  companies: StatItem
  branches: StatItem
  employees: StatItem
  clients: StatItem
}

interface StatsCardsProps {
  stats: DashboardStats
  loading?: boolean
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const data = [
    {
      title: "Total Companies",
      value: stats.companies.count,
      icon: <Building2 className="h-4 w-4" />,
      trend: stats.companies.trend,
    },
    {
      title: "Total Branches",
      value: stats.branches.count,
      icon: <CreditCard className="h-4 w-4" />,
      trend: stats.branches.trend,
    },
    {
      title: "Total Employees",
      value: stats.employees.count,
      icon: <Users className="h-4 w-4" />,
      trend: stats.employees.trend,
    },
    {
      title: "Total Clients",
      value: stats.clients.count,
      icon: <Briefcase className="h-4 w-4" />,
      trend: stats.clients.trend,
    },
  ]

  return (
    <>
      {data.map((item) => (
        <StatsCard
          key={item.title}
          title={item.title}
          value={item.value}
          icon={item.icon}
          trend={item.trend}
          loading={loading}
        />
      ))}
    </>
  )
}
