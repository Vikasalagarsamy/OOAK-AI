'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { 
  Power, 
  Activity, 
  Smartphone, 
  Globe, 
  Phone,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Brain,
  Mic,
  MessageSquare,
  TrendingUp,
  Shield,
  Heart
} from 'lucide-react'

interface SystemStatus {
  website: boolean
  publicUrl: boolean
  aiBrain: boolean
  whisper: boolean
  whatsapp: boolean
  callAnalytics: boolean
  database: boolean
  tunnel: boolean
  aiSecurity: boolean
}

interface BusinessMetrics {
  totalCalls: number
  aiResponses: number
  uptime: string
  activeServices: number
}

export default function BusinessControlPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    website: false,
    publicUrl: false,
    aiBrain: false,
    whisper: false,
    whatsapp: false,
    callAnalytics: false,  
    database: false,
    tunnel: false,
    aiSecurity: false
  })
  
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    totalCalls: 0,
    aiResponses: 0,
    uptime: '0h 0m',
    activeServices: 0
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date>(new Date())
  const [businessRunning, setBusinessRunning] = useState(false)

  // Check system status - BULLETPROOF version that matches startup script exactly
  const checkSystemStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/health/simple-status')
      
      if (response.ok) {
        const data = await response.json()
        
        // Update system status with exact backend reality
        setSystemStatus({
          website: data.systemStatus.website,
          publicUrl: data.systemStatus.publicUrl,
          aiBrain: data.systemStatus.aiBrain,
          whatsapp: data.systemStatus.whatsapp,
          callAnalytics: data.systemStatus.callAnalytics,
          database: data.systemStatus.database,
          tunnel: data.systemStatus.tunnel,
          whisper: data.systemStatus.whisper,
          aiSecurity: data.systemStatus.aiBrain && data.systemStatus.database // AI Security requires both AI and DB
        })
        
        // Update business metrics with exact backend data
        setBusinessMetrics(prev => ({
          ...prev, 
          activeServices: data.businessMetrics.activeServices
        }))
        
        // Business running status matches exactly what backend calculates
        setBusinessRunning(data.businessMetrics.businessRunning)
        
        console.log('✅ System status updated:', data.businessMetrics)
      } else {
        console.error('❌ Status check failed:', response.status)
        // If status check fails, mark everything as down
        setSystemStatus({
          website: false,
          publicUrl: false,
          aiBrain: false,
          whatsapp: false,
          callAnalytics: false,
          database: false,
          tunnel: false,
          whisper: false,
          aiSecurity: false
        })
        setBusinessRunning(false)
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error)
      // Network error - mark everything as down
      setSystemStatus({
        website: false,
        publicUrl: false,
        aiBrain: false,
        whatsapp: false,
        callAnalytics: false,
        database: false,
        tunnel: false,
        whisper: false,
        aiSecurity: false
      })
      setBusinessRunning(false)
    } finally {
      setIsLoading(false)
      setLastCheck(new Date())
    }
  }

  // Start business
  const startBusiness = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/control/start', { method: 'POST' })
      setTimeout(checkSystemStatus, 5000) // Check after 5 seconds
    } catch (error) {
      console.error('Start failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Stop business  
  const stopBusiness = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/control/stop', { method: 'POST' })
      setTimeout(checkSystemStatus, 3000) // Check after 3 seconds
    } catch (error) {
      console.error('Stop failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Emergency restart
  const emergencyRestart = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/control/emergency', { method: 'POST' })
      setTimeout(checkSystemStatus, 10000) // Check after 10 seconds
    } catch (error) {
      console.error('Emergency restart failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Nuclear emergency stop
  const nuclearEmergencyStop = async () => {
    if (!confirm('⚠️ NUCLEAR EMERGENCY STOP\n\nThis will completely stop AI Brain and disable auto-restart.\n\nOnly use if AI is seriously malfunctioning.\n\nContinue?')) {
      return
    }
    
    setIsLoading(true)
    try {
      console.log('🚨 Executing nuclear emergency stop...')
      const response = await fetch('/api/control/emergency-stop', { method: 'POST' })
      const result = await response.json()
      console.log('🚨 Nuclear stop result:', result)
      
      // Check status after emergency stop
      setTimeout(checkSystemStatus, 2000)
      setTimeout(checkSystemStatus, 5000)
      
    } catch (error) {
      console.error('Nuclear emergency stop failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Emergency recovery
  const emergencyRecover = async () => {
    setIsLoading(true)
    try {
      console.log('🔧 Executing emergency recovery...')
      const response = await fetch('/api/control/emergency-recover', { method: 'POST' })
      const result = await response.json()
      console.log('🔧 Recovery result:', result)
      
      // Check status after recovery
      setTimeout(checkSystemStatus, 3000)
      setTimeout(checkSystemStatus, 6000)
      
    } catch (error) {
      console.error('Emergency recovery failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    checkSystemStatus()
    const interval = setInterval(checkSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Individual service control
  const controlService = async (service: string, action: 'start' | 'stop') => {
    setIsLoading(true)
    try {
      console.log(`🎛️ ${action} ${service}`)
      const response = await fetch(`/api/control/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const result = await response.json()
      console.log(`✅ Control result:`, result)
      
      // Check status faster and multiple times to catch the change
      setTimeout(checkSystemStatus, 500)  // Check after 0.5 seconds
      setTimeout(checkSystemStatus, 1500) // Check after 1.5 seconds
      setTimeout(checkSystemStatus, 3000) // Check after 3 seconds
      
    } catch (error) {
      console.error(`${action} ${service} failed:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const StatusIndicator = ({ status, label, icon: Icon, service }: { 
    status: boolean, 
    label: string, 
    icon: any, 
    service?: string 
  }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        {status ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        {service && (
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-8 text-xs p-0 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => controlService(service, 'start')}
              disabled={isLoading || status}
              title={`Start ${label}`}
            >
              ▶
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-8 text-xs p-0 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => controlService(service, 'stop')}
              disabled={isLoading || !status}
              title={`Stop ${label}`}
            >
              ⏹
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AI Business Hub</h1>
          <p className="text-gray-600">Your Empire. Your Control.</p>
        </div>

        {/* Business Status Card */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Business Status</CardTitle>
              <Badge 
                variant={businessRunning ? "default" : "destructive"}
                className="text-xs"
              >
                {businessRunning ? "🟢 LIVE" : "🔴 OFFLINE"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{businessMetrics.activeServices}</div>
                <div className="text-xs text-gray-600">Services Active</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{businessMetrics.totalCalls}</div>
                <div className="text-xs text-gray-600">Calls Today</div>
              </div>
            </div>
            
            {/* Master Control Switch */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg mb-4">
              <div>
                <div className="font-semibold text-gray-800">🚀 Master Control</div>
                <div className="text-xs text-gray-600">Turn everything on/off</div>
              </div>
              <Switch 
                checked={businessRunning}
                onCheckedChange={(checked) => checked ? startBusiness() : stopBusiness()}
                disabled={isLoading}
                className="scale-125"
              />
            </div>
            
            {/* Manual Control Buttons (Backup) */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={startBusiness}
                disabled={isLoading || businessRunning}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Power className="w-4 h-4 mr-1" />
                START
              </Button>
              
              <Button 
                onClick={stopBusiness}
                disabled={isLoading || !businessRunning}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                size="sm"
              >
                <Power className="w-4 h-4 mr-1" />
                STOP
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>System Health</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={checkSystemStatus}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatusIndicator status={systemStatus.website} label="Website" icon={Globe} />
            <StatusIndicator status={systemStatus.publicUrl} label="Public API" icon={Smartphone} />
            <StatusIndicator 
              status={systemStatus.aiBrain} 
              label="AI Brain" 
              icon={Brain} 
              service="ai-brain"
            />
            <StatusIndicator status={systemStatus.whisper} label="Voice AI" icon={Mic} />
            <StatusIndicator status={systemStatus.whatsapp} label="WhatsApp" icon={MessageSquare} />
            <StatusIndicator status={systemStatus.callAnalytics} label="Call Analytics" icon={Phone} />
            <StatusIndicator status={systemStatus.database} label="Database" icon={Shield} />
            <StatusIndicator status={systemStatus.tunnel} label="Secure Tunnel" icon={Zap} />
            <StatusIndicator status={systemStatus.aiSecurity} label="AI Security" icon={Shield} />
          </CardContent>
        </Card>

        {/* REAL Emergency Controls */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2 text-red-700">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>🚨 AI Emergency Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="bg-orange-50 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-sm">
                <strong>INSTANT AI Disconnect:</strong> If AI is misbehaving, disconnect it from your business data in 0.1 seconds. AI Brain keeps running but can't access your data.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    await fetch('/api/ai-emergency-disconnect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'disconnect' })
                    })
                    setTimeout(checkSystemStatus, 1000)
                  } catch (error) {
                    console.error('AI disconnect failed:', error)
                  } finally {
                    setIsLoading(false)
                  }
                }}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                🚨 DISCONNECT AI FROM BUSINESS (0.1s)
              </Button>
              
              <Button 
                onClick={async () => {
                  console.log('🔧 RECONNECT button clicked')
                  setIsLoading(true)
                  try {
                    console.log('📤 Sending reconnect request...')
                    const response = await fetch('/api/ai-emergency-disconnect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'reconnect' })
                    })
                    
                    const result = await response.json()
                    console.log('📥 Reconnect response:', result)
                    
                    if (result.success) {
                      console.log('✅ AI RECONNECTED successfully!')
                      alert('✅ AI RECONNECTED to business data!')
                    } else {
                      console.error('❌ Reconnect failed:', result)
                      alert('❌ Reconnect failed: ' + result.error)
                    }
                    
                    setTimeout(checkSystemStatus, 1000)
                                      } catch (error) {
                      console.error('❌ AI reconnect failed:', error)
                      alert('❌ Network error: ' + (error instanceof Error ? error.message : 'Unknown error'))
                  } finally {
                    setIsLoading(false)
                  }
                }}
                disabled={isLoading}
                variant="outline"
                className="w-full border-green-200 text-green-600 hover:bg-green-50"
                size="lg"
              >
                <Settings className="w-5 h-5 mr-2" />
                🔧 RECONNECT AI TO BUSINESS (0.1s)
              </Button>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-700">
                <strong>How it works:</strong> Disconnect blocks AI from your database instantly. Your business (WhatsApp, calls, website) keeps working. AI Brain still runs but gives safe responses.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>



        {/* Business URLs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Business URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Website:</span>
                <span className="text-blue-600 text-xs">localhost:3000</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <Smartphone className="w-4 h-4 text-green-500" />
                <span className="font-medium">Public API:</span>
                <span className="text-green-600 text-xs">api.ooak.photography</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Analytics:</span>
                <Button 
                  variant="link" 
                  className="text-purple-600 text-xs p-0 h-auto"
                  onClick={() => window.open('https://api.ooak.photography/tasks/dashboard/call-analytics')}
                >
                  Open Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Footer */}
        <div className="text-center text-xs text-gray-500 pb-4">
          Last updated: {lastCheck.toLocaleTimeString()}
          <br />
          Your AI Business • Always Under Your Control 💪
        </div>
      </div>
    </div>
  )
} 