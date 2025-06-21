"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Target, Users, TrendingUp, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import TaskReassignModal from "./components/task-reassign-modal"
import TaskDetailsModal from "./components/task-details-modal"

interface Task {
  id: number
  task_title: string
  task_description: string
  task_type?: string
  priority: string
  status: string
  due_date: string
  category: string
  assigned_to: string
  assigned_by: string
  assigned_to_employee_id: number
  lead_id?: number
  metadata: any
  completed_at: string | null
  created_at: string
  updated_at: string
}

export default function TaskManagementPage() {
  const [activeTab, setActiveTab] = useState("Task Overview")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedEmployee, setSelectedEmployee] = useState("All Employees")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsTask, setDetailsTask] = useState<Task | null>(null)

  // Load tasks from API
  const loadTasks = async () => {
    try {
      setLoading(true)
      console.log('📋 [Admin] Loading tasks...')
      console.log('🍪 [Admin] Document cookies:', document.cookie)
      
      const response = await fetch('/api/tasks', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📋 [Admin] Response status:', response.status)
      console.log('📋 [Admin] Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        console.log('❌ [Admin] API Response not OK:', response.status, response.statusText)
        
        try {
          const errorData = await response.json()
          console.log('❌ [Admin] Error response data:', errorData)
        } catch (e) {
          console.log('❌ [Admin] Could not parse error response')
        }
        
        if (response.status === 401) {
          // User is not authenticated, redirect to login
          window.location.href = '/login?reason=unauthenticated&from=/admin/task-management'
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📋 [Admin] Raw API response:', data)
      
      // Ensure data is always an array
      const tasksArray = Array.isArray(data) ? data : []
      console.log('📋 [Admin] Tasks array length:', tasksArray.length)
      
      setTasks(tasksArray)
      setLastRefresh(new Date())
      console.log('✅ [Admin] Loaded tasks:', tasksArray.length, 'tasks')
    } catch (error) {
      console.error('❌ [Admin] Error loading tasks:', error)
      // Set empty array on error to prevent filter issues
      setTasks([])
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load tasks on component mount and set up auto-refresh
  useEffect(() => {
    loadTasks()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handler functions
  const handleTabChange = (tab: string) => setActiveTab(tab)
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEmployee(e.target.value)
  
  const handleReassign = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setReassignModalOpen(true)
    }
  }

  const handleReassignSuccess = () => {
    // Refresh the tasks list after successful reassignment
    loadTasks()
  }

  const handleRemind = async (taskId: number) => {
    console.log("🔔 Sending reminder for task:", taskId)
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/remind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "✅ Reminder Sent Successfully",
          description: `${result.message} - ${result.details.urgency}`,
          duration: 5000
        })
        console.log('✅ Reminder sent successfully:', result)
      } else {
        toast({
          title: "❌ Failed to Send Reminder",
          description: result.error,
          variant: "destructive",
          duration: 5000
        })
        console.error('❌ Reminder failed:', result)
      }
    } catch (error) {
      console.error('❌ Error sending reminder:', error)
      toast({
        title: "❌ Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    }
  }

  const handleEscalate = (taskId: number) => {
    console.log("Escalating task:", taskId)
    // Add escalation logic here
  }

  const handleDetails = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setDetailsTask(task)
      setDetailsModalOpen(true)
    }
  }

  const handleRefreshData = () => {
    console.log("Refreshing data...")
    loadTasks()
  }

  // Check if task is overdue (moved before stats calculation)
  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === 'completed') return false
    const due = new Date(dueDate)
    const now = new Date()
    return due < now && status !== 'completed'
  }

  // Calculate real-time statistics
  const stats = {
    criticalIssues: tasks.filter(t => t.priority === 'urgent' || (t.priority === 'high' && isOverdue(t.due_date, t.status))).length,
    activeTeam: new Set(tasks.map(t => t.assigned_to)).size,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
    revenueAtRisk: tasks
      .filter(t => t.status !== 'completed' && t.metadata?.total_amount)
      .reduce((sum, t) => sum + (t.metadata.total_amount || 0), 0)
  }

  // Filter tasks - exclude completed tasks and fix null error
  const filteredTasks = tasks.filter(task => {
    // Only show pending and in_progress tasks
    if (task.status === 'completed') {
      return false
    }
    
    const statusMatch = selectedStatus === "All Status" || task.status.toLowerCase().includes(selectedStatus.toLowerCase().replace(' ', '_'))
    const employeeMatch = selectedEmployee === "All Employees" || (task.assigned_to && task.assigned_to.includes(selectedEmployee))
    return statusMatch && employeeMatch
  })

  // Get status badge style
  const getStatusBadge = (task: Task) => {
    if (isOverdue(task.due_date, task.status)) {
      return <Badge variant="destructive">OVERDUE</Badge>
    }
    
    switch (task.status) {
      case 'pending':
        return <Badge variant="secondary">PENDING</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">IN_PROGRESS</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">COMPLETED</Badge>
      default:
        return <Badge variant="outline">{task.status.toUpperCase()}</Badge>
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Get unique employees for dropdown - filter out null/undefined
  const uniqueEmployees = Array.from(new Set(tasks.map(t => t.assigned_to).filter(Boolean)))

  const tabs = ["Task Overview", "Team Performance", "Escalation Rules", "Analytics"]

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Task Management Control Center</h1>
          <p className="text-muted-foreground">Full oversight and control of team tasks and performance</p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refresh: 30s
          </p>
          <p className="text-xs text-green-600 mt-1 font-medium">
            🚀 Task Management Optimized: Full administrative oversight enabled
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="h-6">
            {stats.criticalIssues} Critical Issues
          </Badge>
          <Badge variant="secondary" className="h-6">
            {tasks.filter(t => t.status === 'pending').length} Pending
          </Badge>
        </div>
      </div>

      {/* Stats Grid - Real-time data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-sm text-muted-foreground">Critical Issues</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.criticalIssues}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-sm text-muted-foreground">Active Team</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.activeTeam}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-sm text-muted-foreground">Completion Rate</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.completionRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold text-sm text-muted-foreground">Revenue at Risk</h3>
            </div>
            <p className="text-2xl font-bold mt-2">₹{stats.revenueAtRisk.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab 
                ? "bg-background shadow text-foreground" 
                : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Enhanced Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select 
          className="rounded-md border px-3 py-2 text-sm min-w-[120px]"
          value={selectedStatus}
          onChange={handleStatusChange}
        >
          <option>All Status</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Overdue</option>
        </select>
        <select 
          className="rounded-md border px-3 py-2 text-sm min-w-[140px]"
          value={selectedEmployee}
          onChange={handleEmployeeChange}
        >
          <option>All Employees</option>
          {uniqueEmployees.map(employee => (
            <option key={employee} value={employee}>{employee}</option>
          ))}
        </select>
        <Button 
          variant="default"
          onClick={handleRefreshData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      )}

      {/* No Tasks State */}
      {!loading && tasks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No tasks found. Create some tasks to get started!</p>
        </div>
      )}

      {/* Task Cards - Real-time data */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className={`rounded-lg border p-4 ${
            isOverdue(task.due_date, task.status) ? 'bg-rose-50' : 
            task.status === 'in_progress' ? 'bg-orange-100' : 
            task.status === 'completed' ? 'bg-yellow-100' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{task.task_title}</h3>
              {getStatusBadge(task)}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{task.assigned_to}</p>
            <p className="text-sm mb-4">{task.task_description}</p>
            <div className="flex items-center justify-between text-sm">
              <div>
                <p>Due: {formatDate(task.due_date)}</p>
                <p>Last Updated: {formatDate(task.updated_at)}</p>
                <p>Business Impact: {task.metadata?.business_impact || 'Not specified'}</p>
                {task.metadata?.total_amount && (
                  <p>Value: ₹{task.metadata.total_amount.toLocaleString()}</p>
                )}
              </div>
              <div className="flex gap-2">
                {task.status !== 'completed' && (
                  <>
                    {/* Hide Reassign button for quotation approval tasks */}
                    {!['quotation_approval', 'quotation_edit_approval'].includes(task.task_type || '') && (
                      <Button variant="outline" size="sm" onClick={() => handleReassign(task.id)}>Reassign</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleRemind(task.id)}>Remind</Button>
                  </>
                )}
                {isOverdue(task.due_date, task.status) && task.status !== 'completed' && (
                  <Button variant="destructive" size="sm" onClick={() => handleEscalate(task.id)}>Escalate</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleDetails(task.id)}>
                  {task.status === 'completed' ? 'View History' : 'Details'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Real-time task management • Data refreshes automatically every 30 seconds</p>
        <p>Total tasks: {tasks.length} • Filtered: {filteredTasks.length}</p>
      </div>

      {/* Task Reassignment Modal */}
      <TaskReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        task={selectedTask}
        onReassignSuccess={handleReassignSuccess}
      />
      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        task={detailsTask}
      />
    </div>
  )
} 