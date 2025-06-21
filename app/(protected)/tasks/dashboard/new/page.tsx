'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
  Activity,
  FileText,
  Zap,
  CloudUpload,
  Mic,
  Edit,
  Phone
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'


// Task interfaces
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
  quotation_approval_status?: string
  quotation_workflow_status?: string
  metadata?: {
    sequence_step?: number
    quotation_number?: string
    is_sequential?: boolean
    sequence_total_steps?: number
    completion_notes?: string
    [key: string]: any
  }
  client_phone?: string
}

export default function EmployeeDashboard() {
  // Task state
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null)

  // Call Upload state
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    clientName: '',
    taskId: 'none',
    notes: ''
  })
  const [uploadHistory, setUploadHistory] = useState<any[]>([])

  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState('tasks')

  useEffect(() => {
    loadTasks()
    loadUploadHistory()
  }, [])

  // =================== TASK FUNCTIONS ===================

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const aiTasks = await response.json()
        
        // Transform tasks using pre-loaded quotation data (no additional API calls needed!)
        const transformedTasks: Task[] = aiTasks.map((task: any) => {
          const baseTask = {
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
            quotation_slug: task.quotation_slug || null,
            // Use pre-loaded quotation data from optimized API
            quotation_approval_status: task.quotation_approval_status || null,
            quotation_workflow_status: task.quotation_workflow_status || null,
            metadata: task.metadata || {},
            client_phone: task.client_phone
          }

          console.log(`Task ${task.id}: status=${baseTask.status}, lead_id=${baseTask.lead_id}, quotation_id=${baseTask.quotation_id}`)
          return baseTask
        })
        
        setTasks(transformedTasks)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

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
        
        toast({
          title: "Success",
          description: "Task updated successfully!"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.details || error.error || "Failed to update task",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const quickStatusUpdate = (task: Task, newStatus: string) => {
    updateTaskStatus(task.id, newStatus, '')
  }

  const openUpdateDialog = (task: Task) => {
    setSelectedTask(task)
    setNewStatus('')
    setCompletionNotes('')
    setShowUpdateDialog(true)
  }

  const generateQuote = async (task: Task) => {
    try {
      setLoading(true)
      
      toast({
        title: "Redirecting to Quotation Creation",
        description: "Opening comprehensive quotation form for " + task.client_name + "...",
      })

      // Validate required data
      if (!task.lead_id) {
        toast({
          title: "Error",
          description: "Lead ID is required to generate quotation. Please ensure the task is linked to a lead.",
          variant: "destructive"
        })
        return
      }

      // Prepare the quotation form URL with pre-filled data (same pattern as follow-ups)
      const quotationFormUrl = new URL('/sales/quotations/generate', window.location.origin)
      
      // Add lead and task context as URL parameters (following existing pattern)
      quotationFormUrl.searchParams.set('leadId', task.lead_id.toString())
      quotationFormUrl.searchParams.set('taskId', task.id)
      
      // Add task context parameters to pre-fill the form
      quotationFormUrl.searchParams.set('clientName', task.client_name)
      quotationFormUrl.searchParams.set('source', 'task_completion')
      
      // Create AI context object with task information
      const taskContext = {
        task_title: task.title,
        client_requirements: task.description || 'Photography services required',
        budget_range: `₹${task.estimated_value.toLocaleString()} - ₹${(task.estimated_value * 1.2).toLocaleString()}`,
        project_scope: task.description || 'Professional photography services',
        timeline: 'To be discussed with client',
        urgency: task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'asap' : 'standard',
        estimated_value: task.estimated_value,
        business_impact: task.business_impact,
        completion_notes: task.completion_notes || 'Task completed successfully',
        task_id: task.id,
        task_priority: task.priority
      }
      
      // Add encoded context to URL
      quotationFormUrl.searchParams.set('aiContext', encodeURIComponent(JSON.stringify(taskContext)))

      // Show success message explaining the redirect
      toast({
        title: "Redirecting to Quotation Creation",
        description: `Opening comprehensive quotation form with pre-filled task context. After creating the quotation, it will automatically go through the approval workflow.`,
      })

      // Mark that quotation process was initiated for this task
      try {
        await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metadata: {
              ...task,
              quotation_initiated: true,
              quotation_initiated_at: new Date().toISOString()
            }
          })
        })
      } catch (metadataError) {
        console.warn('Could not update task metadata:', metadataError)
      }

      // Redirect to quotation creation page with pre-filled data
      console.log('🔗 Redirecting to:', quotationFormUrl.toString())
      window.open(quotationFormUrl.toString(), '_blank')

    } catch (error) {
      console.error('Error preparing quotation workflow:', error)
      toast({
        title: "Error",
        description: "Failed to prepare quotation workflow. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // =================== CALL UPLOAD FUNCTIONS ===================

  const loadUploadHistory = async () => {
    try {
      const response = await fetch('/api/call-uploads')
      if (response.ok) {
        const uploads = await response.json()
        setUploadHistory(uploads)
      } else {
        // Fallback to mock data if API fails
        const uploads = [
          { id: 1, client: 'Client Meeting', date: new Date().toISOString(), status: 'Uploaded' },
          { id: 2, client: 'Follow-up Call', date: new Date(Date.now() - 86400000).toISOString(), status: 'Uploaded' }
        ]
        setUploadHistory(uploads)
      }
    } catch (error) {
      console.error('Error loading upload history:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a']
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an audio file (MP3, WAV, M4A)",
          variant: "destructive"
        })
        return
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 50MB",
          variant: "destructive"
        })
        return
      }
      
      setSelectedFile(file)
    }
  }

  const uploadCall = async () => {
    if (!selectedFile || !uploadForm.clientName) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter client name",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('audio', selectedFile)
      formData.append('clientName', uploadForm.clientName)
      formData.append('taskId', uploadForm.taskId || '')
      formData.append('notes', uploadForm.notes || '')

      const response = await fetch('/api/call-upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message || "Call uploaded successfully!"
        })
        
        // Reset form
        setSelectedFile(null)
        setUploadForm({ clientName: '', taskId: 'none', notes: '' })
        
        // Reset file input
        const fileInput = document.getElementById('call-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        // Refresh upload history
        await loadUploadHistory()
      } else {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.error || errorData?.details || `Upload failed with status ${response.status}`
        console.error('Upload failed:', errorMessage, errorData)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload call. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // =================== UTILITY FUNCTIONS ===================

  const getFilteredTasks = (statusFilter?: string) => {
    let filtered = tasks
    
    if (statusFilter) {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority)
    }

    return filtered
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-blue-500 text-white'
      case 'low': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'completed': return 'bg-green-100 text-green-800 border border-green-300'
      default: return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'completed') return false
    return new Date(dueDate) < new Date()
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  // Calculate statistics
  const pendingTasks = getFilteredTasks('pending')
  const inProgressTasks = getFilteredTasks('in_progress')
  const completedTasks = getFilteredTasks('completed')

  const taskStats = {
    total: tasks.length,
    pending: pendingTasks.length,
    inProgress: inProgressTasks.length,
    completed: completedTasks.length,
    totalValue: tasks.reduce((sum, task) => sum + task.estimated_value, 0),
    completedValue: completedTasks.reduce((sum, task) => sum + task.estimated_value, 0)
  }

  // Call client function
  const handleCallClient = (phoneNumber: string, clientName: string, taskId?: string) => {
    // Clean and format phone number
    let cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Add country code if not present
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone
    }
    
    // Format for tel: protocol
    const telUrl = `tel:+${cleanPhone}`
    
    // Open dialer
    window.location.href = telUrl
    
    // Show confirmation toast with enhanced info
    toast({
      title: "📞 Initiating Call",
      description: `Calling ${clientName} at +${cleanPhone}`,
      duration: 3000,
    })
    
    // Log call initiation for analytics (optional)
    if (taskId) {
      console.log(`📞 Call initiated for task ${taskId}: ${clientName} at +${cleanPhone}`)
    }
  }

  // WhatsApp function for enhanced communication
  const handleWhatsAppClient = (phoneNumber: string, clientName: string, taskId?: string) => {
    // Clean and format phone number
    let cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Add country code if not present
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone
    }
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hi ${clientName}, this is regarding your photography requirements. How can I assist you today?`
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank')
    
    // Show confirmation toast
    toast({
      title: "💬 Opening WhatsApp",
      description: `Starting WhatsApp chat with ${clientName}`,
      duration: 3000,
    })
    
    // Log WhatsApp initiation for analytics (optional)
    if (taskId) {
      console.log(`💬 WhatsApp initiated for task ${taskId}: ${clientName} at +${cleanPhone}`)
    }
  }

  // Start task function
  const handleStartTask = async (taskId: string) => {
    try {
      setStartingTaskId(taskId)
      await quickStatusUpdate({ id: taskId } as Task, 'in_progress')
      toast({
        title: "Task Started",
        description: "Task status updated to in progress",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start task",
        variant: "destructive"
      })
    } finally {
      setStartingTaskId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Employee Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage your tasks and upload call recordings</p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Calls
            </TabsTrigger>
          </TabsList>

          {/* TASK MANAGEMENT TAB */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Task Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{taskStats.total}</div>
                  <p className="text-xs text-blue-600">
                    {taskStats.pending} pending, {taskStats.inProgress} in progress
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{taskStats.completed}</div>
                  <p className="text-xs text-green-600">
                    {((taskStats.completed / taskStats.total) * 100 || 0).toFixed(1)}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">₹{taskStats.totalValue.toLocaleString()}</div>
                  <p className="text-xs text-purple-600">
                    ₹{taskStats.completedValue.toLocaleString()} completed
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progress</CardTitle>
                  <Activity className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">
                    {((taskStats.completedValue / taskStats.totalValue) * 100 || 0).toFixed(1)}%
                  </div>
                  <Progress 
                    value={(taskStats.completedValue / taskStats.totalValue) * 100 || 0} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ready for Quote</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-700">
                    {tasks.filter(task => task.status === 'completed' && !task.quotation_id).length}
                  </div>
                  <p className="text-xs text-emerald-600">
                    Completed tasks awaiting quotes
                  </p>
                </CardContent>
              </Card>
            </div>



            {/* Task Filters */}
            <div className="flex gap-4 items-center">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadTasks} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Tasks
              </Button>
            </div>

            {/* Task List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  My Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getFilteredTasks().map((task) => (
                    <Card key={task.id} className="border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          {/* Left Section - Task Info */}
                          <div className="flex-1 space-y-3">
                            {/* Task Title & Status */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  task.status === 'completed' ? 'bg-green-500' :
                                  task.status === 'in_progress' ? 'bg-blue-500' :
                                  task.priority === 'high' ? 'bg-red-500' :
                                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`} />
                                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                  {task.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  task.priority === 'high' ? 'destructive' :
                                  task.priority === 'medium' ? 'default' : 'secondary'
                                } className="text-xs font-medium">
                                  {task.priority?.toUpperCase()}
                                </Badge>
                                <Badge variant={
                                  task.status === 'completed' ? 'default' :
                                  task.status === 'in_progress' ? 'secondary' : 'outline'
                                } className="text-xs font-medium">
                                  {task.status?.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                            </div>

                            {/* Task Description */}
                            <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                              {task.description}
                            </p>

                            {/* Task Meta Info */}
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              {task.client_name && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium text-gray-700">{task.client_name}</span>
                                </div>
                              )}
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                              )}
                              {task.estimated_value && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-semibold text-green-600">₹{task.estimated_value.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Section - Actions */}
                          <div className="flex flex-col items-end gap-3 ml-6">
                            {/* Primary Actions */}
                            <div className="flex items-center gap-2">
                              {task.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => quickStatusUpdate(task, 'in_progress')}
                                  disabled={loading}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                                >
                                  {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <Play className="h-4 w-4 mr-1" />
                                  )}
                                  Start Task
                                </Button>
                              )}
                            </div>

                            {/* Secondary Actions */}
                            <div className="flex items-center gap-2">
                              {/* Enhanced Communication Buttons */}
                              {task.client_phone ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCallClient(task.client_phone!, task.client_name, task.id)}
                                    className="border-green-600 text-green-600 hover:bg-green-50 px-3 py-2 font-medium"
                                  >
                                    <Phone className="h-4 w-4 mr-1" />
                                    Call
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleWhatsAppClient(task.client_phone!, task.client_name, task.id)}
                                    className="border-green-600 text-green-600 hover:bg-green-50 px-3 py-2 font-medium"
                                    title="WhatsApp"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                WhatsApp
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                  📞 No phone number
                                </div>
                              )}

                              {/* Quotation Actions */}
                              {task.quotation_id && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const viewUrl = task.quotation_slug 
                                        ? `/quotation/${task.quotation_slug}` 
                                        : `/sales/quotations/${task.quotation_id}`
                                      window.open(viewUrl, '_blank')
                                    }}
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-2"
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const editUrl = `/sales/quotations/edit-from-task/${task.quotation_id}?taskId=${task.id}`
                                      window.open(editUrl, '_blank')
                                    }}
                                    className="border-orange-600 text-orange-600 hover:bg-orange-50 px-3 py-2"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              )}

                                                             {/* Lead Action */}
                               {task.lead_id && (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => window.open(`/sales/lead/${task.lead_id}`, '_blank')}
                                   className="border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-2"
                                 >
                                   <Target className="h-4 w-4 mr-1" />
                                   Lead
                                 </Button>
                               )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CALL UPLOAD TAB */}
          <TabsContent value="upload" className="space-y-6">
            {/* Upload Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudUpload className="h-5 w-5" />
                  Upload Call Recording
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Upload call recordings after completing tasks or follow-ups
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client-name">Client Name *</Label>
                    <Input
                      id="client-name"
                      value={uploadForm.clientName}
                      onChange={(e) => setUploadForm({...uploadForm, clientName: e.target.value})}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-id">Related Task ID (Optional)</Label>
                    <Select value={uploadForm.taskId} onValueChange={(value) => setUploadForm({...uploadForm, taskId: value === "none" ? "" : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select related task" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No related task</SelectItem>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title} - {task.client_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="call-file">Audio File *</Label>
                  <Input
                    id="call-file"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: MP3, WAV, M4A (max 50MB)
                  </p>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                    placeholder="Add any notes about this call..."
                    rows={3}
                  />
                </div>

                {selectedFile && (
                  <Alert>
                    <Mic className="h-4 w-4" />
                    <AlertDescription>
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={uploadCall} 
                  disabled={uploading || !selectedFile || !uploadForm.clientName}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="h-4 w-4 mr-2" />
                      Upload Call
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Upload History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadHistory.map((upload) => (
                        <TableRow key={upload.id}>
                          <TableCell>{upload.client}</TableCell>
                          <TableCell>{formatDate(upload.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600">
                              {upload.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                                             {uploadHistory.length === 0 && (
                         <TableRow>
                           <TableCell className="text-center text-gray-500">
                             No uploads yet
                           </TableCell>
                         </TableRow>
                       )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Task Update Dialog */}
        {showUpdateDialog && selectedTask && (
          <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Task: {selectedTask.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Completion Notes</Label>
                  <Textarea
                    id="notes"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Add any notes about this update..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => updateTaskStatus(selectedTask.id, newStatus, completionNotes)}
                    disabled={!newStatus}
                  >
                    Update Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
} 