import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Target, Settings, Bot, RefreshCw, BarChart3, Calendar, FileText, TrendingUp, Users, Clock } from "lucide-react"

export default function TasksPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold tracking-tight">AI Task Management System</h1>
          <Badge variant="secondary" className="bg-green-100 text-green-800">NEW</Badge>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Intelligent task management powered by AI for smarter employee work and easier tracking
        </p>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">247</p>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">₹2.4M</p>
                <p className="text-sm text-muted-foreground">Revenue Protected</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-sm text-muted-foreground">On-Time Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Employee Portal */}
        <Link href="/tasks/dashboard">
          <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-lg">My Tasks Dashboard</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">PORTAL</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Employee portal for managing your assigned tasks, tracking progress, and viewing performance metrics.
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                <p>• View assigned tasks</p>
                <p>• Track progress & deadlines</p>
                <p>• Performance insights</p>
                <p>• Calendar integration</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Admin Control Center */}
        <Link href="/admin/task-management">
          <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-lg">Admin Control Center</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">ADMIN</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Administrative dashboard for task oversight, team management, and system configuration.
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                <p>• Team task overview</p>
                <p>• Task assignment & management</p>
                <p>• Performance monitoring</p>
                <p>• System settings</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* AI Task Generator */}
        <Link href="/test-ai-task-system.html">
          <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-green-600" />
                <CardTitle className="text-lg">AI Task Generator</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">AI</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Generate intelligent tasks using AI based on business rules, priorities, and current workload.
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                <p>• AI-powered task creation</p>
                <p>• Business rule integration</p>
                <p>• Priority calculation</p>
                <p>• Revenue impact analysis</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Migration Panel */}
        <Link href="/followup-to-task-migration.html">
          <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-orange-600" />
                <CardTitle className="text-lg">Migration Panel</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">MIGRATE</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Convert existing followups to intelligent tasks and migrate to the new AI-powered system.
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                <p>• Followup to task conversion</p>
                <p>• Migration status tracking</p>
                <p>• Data validation</p>
                <p>• Business impact analysis</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Task Analytics */}
        <Link href="/tasks/analytics">
          <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                <CardTitle className="text-lg">Task Analytics</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">ANALYTICS</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Comprehensive analytics and insights for task performance, team productivity, and business impact.
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                <p>• Performance metrics</p>
                <p>• Team productivity analysis</p>
                <p>• Revenue impact tracking</p>
                <p>• Trend analysis</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Task Calendar */}
        <Link href="/tasks/calendar">
          <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-cyan-600" />
                <CardTitle className="text-lg">Task Calendar</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">CALENDAR</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Calendar view of all tasks with deadlines, assignments, and scheduling capabilities.
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                <p>• Calendar task view</p>
                <p>• Deadline tracking</p>
                <p>• Schedule management</p>
                <p>• Event integration</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/navigation">
            <Card className="hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Complete Navigation</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/feature-checklist.html">
            <Card className="hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Feature Checklist</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/tasks/reports">
            <Card className="hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium">Task Reports</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/help/docs">
            <Card className="hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="font-medium">Documentation</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold">System Status: Operational</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-green-800">✅ AI Task Generation</p>
            <p className="text-green-600">All services running normally</p>
          </div>
          <div>
            <p className="font-medium text-green-800">✅ Migration System</p>
            <p className="text-green-600">Ready for followup conversion</p>
          </div>
          <div>
            <p className="font-medium text-green-800">✅ Analytics Engine</p>
            <p className="text-green-600">Real-time insights available</p>
          </div>
        </div>
      </div>
    </div>
  )
} 