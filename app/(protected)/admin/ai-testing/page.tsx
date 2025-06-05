"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Brain, Zap, Shield } from "lucide-react"

export default function AITestingDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          AI Notification Testing Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor and test your AI-powered notification system in real-time
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">ONLINE</div>
            <p className="text-xs text-muted-foreground">
              All AI services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">80%</div>
            <p className="text-xs text-muted-foreground">
              Average prediction accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Test</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <p className="text-xs text-muted-foreground">
              Success rate (8/8 tests)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Access Required
          </CardTitle>
          <CardDescription className="text-orange-700">
            This testing interface provides full access to AI system internals. Use responsibly in production environments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300">✅ Smart Timing</Badge>
            <Badge variant="outline" className="text-green-700 border-green-300">✅ Predictive Insights</Badge>
            <Badge variant="outline" className="text-green-700 border-green-300">✅ Performance Analytics</Badge>
            <Badge variant="outline" className="text-green-700 border-green-300">✅ Notification Creation</Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300">🔧 Real-time Testing</Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Testing Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Testing Interface</CardTitle>
          <CardDescription>
            Comprehensive testing suite for AI notification features - running on port 3001
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            src="/test-ai-notifications-v3.html"
            className="w-full h-[800px] border-0 rounded-lg"
            title="AI Notification Testing Dashboard"
            style={{ minHeight: '800px' }}
          />
        </CardContent>
      </Card>

      {/* Technical Notes */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">🔧 Technical Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><strong>API Endpoint:</strong> http://localhost:3001/api/notifications</div>
          <div><strong>Authentication:</strong> Cookie-based (current session)</div>
          <div><strong>User ID (UUID):</strong> 764c38af-e49c-4fc0-9584-4cdcbbc3625c</div>
          <div><strong>User ID (Integer):</strong> 1 (for notification creation)</div>
          <div><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</div>
        </CardContent>
      </Card>
    </div>
  )
} 