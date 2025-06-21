'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Clock, 
  CheckCircle, 
  Play, 
  User, 
  DollarSign,
  Calendar,
  Target,
  MessageSquare,
  Filter,
  ArrowRight,
  MoreHorizontal,
  TrendingUp,
  Users,
  Brain,
  Zap,
  Award,
  Activity,
  Search,
  RefreshCw,
  AlertTriangle,
  Timer,
  Briefcase,
  Building,
  Phone,
  Mail,
  MapPin,
  Star,
  Bell,
  Settings,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Archive
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  due_date: string
  client_name: string
  estimated_value: number
  business_impact: string
  ai_reasoning: string
  assigned_to: string
  created_at: string
  completion_notes?: string
  lead_id?: number
  quotation_id?: number
  quotation_slug?: string
  department?: string
  estimated_hours?: number
  actual_hours?: number
}

export default function OrganizationalTaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedView, setSelectedView] = useState('overview')

  // Load tasks
  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const aiTasks = await response.json()
        const transformedTasks: Task[] = aiTasks.map((task: any) => ({
          id: task.id.toString(),
          title: task.task_title || task.title,
          description: task.task_description || task.description || '',
          priority: task.priority?.toLowerCase() || 'medium',
          status: task.status?.toLowerCase() === 'pending' ? 'pending' : 
                  task.status?.toLowerCase() === 'in_progress' ? 'in_progress' :
                  task.status?.toLowerCase() === 'completed' ? 'completed' : 'pending',
          due_date: task.due_date || new Date().toISOString(),
          client_name: task.client_name || 'Unknown Client',
          estimated_value: task.estimated_value || 0,
          business_impact: task.business_impact || 'Standard priority',
          ai_reasoning: task.ai_reasoning || 'System generated task',
          assigned_to: task.assigned_to || 'Team',
          created_at: task.created_at || new Date().toISOString(),
          completion_notes: task.metadata?.completion_notes || '',
          lead_id: task.lead_id,
          quotation_id: task.quotation_id,
          quotation_slug: task.quotation_slug,
          department: task.department || 'Sales',
          estimated_hours: task.estimated_hours || 2,
          actual_hours: task.actual_hours || 0
        }))
        setTasks(transformedTasks)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update task status
  const updateTaskStatus = async (taskId: string, status: string, notes: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          completion_notes: notes,
          updated_by: 'Employee',
          actual_hours: status === 'completed' ? 2 : null
        })
      })

      if (response.ok) {
        await loadTasks()
        setShowUpdateDialog(false)
        setSelectedTask(null)
        setNewStatus('')
        setCompletionNotes('')
      } else {
        const error = await response.json()
        alert(`Error: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Error updating task')
    } finally {
      setLoading(false)
    }
  }

  // Quick status update
  const quickStatusUpdate = (task: Task, newStatus: string) => {
    updateTaskStatus(task.id, newStatus, '')
  }

  // Open update dialog
  const openUpdateDialog = (task: Task) => {
    setSelectedTask(task)
    setNewStatus('')
    setCompletionNotes('')
    setShowUpdateDialog(true)
  }

  useEffect(() => {
    loadTasks()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    const matchesDepartment = filterDepartment === 'all' || task.department === filterDepartment
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment
  })

  // Group tasks by status
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending')
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress')
  const completedTasks = filteredTasks.filter(t => t.status === 'completed')
  const overdueTasks = filteredTasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed')

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate statistics
  const stats = {
    total: tasks.length,
    pending: pendingTasks.length,
    inProgress: inProgressTasks.length,
    completed: completedTasks.length,
    overdue: overdueTasks.length,
    totalValue: tasks.reduce((sum, task) => sum + task.estimated_value, 0),
    completedValue: completedTasks.reduce((sum, task) => sum + task.estimated_value, 0),
    productivity: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    avgCompletionTime: completedTasks.length > 0 ? 
      completedTasks.reduce((sum, task) => sum + (task.actual_hours || 2), 0) / completedTasks.length : 0
  }

  // Department breakdown
  const departments = [...new Set(tasks.map(t => t.department || 'Sales'))]
  const departmentStats = departments.map(dept => ({
    name: dept,
    total: tasks.filter(t => t.department === dept).length,
    completed: tasks.filter(t => t.department === dept && t.status === 'completed').length,
    pending: tasks.filter(t => t.department === dept && t.status === 'pending').length,
    inProgress: tasks.filter(t => t.department === dept && t.status === 'in_progress').length
  }))

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString()
    }
  }

  // Check if task is overdue
  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - AI Boss Control Center */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-6 shadow-lg">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">AI Task Command Center</h1>
                  <p className="text-blue-200">Organizational Workforce Management System</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-blue-800 bg-opacity-50 px-4 py-2 rounded-lg">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-sm">AI Status: Active & Monitoring</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadTasks} disabled={loading} variant="outline" className="bg-white text-blue-900 hover:bg-blue-50">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Syncing...' : 'Refresh'}
              </Button>
              <div className="flex items-center space-x-2 bg-blue-800 bg-opacity-50 px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Last Updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto p-6 space-y-6">
        {/* AI Insights & Statistics Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Statistics */}
          <div className="lg:col-span-8">
            <Card className="h-full shadow-lg border-l-4 border-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <CardTitle className="text-xl">AI Workforce Analytics</CardTitle>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Real-time</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                    <div className="text-xs text-gray-500">AI Allocated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                    <div className="text-xs text-gray-500">Awaiting Action</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{stats.inProgress}</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                    <div className="text-xs text-gray-500">Active Work</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{stats.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-xs text-gray-500">Delivered</div>
                  </div>
                </div>
                
                {/* Productivity Metrics */}
                <div className="grid grid-cols-3 gap-6 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-2xl font-bold text-green-600">{stats.productivity}%</span>
                    </div>
                    <div className="text-sm text-gray-600">Productivity Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold text-blue-600">₹{(stats.totalValue / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="text-sm text-gray-600">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Timer className="w-5 h-5 text-purple-500 mr-2" />
                      <span className="text-2xl font-bold text-purple-600">{stats.avgCompletionTime.toFixed(1)}h</span>
                    </div>
                    <div className="text-sm text-gray-600">Avg Completion</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Alerts & Priorities */}
          <div className="lg:col-span-4">
            <Card className="h-full shadow-lg border-l-4 border-red-500">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <CardTitle className="text-xl">AI Alerts</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.overdue > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-red-800">Overdue Tasks</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600 mb-1">{stats.overdue}</div>
                    <div className="text-sm text-red-700">Require immediate attention</div>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">AI Recommendation</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    Focus on high-priority tasks first. {stats.pending} tasks need assignment.
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800">Performance</span>
                  </div>
                  <div className="text-sm text-green-700">
                    Great job! {stats.productivity}% productivity rate achieved.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Department Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building className="w-6 h-6 text-purple-600" />
                <CardTitle className="text-xl">Department Overview</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{departments.length} Departments Active</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {departmentStats.map((dept) => (
                <div key={dept.name} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                    <Badge variant="outline">{dept.total}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium text-green-600">{dept.completed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">In Progress</span>
                      <span className="font-medium text-blue-600">{dept.inProgress}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-medium text-yellow-600">{dept.pending}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters & Search */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Filter className="w-6 h-6 text-gray-600" />
              <CardTitle className="text-xl">Task Filters & Search</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks, clients, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterPriority('all')
                  setFilterDepartment('all')
                }}>
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Management Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Briefcase className="w-6 h-6 text-gray-600" />
                <CardTitle className="text-xl">Active Task Management</CardTitle>
                <Badge variant="outline">{filteredTasks.length} tasks</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Archive className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12 pl-6"></TableHead>
                    <TableHead className="font-semibold min-w-[300px]">Task Details</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Value</TableHead>
                    <TableHead className="font-semibold">Assigned To</TableHead>
                    <TableHead className="font-semibold text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow 
                      key={task.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isOverdue(task.due_date, task.status) ? 'bg-red-50 border-l-4 border-red-500' : ''
                      }`}
                    >
                      <TableCell className="pl-6">
                        <div className={`w-4 h-4 rounded-full ${getPriorityColor(task.priority)}`}></div>
                      </TableCell>
                      
                      <TableCell className="min-w-[300px]">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-600 line-clamp-2">{task.description}</div>
                          <div className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
                            AI: {task.ai_reasoning.substring(0, 50)}...
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{task.client_name}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {task.department}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs font-medium`}>
                          {task.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`${getStatusColor(task.status)} text-xs border`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className={`text-sm ${isOverdue(task.due_date, task.status) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(task.due_date)}</span>
                          </div>
                          {isOverdue(task.due_date, task.status) && (
                            <div className="text-xs text-red-500 mt-1">OVERDUE</div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                          ₹{task.estimated_value.toLocaleString()}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                            {task.assigned_to.charAt(0)}
                          </div>
                          <span className="text-sm">{task.assigned_to}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end space-x-2">
                          {task.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => quickStatusUpdate(task, 'in_progress')}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          )}
                          
                          {task.status === 'in_progress' && (
                            <Button 
                              size="sm" 
                              onClick={() => openUpdateDialog(task)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete
                            </Button>
                          )}

                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openUpdateDialog(task)}
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Update
                          </Button>

                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg">No tasks found matching your criteria</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Task Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Update Task: {selectedTask?.title}</DialogTitle>
            </DialogHeader>
            
            {selectedTask && (
              <div className="space-y-6">
                {/* Task Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Task Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Client:</strong> {selectedTask.client_name}</p>
                      <p><strong>Department:</strong> {selectedTask.department}</p>
                      <p><strong>Priority:</strong> {selectedTask.priority.toUpperCase()}</p>
                      <p><strong>Current Status:</strong> {selectedTask.status.replace('_', ' ').toUpperCase()}</p>
                      <p><strong>Due Date:</strong> {formatDate(selectedTask.due_date)}</p>
                      <p><strong>Estimated Value:</strong> ₹{selectedTask.estimated_value.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Brain className="w-4 h-4 mr-2" />
                      AI Analysis
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Business Impact:</strong> {selectedTask.business_impact}</p>
                      <p><strong>AI Reasoning:</strong> {selectedTask.ai_reasoning}</p>
                      <p><strong>Assigned To:</strong> {selectedTask.assigned_to}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Task Description</h4>
                  <p className="text-sm text-gray-700">{selectedTask.description}</p>
                </div>

                {/* Status Update */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Update Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTask.status !== 'in_progress' && (
                          <SelectItem value="in_progress">In Progress</SelectItem>
                        )}
                        {selectedTask.status !== 'completed' && (
                          <SelectItem value="completed">Completed</SelectItem>
                        )}
                        {selectedTask.status !== 'pending' && (
                          <SelectItem value="pending">Pending</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {newStatus === 'completed' ? 'Completion Notes' : 'Update Notes'}
                    </label>
                    <Textarea
                      placeholder={
                        newStatus === 'completed' 
                          ? "Describe what was completed, any key outcomes, and next steps..."
                          : "Add notes about this status change and any relevant updates..."
                      }
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={5}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUpdateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => updateTaskStatus(selectedTask.id, newStatus, completionNotes)}
                    disabled={!newStatus || loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Updating...' : 'Update Task'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 