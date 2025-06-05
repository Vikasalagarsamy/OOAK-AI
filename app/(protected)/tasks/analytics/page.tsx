import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Target, TrendingUp, Users, Clock, AlertCircle, Bot, CheckCircle } from "lucide-react"

export default function TaskAnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-8 w-8 text-indigo-600" />
          <h1 className="text-4xl font-bold tracking-tight">Task Analytics Dashboard</h1>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">LIVE</Badge>
        </div>
        <p className="text-xl text-muted-foreground">
          Real-time analytics and insights for task performance, team productivity, and business impact
        </p>
      </div>

      {/* Real-time Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                <p className="text-3xl font-bold text-blue-600">247</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% from last week
                </p>
              </div>
              <Target className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">34</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  +8 from yesterday
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-orange-600">8</p>
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  -3 from yesterday
                </p>
              </div>
              <AlertCircle className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Generated</p>
                <p className="text-3xl font-bold text-purple-600">184</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  97.8% accuracy
                </p>
              </div>
              <Bot className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Task Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Task Performance Trends
            </CardTitle>
            <CardDescription>
              7-day task completion and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <span className="font-medium">Completion Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                  <span className="text-sm font-bold text-green-600">94%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <span className="font-medium">On-Time Delivery</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '91%'}}></div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">91%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <span className="font-medium">Quality Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '96%'}}></div>
                  </div>
                  <span className="text-sm font-bold text-purple-600">4.8/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Performance
            </CardTitle>
            <CardDescription>
              Individual and team productivity metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">ST</span>
                  </div>
                  <div>
                    <p className="font-medium">Sales Team</p>
                    <p className="text-xs text-muted-foreground">8 members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">92%</p>
                  <p className="text-xs text-muted-foreground">efficiency</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">SP</span>
                  </div>
                  <div>
                    <p className="font-medium">Support Team</p>
                    <p className="text-xs text-muted-foreground">5 members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">96%</p>
                  <p className="text-xs text-muted-foreground">efficiency</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">AD</span>
                  </div>
                  <div>
                    <p className="font-medium">Admin Team</p>
                    <p className="text-xs text-muted-foreground">10 members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">89%</p>
                  <p className="text-xs text-muted-foreground">efficiency</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Impact & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Revenue Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Revenue Impact
            </CardTitle>
            <CardDescription>
              Financial metrics and revenue protection through tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">₹2.4M</p>
                <p className="text-sm text-muted-foreground">Total Revenue Protected</p>
                <p className="text-xs text-green-600 mt-1">+₹340K this month</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">₹180K</p>
                  <p className="text-xs text-muted-foreground">Cost Savings</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">23%</p>
                  <p className="text-xs text-muted-foreground">ROI Improvement</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              AI Insights & Predictions
            </CardTitle>
            <CardDescription>
              Machine learning analysis and predictive insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">AI Accuracy</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">97.8%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Tasks correctly prioritized and assigned</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Success Rate</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">92.1%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">AI-generated tasks completed successfully</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Prediction Accuracy</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">89.5%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Deadline and resource predictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Response Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-600 mb-2">2.3h</p>
              <p className="text-sm text-muted-foreground mb-4">Average Response Time</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Critical Tasks</span>
                  <span className="font-medium">0.5h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>High Priority</span>
                  <span className="font-medium">1.2h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Standard Tasks</span>
                  <span className="font-medium">3.1h</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Task Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">2.3</p>
              <p className="text-sm text-muted-foreground mb-4">Average Days to Complete</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Quick Tasks</span>
                  <span className="font-medium">0.5 days</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Standard</span>
                  <span className="font-medium">2.1 days</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Complex</span>
                  <span className="font-medium">5.2 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">4.8</p>
              <p className="text-sm text-muted-foreground mb-4">Average Quality Rating</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>5 Stars</span>
                  <span className="font-medium">72%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>4 Stars</span>
                  <span className="font-medium">21%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>3 Stars or Below</span>
                  <span className="font-medium">7%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Updates */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time task updates and system activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Task completed: "Follow up with high-value client ABC Corp"</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago • Revenue impact: ₹150K protected</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">AI generated 3 new tasks for quotation follow-up</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago • Assigned to Sales Team</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">High priority task overdue: "Payment follow-up XYZ Ltd"</p>
                  <p className="text-xs text-muted-foreground">8 minutes ago • Auto-escalated to manager</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 