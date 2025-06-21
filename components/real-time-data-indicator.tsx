'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Database,
  Zap
} from 'lucide-react'

interface DataStatus {
  is_live: boolean
  real_data_percentage: number
  total_tasks: number
  has_call_data: boolean
  last_updated: string
  recommendation: string
}

export function RealTimeDataIndicator() {
  const [status, setStatus] = useState<DataStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkDataStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/verify-data')
      const data = await response.json()
      
      if (data.success) {
        setStatus({
          is_live: data.summary.dashboard_shows_real_data,
          real_data_percentage: data.summary.real_data_percentage,
          total_tasks: data.summary.total_tasks,
          has_call_data: data.summary.has_live_call_data,
          last_updated: new Date().toISOString(),
          recommendation: data.summary.recommendation
        })
        setLastCheck(new Date())
      }
    } catch (error) {
      console.error('Failed to check data status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDataStatus()
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkDataStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Checking data status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = () => {
    if (status.real_data_percentage >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (status.real_data_percentage >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusIcon = () => {
    if (status.real_data_percentage >= 80) return <CheckCircle className="h-4 w-4" />
    if (status.real_data_percentage >= 50) return <AlertTriangle className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  return (
    <Card className="border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Live Data Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${status.is_live ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <Zap className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-sm font-medium">
                {status.is_live ? 'LIVE DATA' : 'STATIC DATA'}
              </span>
            </div>

            {/* Data Quality Badge */}
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1">{status.real_data_percentage}% Real</span>
            </Badge>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span>{status.total_tasks} tasks</span>
              </div>
              {status.has_call_data && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>Call data</span>
                </div>
              )}
            </div>
          </div>

          {/* Last Updated & Refresh */}
          <div className="flex items-center gap-2">
            {lastCheck && (
              <span className="text-xs text-gray-500">
                <Clock className="h-3 w-3 inline mr-1" />
                {lastCheck.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={checkDataStatus}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Recommendation */}
        {status.recommendation && (
          <div className="mt-2 text-xs text-gray-600 border-t pt-2">
            {status.recommendation}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 