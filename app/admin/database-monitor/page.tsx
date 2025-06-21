"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Server,
  Clock,
  BarChart3,
  FileText,
  Users,
  Building,
  Quote,
  Bell
} from 'lucide-react'

interface DatabaseStatus {
  status: string
  timestamp: string
  connection: {
    status: string
    responseTime: string
    environment: string
  }
  tables: Array<{
    name: string
    count: number
    status: string
    error?: string
  }>
  foreignKeys: {
    status: string
    message: string
    lastChecked?: string
    details?: string
    error?: string
  }
  schema: {
    tableCount: number
    schemas: string[]
    lastUpdate: string
  }
  recentActivity: {
    recentQuotations: Array<any>
    recentLeads: Array<any>
    lastActivity: string
  }
  uptime: number
  memoryUsage: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
}

export default function DatabaseMonitorPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/database-status')
      const data = await response.json()
      setStatus(data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch database status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>
      case 'warning':
        return <Badge variant="destructive" className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'companies': return <Building className="w-4 h-4" />
      case 'employees': return <Users className="w-4 h-4" />
      case 'quotations': return <Quote className="w-4 h-4" />
      case 'notifications': return <Bell className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading database status...
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            Database Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Enterprise-grade database monitoring and health checking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.connection.status}</div>
            {status && getStatusBadge(status.status)}
            <p className="text-xs text-muted-foreground mt-1">
              Response: {status?.connection.responseTime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foreign Keys</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.foreignKeys.status === 'healthy' ? 'Valid' : 'Issues'}
            </div>
            {status && getStatusBadge(status.foreignKeys.status)}
            <p className="text-xs text-muted-foreground mt-1">
              {status?.foreignKeys.message}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status ? formatUptime(status.uptime) : 'N/A'}
            </div>
            <Badge variant="outline">
              Environment: {status?.connection.environment}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status ? formatBytes(status.memoryUsage.heapUsed) : 'N/A'}
            </div>
            <Progress 
              value={status ? (status.memoryUsage.heapUsed / status.memoryUsage.heapTotal) * 100 : 0}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Heap: {status ? formatBytes(status.memoryUsage.heapTotal) : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tables">Table Statistics</TabsTrigger>
          <TabsTrigger value="integrity">Foreign Keys</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Statistics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Current record counts and table health status
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {status?.tables.map((table) => (
                  <Card key={table.name} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTableIcon(table.name)}
                          <span className="font-medium capitalize">{table.name}</span>
                        </div>
                        {getStatusBadge(table.status)}
                      </div>
                      <div className="text-2xl font-bold mt-2">{table.count.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">records</p>
                      {table.error && (
                        <p className="text-xs text-red-500 mt-1">{table.error}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Foreign Key Integrity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Database referential integrity validation results
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-semibold">Overall Status</h3>
                    <p className="text-sm text-muted-foreground">{status?.foreignKeys.message}</p>
                  </div>
                  {status && getStatusBadge(status.foreignKeys.status)}
                </div>
                
                {status?.foreignKeys.lastChecked && (
                  <div className="text-sm text-muted-foreground">
                    Last checked: {new Date(status.foreignKeys.lastChecked).toLocaleString()}
                  </div>
                )}

                {status?.foreignKeys.details && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800">Details:</h4>
                    <pre className="text-sm text-yellow-700 mt-1">{status.foreignKeys.details}</pre>
                  </div>
                )}

                {status?.foreignKeys.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800">Error:</h4>
                    <pre className="text-sm text-red-700 mt-1">{status.foreignKeys.error}</pre>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.open('/fk_mismatch_log.html', '_blank')}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Detailed FK Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quotations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {status?.recentActivity.recentQuotations.length ? (
                    status.recentActivity.recentQuotations.map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-mono text-sm">#{quote.id}</span>
                        <Badge variant="outline">{quote.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent quotations</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {status?.recentActivity.recentLeads.length ? (
                    status.recentActivity.recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-mono text-sm">#{lead.id}</span>
                        <Badge variant="outline">{lead.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent leads</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Schema Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Tables:</span>
                    <span className="ml-2 text-2xl font-bold">{status?.schema.tableCount}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Schemas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {status?.schema.schemas.map((schema) => (
                        <Badge key={schema} variant="outline">{schema}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last updated: {status?.schema.lastUpdate ? new Date(status.schema.lastUpdate).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">RSS Memory:</span>
                    <span className="ml-2 font-mono">{status ? formatBytes(status.memoryUsage.rss) : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">External Memory:</span>
                    <span className="ml-2 font-mono">{status ? formatBytes(status.memoryUsage.external) : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Last Refresh:</span>
                    <span className="ml-2 text-sm">{lastRefresh.toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 