import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Target, AlertCircle, CheckCircle, Users } from "lucide-react"

export default function TaskCalendarPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-8 w-8 text-cyan-600" />
          <h1 className="text-4xl font-bold tracking-tight">Task Calendar</h1>
          <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">CALENDAR</Badge>
        </div>
        <p className="text-xl text-muted-foreground">
          Calendar view of all tasks with deadlines, assignments, and scheduling capabilities
        </p>
      </div>

      {/* Calendar Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Tasks</p>
                <p className="text-3xl font-bold text-blue-600">12</p>
                <p className="text-sm text-green-600">+3 from yesterday</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold text-purple-600">47</p>
                <p className="text-sm text-blue-600">8 high priority</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-red-600">3</p>
                <p className="text-sm text-red-600">Needs attention</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">89</p>
                <p className="text-sm text-green-600">This month</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Mini Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-600" />
              January 2025
            </CardTitle>
            <CardDescription>Task distribution overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Calendar Grid - Simplified representation */}
              <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                <div className="font-medium">Sun</div>
                <div className="font-medium">Mon</div>
                <div className="font-medium">Tue</div>
                <div className="font-medium">Wed</div>
                <div className="font-medium">Thu</div>
                <div className="font-medium">Fri</div>
                <div className="font-medium">Sat</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {/* First week */}
                <div className="p-2 text-gray-400">29</div>
                <div className="p-2 text-gray-400">30</div>
                <div className="p-2 text-gray-400">31</div>
                <div className="p-2 bg-blue-100 rounded">1</div>
                <div className="p-2 bg-green-100 rounded">2</div>
                <div className="p-2">3</div>
                <div className="p-2">4</div>
                {/* Second week */}
                <div className="p-2">5</div>
                <div className="p-2 bg-red-100 rounded">6</div>
                <div className="p-2 bg-blue-100 rounded">7</div>
                <div className="p-2">8</div>
                <div className="p-2 bg-yellow-100 rounded">9</div>
                <div className="p-2">10</div>
                <div className="p-2">11</div>
                {/* Third week */}
                <div className="p-2">12</div>
                <div className="p-2 bg-purple-100 rounded">13</div>
                <div className="p-2 bg-blue-100 rounded font-bold border-2 border-blue-500">14</div>
                <div className="p-2">15</div>
                <div className="p-2">16</div>
                <div className="p-2">17</div>
                <div className="p-2">18</div>
                {/* Remaining weeks simplified */}
                <div className="p-2">19</div>
                <div className="p-2 bg-green-100 rounded">20</div>
                <div className="p-2">21</div>
                <div className="p-2">22</div>
                <div className="p-2">23</div>
                <div className="p-2">24</div>
                <div className="p-2">25</div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>Regular Tasks</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-100 rounded"></div>
                  <span>Overdue</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <span>High Priority</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Today's Schedule
            </CardTitle>
            <CardDescription>January 14, 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Follow up with ABC Corp</p>
                  <p className="text-xs text-muted-foreground">9:00 AM - High Priority</p>
                  <p className="text-xs text-blue-600">Revenue: ₹150K at risk</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Client meeting preparation</p>
                  <p className="text-xs text-muted-foreground">11:00 AM - Standard</p>
                  <p className="text-xs text-green-600">Assigned: Sales Team</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Quotation review</p>
                  <p className="text-xs text-muted-foreground">2:00 PM - Medium Priority</p>
                  <p className="text-xs text-purple-600">Auto-generated by AI</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Payment follow-up XYZ Ltd</p>
                  <p className="text-xs text-muted-foreground">4:00 PM - OVERDUE</p>
                  <p className="text-xs text-red-600">⚠️ Escalated to manager</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Project milestone review</p>
                  <p className="text-xs text-muted-foreground">Tomorrow, Jan 15</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Contract renewal - DEF Corp</p>
                  <p className="text-xs text-muted-foreground">Jan 16, 2025</p>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800">High</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Monthly report submission</p>
                  <p className="text-xs text-muted-foreground">Jan 18, 2025</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Standard</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Client presentation prep</p>
                  <p className="text-xs text-muted-foreground">Jan 20, 2025</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Low</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Team Workload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Workload
            </CardTitle>
            <CardDescription>Task distribution across team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">JS</span>
                  </div>
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-xs text-muted-foreground">Sales Manager</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">8 tasks</p>
                  <p className="text-xs text-muted-foreground">2 overdue</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">AD</span>
                  </div>
                  <div>
                    <p className="font-medium">Alice Davis</p>
                    <p className="text-xs text-muted-foreground">Account Manager</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">5 tasks</p>
                  <p className="text-xs text-muted-foreground">All on track</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">MJ</span>
                  </div>
                  <div>
                    <p className="font-medium">Mike Johnson</p>
                    <p className="text-xs text-muted-foreground">Support Lead</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">12 tasks</p>
                  <p className="text-xs text-muted-foreground">High volume</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Schedule Insights
            </CardTitle>
            <CardDescription>AI-powered scheduling recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Optimal Schedule</span>
                </div>
                <p className="text-xs text-green-700">
                  Current week schedule is well-balanced with 91% utilization rate
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Recommendation</span>
                </div>
                <p className="text-xs text-yellow-700">
                  Consider redistributing 2 tasks from Mike Johnson to balance workload
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Next Week Preview</span>
                </div>
                <p className="text-xs text-blue-700">
                  AI suggests 6 new tasks based on current pipeline and priorities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Calendar Actions</CardTitle>
            <CardDescription>Manage your tasks and schedule efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Add Task</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="font-medium">Schedule Meeting</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Assign Tasks</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="font-medium">View Overdue</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 