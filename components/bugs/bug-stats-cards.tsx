"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { BugStatus, BugSeverity } from "@/types/bug"
import { AlertTriangle, AlertCircle, CheckCircle2, XCircle, Archive } from "lucide-react"

interface BugStatsCardsProps {
  stats: {
    total: number
    byStatus: Record<BugStatus, number>
    bySeverity: Record<BugSeverity, number>
  }
}

export function BugStatsCards({ stats }: BugStatsCardsProps) {
  const statusCards = [
    {
      label: "Open",
      value: stats.byStatus.open,
      icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      label: "In Progress",
      value: stats.byStatus.in_progress,
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      color: "bg-yellow-50 border-yellow-200",
    },
    {
      label: "Resolved",
      value: stats.byStatus.resolved,
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      color: "bg-green-50 border-green-200",
    },
    {
      label: "Closed",
      value: stats.byStatus.closed,
      icon: <XCircle className="h-5 w-5 text-gray-500" />,
      color: "bg-gray-50 border-gray-200",
    },
    {
      label: "Total",
      value: stats.total,
      icon: <Archive className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-50 border-purple-200",
    },
  ]

  const severityCards = [
    {
      label: "Critical",
      value: stats.bySeverity.critical,
      color: "bg-red-50 border-red-200 text-red-700",
    },
    {
      label: "High",
      value: stats.bySeverity.high,
      color: "bg-orange-50 border-orange-200 text-orange-700",
    },
    {
      label: "Medium",
      value: stats.bySeverity.medium,
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    },
    {
      label: "Low",
      value: stats.bySeverity.low,
      color: "bg-green-50 border-green-200 text-green-700",
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Bug Status Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusCards.map((card) => (
          <Card key={card.label} className={`border ${card.color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {card.icon}
                <span className="font-medium">{card.label}</span>
              </div>
              <span className="text-2xl font-bold">{card.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-6">Bugs by Severity</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {severityCards.map((card) => (
          <Card key={card.label} className={`border ${card.color}`}>
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-medium">{card.label}</span>
              <span className="text-2xl font-bold">{card.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
