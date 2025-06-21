'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useCurrentUser } from '@/hooks/use-current-user'

interface TestResult {
  success: boolean
  test: string
  timestamp: string
  data?: any
  error?: string
}

interface SSEMessage {
  event: string
  data: any
  timestamp: string
}

export function RealtimeTestDashboard() {
  // State
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [sseMessages, setSSEMessages] = useState<SSEMessage[]>([])
  const [logOutput, setLogOutput] = useState<string[]>([])
  
  // Test controls
  const [notificationUserId, setNotificationUserId] = useState('1')
  const [stressTestIterations, setStressTestIterations] = useState(10)
  const [testDataCount, setTestDataCount] = useState(5)

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // Hooks
  const { user } = useCurrentUser()

  // Utility functions
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'
    const logMessage = `[${timestamp}] ${emoji} ${message}`
    
    setLogOutput(prev => [...prev.slice(-49), logMessage]) // Keep last 50 logs
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight
      }
    }, 100)
  }

  const runTest = async (testType: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
    setIsLoading(true)
    addLog(`Running test: ${testType}`, 'info')

    try {
      const url = method === 'GET' 
        ? `/api/test-realtime?test=${testType}`
        : '/api/test-realtime'

      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }

      if (method === 'POST') {
        options.body = JSON.stringify({ test: testType, data })
      }

      const response = await fetch(url, options)
      const result = await response.json()

      setTestResults(prev => [result, ...prev.slice(0, 19)]) // Keep last 20 results

      if (result.success) {
        addLog(`Test ${testType} passed`, 'success')
      } else {
        addLog(`Test ${testType} failed: ${result.error}`, 'error')
      }

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`Test ${testType} error: ${errorMessage}`, 'error')
      
      const errorResult = {
        success: false,
        test: testType,
        timestamp: new Date().toISOString(),
        error: errorMessage
      }
      
      setTestResults(prev => [errorResult, ...prev.slice(0, 19)])
      return errorResult

    } finally {
      setIsLoading(false)
    }
  }

  // SSE Connection Management
  const connectSSE = () => {
    if (eventSourceRef.current) {
      addLog('SSE already connected', 'warning')
      return
    }

    addLog('Connecting to SSE...', 'info')
    setConnectionStatus('connecting')

    const eventSource = new EventSource('/api/sse', {
      withCredentials: true
    })

    eventSource.onopen = () => {
      addLog('SSE connected successfully', 'success')
      setConnectionStatus('connected')
    }

    eventSource.onmessage = (event) => {
      const message = {
        event: 'message',
        data: JSON.parse(event.data),
        timestamp: new Date().toISOString()
      }
      
      setSSEMessages(prev => [message, ...prev.slice(0, 19)])
      addLog(`SSE message received: ${event.data.substring(0, 100)}...`, 'info')
    }

    // Listen to specific events
    const events = ['notification', 'activity', 'dashboard_update', 'test_event', 'heartbeat']
    
    events.forEach(eventType => {
      eventSource.addEventListener(eventType, (event) => {
        const message = {
          event: eventType,
          data: JSON.parse(event.data),
          timestamp: new Date().toISOString()
        }
        
        setSSEMessages(prev => [message, ...prev.slice(0, 19)])
        addLog(`SSE ${eventType} received`, 'success')
      })
    })

    eventSource.onerror = (error) => {
      addLog('SSE connection error', 'error')
      setConnectionStatus('error')
    }

    eventSourceRef.current = eventSource
  }

  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setConnectionStatus('disconnected')
      addLog('SSE disconnected', 'info')
    }
  }

  // Auto-connect on mount
  useEffect(() => {
    return () => {
      disconnectSSE()
    }
  }, [])

  // Test runners
  const runBasicTests = async () => {
    await runTest('status')
    await runTest('database')
    await runTest('auth')
    await runTest('sse-stats')
  }

  const runBroadcastTests = async () => {
    await runTest('broadcast-notification', 'POST', { 
      userId: notificationUserId, 
      message: 'Test notification from dashboard' 
    })
    
    await runTest('broadcast-activity', 'POST', { 
      title: 'Test Activity', 
      description: 'Real-time activity test from dashboard' 
    })
    
    await runTest('broadcast-dashboard', 'POST', { 
      total_leads: Math.floor(Math.random() * 1000),
      total_clients: Math.floor(Math.random() * 500)
    })
  }

  const runStressTest = async () => {
    await runTest('stress-test', 'POST', { 
      iterations: stressTestIterations, 
      delay: 100 
    })
  }

  const createTestData = async () => {
    await runTest('create-test-data', 'POST', { 
      count: testDataCount 
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔴 Real-time Infrastructure Test Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive testing for WebSocket + SSE infrastructure
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 
                    connectionStatus === 'connecting' ? 'secondary' : 
                    connectionStatus === 'error' ? 'destructive' : 'outline'}
          >
            SSE: {connectionStatus.toUpperCase()}
          </Badge>
          
          {user && (
            <Badge variant="outline">
              User: {user.name} (ID: {user.id})
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Controls */}
        <Card>
          <CardHeader>
            <CardTitle>🔌 Connection Management</CardTitle>
            <CardDescription>
              Manage SSE connections and test basic connectivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={connectSSE} 
                disabled={connectionStatus === 'connected'}
                variant="default"
              >
                Connect SSE
              </Button>
              <Button 
                onClick={disconnectSSE} 
                disabled={connectionStatus === 'disconnected'}
                variant="outline"
              >
                Disconnect
              </Button>
            </div>
            
            <Button 
              onClick={runBasicTests} 
              disabled={isLoading}
              className="w-full"
            >
              🧪 Run Basic Tests
            </Button>
          </CardContent>
        </Card>

        {/* Broadcast Tests */}
        <Card>
          <CardHeader>
            <CardTitle>📡 Broadcast Testing</CardTitle>
            <CardDescription>
              Test real-time broadcasting functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification User ID:</label>
              <Input
                value={notificationUserId}
                onChange={(e) => setNotificationUserId(e.target.value)}
                placeholder="User ID for notifications"
              />
            </div>
            
            <Button 
              onClick={runBroadcastTests} 
              disabled={isLoading}
              className="w-full"
            >
              🔔 Test All Broadcasts
            </Button>
          </CardContent>
        </Card>

        {/* Stress Testing */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Stress Testing</CardTitle>
            <CardDescription>
              Test system performance under load
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Iterations:</label>
              <Input
                type="number"
                value={stressTestIterations}
                onChange={(e) => setStressTestIterations(parseInt(e.target.value) || 10)}
                min="1"
                max="100"
              />
            </div>
            
            <Button 
              onClick={runStressTest} 
              disabled={isLoading}
              variant="secondary"
              className="w-full"
            >
              ⚡ Run Stress Test
            </Button>
          </CardContent>
        </Card>

        {/* Test Data Creation */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Test Data</CardTitle>
            <CardDescription>
              Create test records for real-time testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Record Count:</label>
              <Input
                type="number"
                value={testDataCount}
                onChange={(e) => setTestDataCount(parseInt(e.target.value) || 5)}
                min="1"
                max="20"
              />
            </div>
            
            <Button 
              onClick={createTestData} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              📝 Create Test Data
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SSE Messages */}
        <Card>
          <CardHeader>
            <CardTitle>📡 Real-time Messages ({sseMessages.length})</CardTitle>
            <CardDescription>
              Live SSE messages received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sseMessages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No messages received. Connect SSE and run tests.
                </p>
              ) : (
                sseMessages.map((message, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{message.event}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Test Results ({testResults.length})</CardTitle>
            <CardDescription>
              Recent test execution results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tests run yet. Click a test button to start.
                </p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={result.success ? 'default' : 'destructive'}
                        >
                          {result.test}
                        </Badge>
                        {result.success ? '✅' : '❌'}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-sm text-destructive mb-2">{result.error}</p>
                    )}
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer mb-1">View Details</summary>
                        <pre className="overflow-x-auto bg-background p-2 rounded">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Log */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Live Test Log</CardTitle>
          <CardDescription>
            Real-time test execution log
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={logRef}
            className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-60 overflow-y-auto"
          >
            {logOutput.length === 0 ? (
              <div className="text-gray-500">Waiting for test execution...</div>
            ) : (
              logOutput.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 