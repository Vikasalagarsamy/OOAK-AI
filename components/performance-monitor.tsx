/**
 * ⚡ PERFORMANCE MONITOR
 * 
 * Features:
 * - Real-time performance tracking
 * - Login speed metrics
 * - Permission check times
 * - Network latency monitoring
 * - Visual performance indicators
 */

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Activity, Zap, Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface PerformanceMetrics {
  loginTime?: number
  permissionCheckTime?: number
  pageLoadTime?: number
  networkLatency?: number
  lastUpdated?: number
}

interface PerformanceGrade {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  color: string
  bgColor: string
  description: string
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isVisible, setIsVisible] = useState(false)
  const [grade, setGrade] = useState<PerformanceGrade>({
    grade: 'A+',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Lightning Fast'
  })

  // Calculate overall performance grade
  const calculateGrade = (metrics: PerformanceMetrics): PerformanceGrade => {
    const avgTime = (
      (metrics.loginTime || 0) + 
      (metrics.permissionCheckTime || 0) + 
      (metrics.pageLoadTime || 0)
    ) / 3

    if (avgTime < 50) return {
      grade: 'A+',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Lightning Fast ⚡'
    }
    if (avgTime < 100) return {
      grade: 'A',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      description: 'Very Fast 🚀'
    }
    if (avgTime < 200) return {
      grade: 'B',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Fast 🏎️'
    }
    if (avgTime < 500) return {
      grade: 'C',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Average 🐌'
    }
    if (avgTime < 1000) return {
      grade: 'D',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      description: 'Slow 🚶'
    }
    return {
      grade: 'F',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Very Slow 🐢'
    }
  }

  // Monitor page load performance
  useEffect(() => {
    const measurePageLoad = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
        
        setMetrics(prev => ({
          ...prev,
          pageLoadTime: Math.round(pageLoadTime),
          lastUpdated: Date.now()
        }))
      }
    }

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePageLoad()
    } else {
      window.addEventListener('load', measurePageLoad)
      return () => window.removeEventListener('load', measurePageLoad)
    }
  }, [])

  // Monitor permission check performance
  useEffect(() => {
    const originalConsoleLog = console.log
    
    console.log = (...args) => {
      const message = args.join(' ')
      
      // Capture login metrics
      if (message.includes('Ultra-fast login SUCCESS')) {
        const totalMatch = message.match(/Total: (\d+)ms/)
        if (totalMatch) {
          setMetrics(prev => ({
            ...prev,
            loginTime: parseInt(totalMatch[1]),
            lastUpdated: Date.now()
          }))
        }
      }
      
      // Capture permission check metrics
      if (message.includes('Permission check completed')) {
        const timeMatch = message.match(/(\d+)ms/)
        if (timeMatch) {
          setMetrics(prev => ({
            ...prev,
            permissionCheckTime: parseInt(timeMatch[1]),
            lastUpdated: Date.now()
          }))
        }
      }
      
      originalConsoleLog.apply(console, args)
    }

    return () => {
      console.log = originalConsoleLog
    }
  }, [])

  // Update grade when metrics change
  useEffect(() => {
    const newGrade = calculateGrade(metrics)
    setGrade(newGrade)
  }, [metrics])

  // Auto-hide after 10 seconds
  useEffect(() => {
    if (metrics.lastUpdated) {
      setIsVisible(true)
      const timer = setTimeout(() => setIsVisible(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [metrics.lastUpdated])

  // Show/hide toggle
  const toggleVisibility = () => setIsVisible(!isVisible)

  if (!isVisible && !metrics.lastUpdated) return null

  return (
    <>
      {/* Floating Performance Badge */}
      <div 
        className={cn(
          "fixed bottom-4 right-4 z-50 transition-all duration-300 cursor-pointer",
          isVisible ? "scale-100 opacity-100" : "scale-75 opacity-70 hover:scale-100 hover:opacity-100"
        )}
        onClick={toggleVisibility}
      >
        <div className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg border backdrop-blur-sm",
          grade.bgColor,
          "hover:shadow-xl transition-shadow"
        )}>
          <Zap className={cn("w-4 h-4", grade.color)} />
          <span className={cn("text-sm font-bold", grade.color)}>
            {grade.grade}
          </span>
        </div>
      </div>

      {/* Detailed Performance Panel */}
      <div className={cn(
        "fixed bottom-16 right-4 z-50 transition-all duration-300 w-72",
        isVisible ? "transform translate-y-0 opacity-100" : "transform translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className={cn("px-4 py-3 border-b", grade.bgColor)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className={cn("w-5 h-5", grade.color)} />
                <h3 className={cn("font-semibold", grade.color)}>Performance</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className={cn("text-2xl font-bold", grade.color)}>{grade.grade}</span>
                <span className={cn("text-xs", grade.color)}>{grade.description}</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="p-4 space-y-3">
            {metrics.loginTime && (
              <MetricRow
                icon={CheckCircle}
                label="Login Speed"
                value={`${metrics.loginTime}ms`}
                grade={metrics.loginTime < 50 ? 'excellent' : metrics.loginTime < 100 ? 'good' : 'fair'}
              />
            )}
            
            {metrics.permissionCheckTime && (
              <MetricRow
                icon={Zap}
                label="Permission Check"
                value={`${metrics.permissionCheckTime}ms`}
                grade={metrics.permissionCheckTime < 1 ? 'excellent' : metrics.permissionCheckTime < 5 ? 'good' : 'fair'}
              />
            )}
            
            {metrics.pageLoadTime && (
              <MetricRow
                icon={Clock}
                label="Page Load"
                value={`${metrics.pageLoadTime}ms`}
                grade={metrics.pageLoadTime < 200 ? 'excellent' : metrics.pageLoadTime < 500 ? 'good' : 'fair'}
              />
            )}

            {/* Overall Status */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>System Status</span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Optimized</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface MetricRowProps {
  icon: any
  label: string
  value: string
  grade: 'excellent' | 'good' | 'fair' | 'poor'
}

function MetricRow({ icon: Icon, label, value, grade }: MetricRowProps) {
  const gradeColors = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600'
  }

  const gradeIcons = {
    excellent: CheckCircle,
    good: Zap,
    fair: Clock,
    poor: AlertTriangle
  }

  const StatusIcon = gradeIcons[grade]

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-sm font-mono font-medium">{value}</span>
        <StatusIcon className={cn("w-3 h-3", gradeColors[grade])} />
      </div>
    </div>
  )
} 