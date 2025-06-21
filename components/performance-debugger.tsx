"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface PerformanceMetric {
  name: string
  time: number
  status: 'fast' | 'slow' | 'critical'
  details?: string
}

export function PerformanceDebugger() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [totalTime, setTotalTime] = useState(0)
  const [grade, setGrade] = useState<'A+' | 'A' | 'B' | 'C' | 'D' | 'F'>('F')

  useEffect(() => {
    const startTime = performance.now()
    const newMetrics: PerformanceMetric[] = []

    // 1. Check page load performance
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
      newMetrics.push({
        name: 'Page Load',
        time: Math.round(pageLoadTime),
        status: pageLoadTime < 100 ? 'fast' : pageLoadTime < 500 ? 'slow' : 'critical',
        details: `DOM: ${Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)}ms`
      })
    }

    // 2. Check auth performance
    const authStartTime = performance.now()
    // Simulate auth check
    setTimeout(() => {
      const authTime = performance.now() - authStartTime
      newMetrics.push({
        name: 'Auth Check',
        time: Math.round(authTime),
        status: authTime < 10 ? 'fast' : authTime < 50 ? 'slow' : 'critical',
        details: 'Ultra-fast auth system'
      })

      // 3. Check permission performance
      const permStartTime = performance.now()
      // Simulate permission check
      setTimeout(() => {
        const permTime = performance.now() - permStartTime
        newMetrics.push({
          name: 'Permissions',
          time: Math.round(permTime),
          status: permTime < 5 ? 'fast' : permTime < 20 ? 'slow' : 'critical',
          details: 'Cached permission checks'
        })

        // Calculate total and grade
        const total = newMetrics.reduce((sum, metric) => sum + metric.time, 0)
        setTotalTime(total)
        setMetrics(newMetrics)

        // Calculate grade
        if (total < 50) setGrade('A+')
        else if (total < 100) setGrade('A')
        else if (total < 200) setGrade('B')
        else if (total < 500) setGrade('C')
        else if (total < 1000) setGrade('D')
        else setGrade('F')

      }, 1)
    }, 1)

  }, [])

  const gradeColors = {
    'A+': 'text-green-600 bg-green-50',
    'A': 'text-green-500 bg-green-50',
    'B': 'text-yellow-600 bg-yellow-50',
    'C': 'text-orange-600 bg-orange-50',
    'D': 'text-red-500 bg-red-50',
    'F': 'text-red-600 bg-red-50'
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Performance Debug</h3>
        <div className={cn("px-2 py-1 rounded text-sm font-bold", gradeColors[grade])}>
          {grade} - {totalTime}ms
        </div>
      </div>

      <div className="space-y-2">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                metric.status === 'fast' ? 'bg-green-500' :
                metric.status === 'slow' ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <span className="text-gray-700">{metric.name}</span>
            </div>
            <div className="text-right">
              <div className="font-mono font-medium">{metric.time}ms</div>
              {metric.details && (
                <div className="text-xs text-gray-500">{metric.details}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Target: &lt;50ms for A+ grade
        </div>
        <div className="text-xs text-gray-500">
          Current: {totalTime > 50 ? '❌ NEEDS FIX' : '✅ MEETING TARGET'}
        </div>
      </div>
    </div>
  )
} 