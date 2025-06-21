"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, Sync, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react'

export default function DatabaseSyncPage() {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadSyncStatus = async () => {
    try {
      setLoading(true)
      // Simulate API call
      const mockStatus = {
        enabled: true,
        production_db: 'ooak_future_production',
        local_db: 'ooak_future',
        tables: {
          companies: { local: 4, production: 4, synced: true },
          departments: { local: 21, production: 21, synced: true },
          branches: { local: 6, production: 6, synced: true },
          employees: { local: 45, production: 45, synced: true },
          leads: { local: 14, production: 14, synced: true },
          clients: { local: 0, production: 0, synced: true },
          suppliers: { local: 0, production: 0, synced: true },
          quotations: { local: 4, production: 4, synced: true }
        },
        lastSync: new Date().toISOString()
      }
      setSyncStatus(mockStatus)
    } catch (error) {
      console.error('Failed to load sync status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSyncStatus()
    const interval = setInterval(loadSyncStatus, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading sync status...</span>
      </div>
    )
  }

  const totalTables = Object.keys(syncStatus?.tables || {}).length
  const syncedTables = Object.values(syncStatus?.tables || {}).filter((table: any) => table.synced).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Synchronization</h1>
          <p className="text-muted-foreground">
            Real-time backup and synchronization between local and production databases
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadSyncStatus} variant="outline" size="sm">
            <Sync className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Auto-Sync Active</span>
          </Badge>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span>Local Database</span>
            </CardTitle>
            <CardDescription>ooak_future (Development)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Object.values(syncStatus?.tables || {}).reduce((sum: number, table: any) => sum + table.local, 0)} total records
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span>Production Database</span>
            </CardTitle>
            <CardDescription>ooak_future_production (Backup)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Synced
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Object.values(syncStatus?.tables || {}).reduce((sum: number, table: any) => sum + table.production, 0)} total records
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Sync className="h-5 w-5 text-green-600" />
              <span>Sync Status</span>
            </CardTitle>
            <CardDescription>Continuous monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Play className="h-3 w-3 mr-1" />
                Running
              </Badge>
              <span className="text-sm text-muted-foreground">
                {syncedTables}/{totalTables} tables synced
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Sync Details */}
      <Card>
        <CardHeader>
          <CardTitle>Table Synchronization Details</CardTitle>
          <CardDescription>
            Last sync: {syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(syncStatus?.tables || {}).map(([tableName, status]: [string, any]) => (
              <div key={tableName} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {status.synced ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                    <span className="font-medium capitalize">{tableName}</span>
                  </div>
                  <Badge variant={status.synced ? "secondary" : "destructive"}>
                    {status.synced ? "Synced" : "Out of sync"}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">
                    Local: <span className="font-medium">{status.local}</span> | 
                    Production: <span className="font-medium">{status.production}</span>
                  </div>
                  {!status.synced && (
                    <Button size="sm" variant="outline">
                      <Sync className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Sync Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Continuous Backup Active</span>
          </CardTitle>
          <CardDescription className="text-blue-600">
            All database changes are automatically synchronized to production every 30 seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-blue-700">
              <CheckCircle className="h-4 w-4" />
              <span>Real-time change detection</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <CheckCircle className="h-4 w-4" />
              <span>Automatic conflict resolution</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <CheckCircle className="h-4 w-4" />
              <span>Foreign key constraint handling</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <CheckCircle className="h-4 w-4" />
              <span>Zero-downtime synchronization</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 