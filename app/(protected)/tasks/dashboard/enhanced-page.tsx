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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  MoreHorizontal
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
}

export default function EnhancedTaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

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
          quotation_slug: task.quotation_slug
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
        await loadTasks() // Refresh tasks
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
  }, [])

  // Filter tasks based on tab and filters
  const getFilteredTasks = (statusFilter?: string) => {
    let filtered = tasks
    
    // Filter by tab
    if (statusFilter) {
      filtered = filtered.filter(t => t.status === statusFilter)
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(t => t.status === activeTab)
    }

    // Apply additional filters
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority)
    }

    return filtered
  }

  // Group tasks by status
  const pendingTasks = getFilteredTasks('pending')
  const inProgressTasks = getFilteredTasks('in_progress')
  const completedTasks = getFilteredTasks('completed')
  const allTasks = getFilteredTasks()

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-blue-500 text-white'
      case 'low': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'completed': return 'bg-green-100 text-green-800 border border-green-300'
      default: return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  // Calculate statistics
  const stats = {
    total: tasks.length,
    pending: pendingTasks.length,
    inProgress: inProgressTasks.length,
    completed: completedTasks.length,
    totalValue: tasks.reduce((sum, task) => sum + task.estimated_value, 0),
    completedValue: completedTasks.reduce((sum, task) => sum + task.estimated_value, 0)
  }

  // Check if task is overdue
  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed'
  }

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Statistics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Task Management</h1>
              <p className="text-gray-600 mt-1">Manage and track your assigned tasks</p>
            </div>
            <Button onClick={loadTasks} disabled={loading} variant="outline">
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Quick Stats - Horizontal */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Priority:</span>
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
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
          </div>
        </div>

        {/* Task Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 bg-gray-100 p-1 rounded-t-lg">
              <TabsTrigger value="all" className="data-[state=active]:bg-white">
                All Tasks ({allTasks.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-white">
                Pending ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="data-[state=active]:bg-white">
                In Progress ({inProgressTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-white">
                Completed ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <TaskListTable 
                tasks={allTasks}
                onQuickAction={quickStatusUpdate}
                onUpdate={openUpdateDialog}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                isOverdue={isOverdue}
                formatDate={formatDate}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
              <TaskListTable 
                tasks={pendingTasks}
                onQuickAction={quickStatusUpdate}
                onUpdate={openUpdateDialog}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                isOverdue={isOverdue}
                formatDate={formatDate}
                showPendingActions={true}
              />
            </TabsContent>

            <TabsContent value="in_progress" className="mt-0">
              <TaskListTable 
                tasks={inProgressTasks}
                onQuickAction={quickStatusUpdate}
                onUpdate={openUpdateDialog}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                isOverdue={isOverdue}
                formatDate={formatDate}
                showProgressActions={true}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <TaskListTable 
                tasks={completedTasks}
                onQuickAction={quickStatusUpdate}
                onUpdate={openUpdateDialog}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                isOverdue={isOverdue}
                formatDate={formatDate}
                showCompletedActions={true}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Update Task Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Update Task: {selectedTask?.title}</DialogTitle>
            </DialogHeader>
            
            {selectedTask && (
              <div className="space-y-6">
                {/* Task Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Task Details</h4>
                  <p className="text-sm text-gray-600 mb-2">{selectedTask.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <p><strong>Client:</strong> {selectedTask.client_name}</p>
                    <p><strong>Value:</strong> ₹{selectedTask.estimated_value.toLocaleString()}</p>
                    <p><strong>Priority:</strong> {selectedTask.priority.toUpperCase()}</p>
                    <p><strong>Current Status:</strong> {selectedTask.status.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>

                {/* Status Update */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">New Status</label>
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
                          ? "Describe what was completed and any key outcomes..."
                          : "Add notes about this status change..."
                      }
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUpdateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => updateTaskStatus(selectedTask.id, newStatus, completionNotes)}
                    disabled={!newStatus || loading}
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

// Task List Table Component
function TaskListTable({ 
  tasks, 
  onQuickAction, 
  onUpdate, 
  getPriorityColor, 
  getStatusColor,
  isOverdue,
  formatDate,
  showPendingActions = false,
  showProgressActions = false,
  showCompletedActions = false
}: {
  tasks: Task[]
  onQuickAction: (task: Task, action: string) => void
  onUpdate: (task: Task) => void
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: string) => string
  isOverdue: (date: string, status: string) => boolean
  formatDate: (date: string) => string
  showPendingActions?: boolean
  showProgressActions?: boolean
  showCompletedActions?: boolean
}) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>No tasks found</p>
      </div>
    )
  }

  return (
    <div className="border-t">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12"></TableHead>
            <TableHead className="font-semibold">Task</TableHead>
            <TableHead className="font-semibold">Client</TableHead>
            <TableHead className="font-semibold">Priority</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Due Date</TableHead>
            <TableHead className="font-semibold">Value</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow 
              key={task.id} 
              className={`hover:bg-gray-50 ${isOverdue(task.due_date, task.status) ? 'bg-red-50' : ''}`}
            >
              <TableCell>
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
              </TableCell>
              
              <TableCell className="max-w-xs">
                <div>
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div className="text-sm text-gray-600 truncate">{task.description.substring(0, 80)}...</div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm">{task.client_name}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge className={`${getPriorityColor(task.priority)} text-xs font-medium`}>
                  {task.priority.toUpperCase()}
                </Badge>
              </TableCell>
              
              <TableCell>
                <Badge className={`${getStatusColor(task.status)} text-xs`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className={`text-sm ${isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                  {formatDate(task.due_date)}
                  {isOverdue(task.due_date, task.status) && ' (Overdue)'}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                  ₹{task.estimated_value.toLocaleString()}
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  {showPendingActions && (
                    <Button 
                      size="sm" 
                      onClick={() => onQuickAction(task, 'in_progress')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  )}
                  
                  {showProgressActions && (
                    <Button 
                      size="sm" 
                      onClick={() => onUpdate(task)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Button>
                  )}

                  {showCompletedActions && task.lead_id && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Quote
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onUpdate(task)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Update
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 