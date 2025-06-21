"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, Sync, CheckCircle, AlertCircle } from 'lucide-react'

interface SyncStatus {
  enabled: boolean
  tables: Record<string, {
    local: number
    production: number
    synced: boolean
  }>
  lastCheck: string
}

export function DatabaseSyncDashboard() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadSyncStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/database-sync')
      const result = await response.json()
      
      if (result.success) {
        setSyncStatus(result.data)
      }
    } catch (error) {
      console.error('Failed to load sync status:', error)
    } finally {
      setLoading(false)
    }
  }

  const performSync = async (action: string, table?: string) => {
    try {
      setSyncing(true)
      const response = await fetch('/api/admin/database-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, table })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('Sync completed:', result.message)
        await loadSyncStatus() // Refresh status
      } else {
        console.error('Sync failed:', result.error)
      }
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadSyncStatus()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading sync status...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Synchronization</h2>
          <p className="text-muted-foreground">
            Real-time sync between local and production databases
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadSyncStatus} variant="outline" size="sm">
            <Sync className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => performSync('sync-all')} 
            disabled={syncing}
            size="sm"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Local Database</span>
            </CardTitle>
            <CardDescription>ooak_future (Development)</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Production Database</span>
            </CardTitle>
            <CardDescription>ooak_future_production (Backup)</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          </CardContent>
        </Card>
      </div>

      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Table Synchronization Status</CardTitle>
            <CardDescription>
              Last checked: {new Date(syncStatus.lastCheck).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(syncStatus.tables).map(([table, status]) => (
                <div key={table} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {status.synced ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="font-medium capitalize">{table}</span>
                    </div>
                    <Badge variant={status.synced ? "secondary" : "destructive"}>
                      {status.synced ? "Synced" : "Out of sync"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground">
                      Local: {status.local} | Production: {status.production}
                    </div>
                    <Button
                      onClick={() => performSync('sync-table', table)}
                      disabled={syncing}
                      size="sm"
                      variant="outline"
                    >
                      {syncing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sync className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Auto-Sync Active</CardTitle>
          <CardDescription className="text-blue-600">
            All database changes are automatically synchronized to production in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-blue-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Real-time sync enabled</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 