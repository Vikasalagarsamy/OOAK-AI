import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  className?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

export function StatsCard({ title, value, icon, description, className, trend, loading = false }: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center mt-1">
            {trend.isPositive ? (
              <ArrowUpIcon className="h-3 w-3 text-emerald-500 mr-1" />
            ) : (
              <ArrowDownIcon className="h-3 w-3 text-rose-500 mr-1" />
            )}
            <span className={cn("text-xs font-medium", trend.isPositive ? "text-emerald-500" : "text-rose-500")}>
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
