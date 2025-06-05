'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  TrendingUp, 
  DollarSign,
  Bell,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  role: string
  department: string
  avatar?: string
}

interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'escalated'
  due_date: string
  client_name: string
  estimated_value: number
  business_impact: string
  ai_reasoning: string
  assigned_to: string
  assigned_employee_id: string
  created_at: string
  completion_notes?: string
  escalation_level: number
  last_updated: string
}

interface EscalationRule {
  id: string
  task_type: string
  priority: string
  escalation_hours: number
  escalate_to: string
  notification_method: 'email' | 'sms' | 'both'
  active: boolean
}

export default function TaskManagementAdmin() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      // Mock employees data
      const mockEmployees: Employee[] = [
        { id: '1', name: 'Navya N Kumar', role: 'CTO', department: 'SALES' },
        { id: '2', name: 'Vikas Alagarsamy', role: 'SEO', department: 'SALES' },
        { id: '3', name: 'Sales Manager', role: 'Manager', department: 'SALES' }
      ]

      // Mock tasks with escalation info
      const mockTasks: Task[] = [
        {
          id: 'task-001',
          title: 'Review and approve quotation for Tamil',
          description: 'Review the ₹33,000 quotation for Tamil and approve for sending.',
          priority: 'medium',
          status: 'overdue',
          due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          client_name: 'Tamil',
          estimated_value: 33000,
          business_impact: 'Revenue Protection: ₹33,000 • Sales Pipeline Acceleration',
          ai_reasoning: 'Draft quotation pending approval. Quick approval needed.',
          assigned_to: 'Navya N Kumar (CTO)',
          assigned_employee_id: '1',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          escalation_level: 1,
          last_updated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'task-002',
          title: 'Follow up with Ramya about quotation',
          description: 'Contact Ramya regarding the ₹54,000 quotation.',
          priority: 'high',
          status: 'in_progress',
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          client_name: 'Ramya',
          estimated_value: 54000,
          business_impact: 'Revenue Recovery: ₹54,000 • Deal Closure Risk: High',
          ai_reasoning: 'High-value client requires immediate attention.',
          assigned_to: 'Vikas Alagarsamy (SEO)',
          assigned_employee_id: '2',
          created_at: new Date().toISOString(),
          escalation_level: 0,
          last_updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'task-003',
          title: 'Generate new leads for Q4',
          description: 'Research and generate 10 qualified leads.',
          priority: 'medium',
          status: 'completed',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          client_name: 'Multiple Prospects',
          estimated_value: 150000,
          business_impact: 'Pipeline Growth: ₹150,000 potential',
          ai_reasoning: 'Lead pipeline is low. Proactive generation needed.',
          assigned_to: 'Vikas Alagarsamy (SEO)',
          assigned_employee_id: '2',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completion_notes: 'Successfully generated 12 qualified leads from local businesses.',
          escalation_level: 0,
          last_updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Mock escalation rules
      const mockEscalationRules: EscalationRule[] = [
        { id: '1', task_type: 'approval', priority: 'high', escalation_hours: 4, escalate_to: 'Sales Manager', notification_method: 'both', active: true },
        { id: '2', task_type: 'follow_up', priority: 'urgent', escalation_hours: 2, escalate_to: 'Sales Manager', notification_method: 'email', active: true },
        { id: '3', task_type: 'payment', priority: 'high', escalation_hours: 8, escalate_to: 'Finance Head', notification_method: 'email', active: true }
      ]

      setEmployees(mockEmployees)
      setTasks(mockTasks)
      setEscalationRules(mockEscalationRules)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const reassignTask = async (taskId: string, newEmployeeId: string) => {
    try {
      const employee = employees.find(e => e.id === newEmployeeId)
      if (!employee) return

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              assigned_to: `${employee.name} (${employee.role})`,
              assigned_employee_id: newEmployeeId,
              last_updated: new Date().toISOString()
            }
          : task
      ))
      
      alert(`Task reassigned to ${employee.name}`)
    } catch (error) {
      console.error('Failed to reassign task:', error)
    }
  }

  const escalateTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'escalated' as any,
              escalation_level: task.escalation_level + 1,
              last_updated: new Date().toISOString()
            }
          : task
      ))
      
      alert('Task escalated to management')
    } catch (error) {
      console.error('Failed to escalate task:', error)
    }
  }

  const sendReminder = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      // Simulate sending reminder
      alert(`Reminder sent to ${task.assigned_to} about: ${task.title}`)
    } catch (error) {
      console.error('Failed to send reminder:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'escalated': return 'bg-purple-100 text-purple-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus
    const employeeMatch = filterEmployee === 'all' || task.assigned_employee_id === filterEmployee
    return statusMatch && employeeMatch
  })

  const overdueTasks = tasks.filter(t => t.status === 'overdue')
  const escalatedTasks = tasks.filter(t => t.status === 'escalated')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const totalRevenue = tasks.reduce((sum, task) => sum + task.estimated_value, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Management Control Center</h1>
          <p className="text-gray-600">Full oversight and control of team tasks and performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="destructive" className="text-sm">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {overdueTasks.length} Overdue
          </Badge>
          <Badge variant="outline" className="text-sm bg-purple-100 text-purple-800">
            <Bell className="w-4 h-4 mr-1" />
            {escalatedTasks.length} Escalated
          </Badge>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Team</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{Math.round((completedTasks.length / tasks.length) * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue at Risk</p>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Task Overview</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="escalations">Escalation Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <div className="flex space-x-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={loadAdminData}>
              Refresh Data
            </Button>
          </div>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTasks.map((task) => (
              <Card key={task.id} className={`border-l-4 ${getPriorityColor(task.priority)} ${task.status === 'overdue' ? 'bg-red-50' : task.status === 'escalated' ? 'bg-purple-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{task.client_name}</p>
                      <p className="text-xs text-gray-500">Assigned to: {task.assigned_to}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        ₹{task.estimated_value.toLocaleString()}
                      </Badge>
                      {task.escalation_level > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Escalation Level {task.escalation_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-700 mb-3">{task.description}</p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Due:</strong> {new Date(task.due_date).toLocaleString()}</p>
                    <p><strong>Last Updated:</strong> {new Date(task.last_updated).toLocaleString()}</p>
                    <p><strong>Business Impact:</strong> {task.business_impact}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Select onValueChange={(value) => reassignTask(task.id, value)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue placeholder="Reassign" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button size="sm" variant="outline" onClick={() => sendReminder(task.id)}>
                      <Bell className="w-3 h-3 mr-1" />
                      Remind
                    </Button>
                    
                    {task.status !== 'escalated' && task.status !== 'completed' && (
                      <Button size="sm" variant="destructive" onClick={() => escalateTask(task.id)}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Escalate
                      </Button>
                    )}
                    
                    <Button size="sm" variant="ghost" onClick={() => setSelectedTask(task)}>
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {employees.map((employee) => {
              const employeeTasks = tasks.filter(t => t.assigned_employee_id === employee.id)
              const completedCount = employeeTasks.filter(t => t.status === 'completed').length
              const overdueCount = employeeTasks.filter(t => t.status === 'overdue').length
              const completionRate = employeeTasks.length > 0 ? (completedCount / employeeTasks.length) * 100 : 0

              return (
                <Card key={employee.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{employee.name}</CardTitle>
                        <p className="text-sm text-gray-600">{employee.role} - {employee.department}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Tasks</span>
                        <Badge>{employeeTasks.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completed</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">{completedCount}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Overdue</span>
                        <Badge variant="outline" className={overdueCount > 0 ? 'bg-red-100 text-red-800' : ''}>{overdueCount}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completion Rate</span>
                        <Badge variant="outline">{completionRate.toFixed(1)}%</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="escalations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Escalation Rules Management</CardTitle>
              <p className="text-sm text-gray-600">Configure automatic escalation rules for overdue tasks</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {escalationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <Badge className={getPriorityColor(rule.priority)}>
                          {rule.priority.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{rule.task_type}</span>
                        <span className="text-sm text-gray-600">
                          Escalate after {rule.escalation_hours}h to {rule.escalate_to}
                        </span>
                        <Badge variant="outline">{rule.notification_method}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={rule.active ? "default" : "secondary"}>
                        {rule.active ? "Active" : "Inactive"}
                      </Badge>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4">Add New Rule</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  📊 Analytics charts would be displayed here
                  <br />
                  <small>Task completion rates, revenue impact, team performance over time</small>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Protection Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Revenue at Risk</span>
                    <span className="font-bold">₹{totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protected (Completed Tasks)</span>
                    <span className="font-bold text-green-600">₹{completedTasks.reduce((sum, task) => sum + task.estimated_value, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>At Risk (Overdue Tasks)</span>
                    <span className="font-bold text-red-600">₹{overdueTasks.reduce((sum, task) => sum + task.estimated_value, 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Task Details</h2>
                <Button variant="ghost" onClick={() => setSelectedTask(null)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedTask.title}</h3>
                  <p className="text-gray-600">{selectedTask.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Client:</strong> {selectedTask.client_name}
                  </div>
                  <div>
                    <strong>Value:</strong> ₹{selectedTask.estimated_value.toLocaleString()}
                  </div>
                  <div>
                    <strong>Priority:</strong> {selectedTask.priority}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedTask.status}
                  </div>
                  <div>
                    <strong>Due Date:</strong> {new Date(selectedTask.due_date).toLocaleString()}
                  </div>
                  <div>
                    <strong>Assigned To:</strong> {selectedTask.assigned_to}
                  </div>
                </div>
                
                <div>
                  <strong>AI Reasoning:</strong>
                  <p className="text-gray-600 mt-1">{selectedTask.ai_reasoning}</p>
                </div>
                
                <div>
                  <strong>Business Impact:</strong>
                  <p className="text-gray-600 mt-1">{selectedTask.business_impact}</p>
                </div>
                
                {selectedTask.completion_notes && (
                  <div>
                    <strong>Completion Notes:</strong>
                    <p className="text-gray-600 mt-1">{selectedTask.completion_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 