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

  // Get gradient colors based on trend
  const getGradientClass = () => {
    if (trend.isPositive) {
      return "from-green-50 to-emerald-100 border-green-200 hover:border-green-300 hover:shadow-green-100/50"
    } else if (trend.value > 0) { // has trend but negative
      return "from-red-50 to-rose-100 border-red-200 hover:border-red-300 hover:shadow-red-100/50"
    } else {
      return "from-blue-50 to-indigo-100 border-blue-200 hover:border-blue-300 hover:shadow-blue-100/50"
    }
  }

  return (
    <Card className={cn(
      "bg-gradient-to-br transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer relative overflow-hidden",
      getGradientClass()
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium group-hover:text-foreground/90 transition-colors duration-300">{title}</CardTitle>
        <div className="group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div
          className={cn(
            "text-2xl font-bold transition-all duration-500 group-hover:text-foreground/90",
            isIncreasing && "text-green-600",
            isDecreasing && "text-red-600",
          )}
        >
          {value.toLocaleString()}
          {isIncreasing && <span className="ml-1 text-xs animate-bounce inline-block">↑</span>}
          {isDecreasing && <span className="ml-1 text-xs animate-bounce inline-block">↓</span>}
        </div>
        {trend.value > 0 && (
          <p className="text-xs text-muted-foreground flex items-center mt-1 group-hover:text-muted-foreground/80 transition-colors duration-300">
            <span className="group-hover:scale-110 transition-transform duration-300 mr-1">
              {trend.isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
            </span>
            <span className={trend.isPositive ? "text-green-500" : "text-red-500"}>{trend.value}% from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
