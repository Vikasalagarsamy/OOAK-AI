"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  trend: {
    isPositive: boolean
    value: number
  }
  loading?: boolean
}

export function StatsCard({ title, value, icon, trend, loading = false }: StatsCardProps) {
  const [prevValue, setPrevValue] = useState(value)
  const [isIncreasing, setIsIncreasing] = useState(false)
  const [isDecreasing, setIsDecreasing] = useState(false)

  useEffect(() => {
    if (value > prevValue) {
      setIsIncreasing(true)
      setIsDecreasing(false)
      const timer = setTimeout(() => setIsIncreasing(false), 2000)
      return () => clearTimeout(timer)
    } else if (value < prevValue) {
      setIsDecreasing(true)
      setIsIncreasing(false)
      const timer = setTimeout(() => setIsDecreasing(false), 2000)
      return () => clearTimeout(timer)
    }

    setPrevValue(value)
  }, [value, prevValue])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold transition-colors duration-500",
            isIncreasing && "text-green-600",
            isDecreasing && "text-red-600",
          )}
        >
          {value.toLocaleString()}
          {isIncreasing && <span className="ml-1 text-xs animate-bounce inline-block">↑</span>}
          {isDecreasing && <span className="ml-1 text-xs animate-bounce inline-block">↓</span>}
        </div>
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
