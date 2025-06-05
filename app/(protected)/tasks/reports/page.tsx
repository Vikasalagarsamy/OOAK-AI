import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Target, TrendingUp, Users, Clock, FileText, Calendar, AlertCircle } from "lucide-react"

export default function TaskReportsPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-8 w-8 text-purple-600" />
          <h1 className="text-4xl font-bold tracking-tight">Task Reports & Analytics</h1>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">REPORTS</Badge>
        </div>
        <p className="text-xl text-muted-foreground">
          Comprehensive analytics and insights for task performance, team productivity, and business impact
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                <p className="text-3xl font-bold">247</p>
                <p className="text-sm text-green-600">+12% from last week</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold">94.3%</p>
                <p className="text-sm text-green-600">+2.1% from last month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Protected</p>
                <p className="text-3xl font-bold">₹2.4M</p>
                <p className="text-sm text-green-600">+₹340K this month</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold">2.3h</p>
                <p className="text-sm text-red-600">-0.5h improved</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Performance Reports */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <CardTitle>Performance Reports</CardTitle>
            </div>
            <CardDescription>
              Task completion rates, efficiency metrics, and performance trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Task Completion Rate</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">94.3%</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">On-Time Delivery</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">91.7%</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Quality Score</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">4.8/5</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Analytics */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <CardTitle>Team Analytics</CardTitle>
            </div>
            <CardDescription>
              Individual and team performance metrics across all departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Sales Team</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">92% efficient</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Support Team</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">96% efficient</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Admin Team</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">89% efficient</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Impact */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              <CardTitle>Revenue Impact</CardTitle>
            </div>
            <CardDescription>
              Financial impact and revenue protection through task management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Revenue Protected</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">₹2.4M</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Cost Savings</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">₹180K</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">ROI Improvement</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">+23%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Analysis */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-orange-600" />
              <CardTitle>Time Analysis</CardTitle>
            </div>
            <CardDescription>
              Task duration, response times, and scheduling optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Avg Task Duration</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">2.3 days</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Response Time</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">2.3 hours</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Overdue Tasks</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">3.2%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-indigo-600" />
              <CardTitle>AI Insights</CardTitle>
            </div>
            <CardDescription>
              Machine learning insights and predictive analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">AI Accuracy</span>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">97.8%</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Auto-Generated</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">184 tasks</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Success Rate</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">92.1%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Integration */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-cyan-600" />
              <CardTitle>Calendar Reports</CardTitle>
            </div>
            <CardDescription>
              Schedule adherence, deadline management, and calendar optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Schedule Adherence</span>
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">91.4%</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Deadline Met</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">94.7%</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Calendar Utilization</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">87.3%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-gray-600" />
              <CardTitle>Export Options</CardTitle>
            </div>
            <CardDescription>
              Download detailed reports in various formats for further analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium">PDF Report</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Excel Export</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Custom Report</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Report Activity</CardTitle>
            <CardDescription>Latest report generations and exports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Monthly Performance Report</p>
                    <p className="text-sm text-muted-foreground">Generated 2 hours ago</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Ready</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Team Analytics Export</p>
                    <p className="text-sm text-muted-foreground">Generated yesterday</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Downloaded</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 