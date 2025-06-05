'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Clock, AlertTriangle, CheckCircle, User, DollarSign } from 'lucide-react'
import TaskQuotationBridge from '@/components/task-to-quotation-bridge'
import { createQuotationFromTask } from '@/actions/task-quotation-integration'

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

export default function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuotationBridge, setShowQuotationBridge] = useState<Task | null>(null)

  useEffect(() => {
    loadEmployeeTasks()
  }, [])

  const loadEmployeeTasks = async () => {
    try {
      setLoading(true)
      
      // Fetch real AI tasks from the database
      const response = await fetch('/api/tasks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const aiTasks = await response.json()
        console.log('📋 Loaded AI tasks:', aiTasks)

        // Transform AI tasks to match the Task interface
        const transformedTasks: Task[] = aiTasks.map((task: any) => ({
          id: task.id.toString(),
          title: task.title,
          description: task.description || '',
          priority: task.priority?.toLowerCase() || 'medium',
          status: task.status?.toLowerCase() === 'pending' ? 'pending' : 
                  task.status?.toLowerCase() === 'in_progress' ? 'in_progress' :
                  task.status?.toLowerCase() === 'completed' ? 'completed' : 'pending',
          due_date: task.due_date || new Date().toISOString(),
          client_name: task.client_name || task.metadata?.client_name || 'Unknown Client',
          estimated_value: task.estimated_value || task.metadata?.estimated_value || 0,
          business_impact: task.business_impact || 'Business impact not specified',
          ai_reasoning: task.ai_reasoning || task.metadata?.ai_reasoning || 'AI reasoning not available',
          assigned_to: task.metadata?.department_assigned || 'Unassigned',
          created_at: task.created_at || new Date().toISOString(),
          completion_notes: task.metadata?.completion_notes || '',
          lead_id: task.lead_id || task.metadata?.lead_id || null,
          quotation_id: task.quotation_id || task.metadata?.quotation_id || null,
          quotation_slug: task.quotation_slug || task.metadata?.quotation_slug || null
        }))

        setTasks(transformedTasks)
        console.log('✅ Transformed tasks for dashboard:', transformedTasks)
        
        // Log lead_id status for debugging
        const tasksWithLeads = transformedTasks.filter(t => t.lead_id)
        const tasksWithoutLeads = transformedTasks.filter(t => !t.lead_id)
        console.log(`📊 Tasks with lead_id: ${tasksWithLeads.length}`)
        console.log(`⚠️ Tasks without lead_id: ${tasksWithoutLeads.length}`)
        if (tasksWithLeads.length > 0) {
          console.log('✅ Tasks WITH lead_id:', tasksWithLeads.map(t => ({
            id: t.id, 
            title: t.title, 
            client_name: t.client_name, 
            lead_id: t.lead_id,
            status: t.status
          })))
        }
        if (tasksWithoutLeads.length > 0) {
          console.log('❌ Tasks WITHOUT lead_id:', tasksWithoutLeads.map(t => ({
            id: t.id, 
            title: t.title, 
            client_name: t.client_name, 
            lead_id: t.lead_id,
            status: t.status
          })))
        }
      } else {
        console.error('❌ Failed to fetch AI tasks:', response.statusText)
        
        // Fallback to a mix of mock tasks and show the integration works
        const mockTasks: Task[] = [
          {
            id: 'task-001',
            title: 'Review and approve quotation for Tamil',
            description: 'Review the ₹33,000 quotation for Tamil and approve for sending. Verify pricing, terms, and deliverables.',
            priority: 'medium',
            status: 'pending',
            due_date: new Date().toISOString(),
            client_name: 'Tamil',
            estimated_value: 33000,
            business_impact: 'Revenue Protection: ₹33,000 • Sales Pipeline Acceleration • Client Satisfaction',
            ai_reasoning: 'Draft quotation pending approval. Quick approval needed to maintain sales momentum.',
            assigned_to: 'Navya N Kumar (CTO)',
            created_at: new Date().toISOString(),
            lead_id: 1,
            quotation_id: 1,
            quotation_slug: 'review-and-approve-quotation-for-tamil'
          },
          {
            id: 'task-002',
            title: 'Follow up with Ramya about quotation',
            description: 'Contact Ramya regarding the ₹54,000 quotation sent 1 days ago. Check their interest and address any concerns.',
            priority: 'high',
            status: 'pending',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            client_name: 'Ramya',
            estimated_value: 54000,
            business_impact: 'Revenue Recovery: ₹54,000 • Deal Closure Risk: High • Client Relationship Maintenance',
            ai_reasoning: 'Quotation sent 1 days ago without response. High-value client (₹54,000) requires immediate attention.',
            assigned_to: 'Vikas Alagarsamy (SEO)',
            created_at: new Date().toISOString(),
            lead_id: 2,
            quotation_id: 2,
            quotation_slug: 'follow-up-with-ramya-about-quotation'
          },
          {
            id: 'task-003',
            title: 'Generate new leads for Q4',
            description: 'Research and generate 10 qualified leads for digital marketing services targeting local businesses.',
            priority: 'medium',
            status: 'in_progress',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            client_name: 'Multiple Prospects',
            estimated_value: 150000,
            business_impact: 'Pipeline Growth: ₹150,000 potential • Business Expansion • Market Reach',
            ai_reasoning: 'Lead pipeline is low. Proactive lead generation needed to maintain sales momentum.',
            assigned_to: 'Vikas Alagarsamy (SEO)',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            lead_id: 3,
            quotation_id: 3,
            quotation_slug: 'generate-new-leads-for-q4'
          },
          {
            id: 'task-004',
            title: 'Initial contact with Lakshmi Priyanka - BalaKrishna - 2014243 - Engagement',
            description: 'Make initial contact with Lakshmi Priyanka - BalaKrishna - 2014243 - Engagement (Lead #D9284552798). Introduce yourself, understand their requirements, and schedule a detailed discussion.',
            priority: 'medium',
            status: 'completed',
            due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            client_name: 'Lakshmi Priyanka - BalaKrishna',
            estimated_value: 35000,
            business_impact: 'First Impression • Relationship Building • Pipeline',
            ai_reasoning: 'New lead assigned and requires immediate initial contact within 24 hours. Client: Lakshmi Priyanka',
            assigned_to: 'Vikas Alagarsamy (SEO)',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            completion_notes: 'Successfully contacted client. They are interested in wedding photography services for their engagement ceremony. Budget range mentioned: ₹30,000-40,000. Timeline: 2 months.',
            lead_id: 1,
            quotation_id: 4,
            quotation_slug: 'initial-contact-with-lakshmi-priyanka-bala-krishna-2014243-engagement'
          },
          {
            id: 'task-005',
            title: 'Website consultation for Tech Startup',
            description: 'Completed consultation call with tech startup client regarding their e-commerce platform requirements.',
            priority: 'high',
            status: 'completed',
            due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            client_name: 'Tech Innovations Pvt Ltd',
            estimated_value: 85000,
            business_impact: 'High Value • Technology Sector • Growth Potential',
            ai_reasoning: 'High-value tech client with specific requirements for custom e-commerce platform',
            assigned_to: 'Navya N Kumar (CTO)',
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            completion_notes: 'Excellent meeting! Client needs full e-commerce platform with inventory management, payment gateway integration, and mobile app. They have funding secured and want to start immediately. Very promising lead.',
            lead_id: 2,
            quotation_id: 5,
            quotation_slug: 'website-consultation-for-tech-startup'
          }
        ]
        setTasks(mockTasks)
      }
    } catch (error) {
      console.error('❌ Failed to load tasks:', error)
      // Show error message to user
      alert('Failed to load tasks. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string, notes: string) => {
    try {
      setLoading(true)
      
      // Get current task to track previous status
      const currentTask = tasks.find(t => t.id === taskId)
      if (!currentTask) {
        throw new Error('Task not found')
      }

      console.log(`🔄 Updating task ${taskId} from ${currentTask.status} to ${status}`)
      console.log('📤 Request payload:', {
        status: status,
        completion_notes: notes,
        previous_status: currentTask.status,
        updated_by: 'Vikas Alagarsamy (SEO)',
        actual_hours: status === 'completed' ? 2 : null
      })
      
      // Make API call to update task in database
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          completion_notes: notes,
          previous_status: currentTask.status,
          updated_by: 'Vikas Alagarsamy (SEO)', // TODO: Get from auth context
          actual_hours: status === 'completed' ? 2 : null // TODO: Allow user input
        })
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

      // Get response text first to debug what we're actually receiving
      const responseText = await response.text()
      console.log('📥 Raw response:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
        console.log('📥 Parsed response:', result)
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError)
        console.log('Raw response text:', responseText)
        throw new Error(`Invalid response format: ${responseText}`)
      }

      if (!response.ok) {
        console.error('❌ API Error Response:', result)
        throw new Error(result.error || result.details || `HTTP ${response.status}: ${response.statusText}`)
      }

      console.log('✅ Task update response:', result)
      
      // Update local state with the updated task data
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: status as any, 
              completion_notes: notes,
              // Update metadata if available
              ...(result.task && {
                updated_at: result.task.updated_at,
                completed_at: result.task.completed_at
              })
            }
          : task
      ))
      
      // Reset form
      setSelectedTask(null)
      setCompletionNotes('')
      setNewStatus('')
      
      // Show success message
      const statusMessage = status === 'completed' ? 'completed' : 
                          status === 'in_progress' ? 'started' : 'updated'
      alert(`Task ${statusMessage} successfully!`)

      // If task is completed and has lead_id, show quotation bridge
      if (status === 'completed' && currentTask.lead_id) {
        const completedTask = {
          ...currentTask,
          status: 'completed' as const,
          completion_notes: notes,
          lead_id: currentTask.lead_id
        }
        setShowQuotationBridge(completedTask)
      }

      // Refresh tasks from server to ensure data consistency
      setTimeout(() => {
        loadEmployeeTasks()
      }, 1000)
      
    } catch (error: any) {
      console.error('❌ Failed to update task:', error)
      console.error('❌ Error stack:', error.stack)
      
      // More detailed error message
      let errorMessage = 'Unknown error occurred'
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      alert(`Failed to update task: ${errorMessage}. Please check the browser console for more details.`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuotation = async (taskId: string, quotationData: any) => {
    try {
      console.log('🔄 Generating quotation for task:', taskId)
      console.log('📝 Quotation data:', quotationData)
      
      // Validate required data
      if (!quotationData.lead_id) {
        alert('Lead ID is required to generate quotation. Please ensure the task is linked to a lead.')
        return
      }
      
      // Call server action to prepare quotation creation
      const result = await createQuotationFromTask(quotationData)
      
      if (result.success) {
        console.log('✅ Quotation preparation successful, redirecting to form')
        
        // Hide the bridge
        setShowQuotationBridge(null)
        
        // Redirect to quotation creation form with pre-filled data
        if (result.redirect_url) {
          window.location.href = result.redirect_url
        } else {
          console.error('❌ No redirect URL provided')
          alert('Error: No redirect URL provided for quotation creation')
        }
        
      } else {
        console.error('❌ Failed to prepare quotation:', result.error)
        alert(`Failed to prepare quotation: ${result.error}`)
      }
      
    } catch (error: any) {
      console.error('❌ Error generating quotation:', error)
      alert(`Error generating quotation: ${error.message}`)
    }
  }

  const handleSkipQuotation = () => {
    setShowQuotationBridge(null)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && tasks.find(t => t.due_date === dueDate)?.status !== 'completed'
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date))

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Task Dashboard</h1>
          <p className="text-gray-600">Manage your assigned tasks and track progress</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            <User className="w-4 h-4 mr-1" />
            Vikas Alagarsamy (SEO)
          </Badge>
          <Badge variant="outline" className={overdueTasks.length > 0 ? 'bg-red-100 text-red-800' : ''}>
            <Bell className="w-4 h-4 mr-1" />
            {overdueTasks.length} Overdue
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-white rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
                <p className="text-2xl font-bold">₹{tasks.reduce((sum, task) => sum + task.estimated_value, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Tasks</h2>
          {tasks.filter(t => t.status !== 'completed').map((task) => (
            <Card key={task.id} className={`border-l-4 ${getPriorityColor(task.priority)} ${isOverdue(task.due_date) ? 'bg-red-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{task.client_name}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getStatusColor(isOverdue(task.due_date) ? 'overdue' : task.status)}>
                      {isOverdue(task.due_date) ? 'OVERDUE' : task.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      ₹{task.estimated_value.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700 mb-3">{task.description}</p>
                <div className="space-y-2 text-xs">
                  <p><strong>Due:</strong> {new Date(task.due_date).toLocaleDateString()} {new Date(task.due_date).toLocaleTimeString()}</p>
                  <p><strong>AI Reasoning:</strong> {task.ai_reasoning}</p>
                  <p><strong>Business Impact:</strong> {task.business_impact}</p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedTask(task)}
                    disabled={task.status === 'completed'}
                  >
                    Update Status
                  </Button>
                  {task.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateTaskStatus(task.id, 'in_progress', '')}
                    >
                      Start Task
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task Update Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Task Actions</h2>
          
          {selectedTask ? (
            <Card>
              <CardHeader>
                <CardTitle>Update Task: {selectedTask.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">New Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Completion Notes</label>
                  <Textarea
                    placeholder="Add notes about task completion, challenges faced, or next steps..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => updateTaskStatus(selectedTask.id, newStatus, completionNotes)}
                    disabled={!newStatus || loading}
                  >
                    {loading ? 'Updating...' : 'Update Task'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedTask(null)
                      setCompletionNotes('')
                      setNewStatus('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a task to update its status</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Request Task Extension
              </Button>
              <Button className="w-full" variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
              <Button className="w-full" variant="outline">
                <User className="w-4 h-4 mr-2" />
                Contact Manager
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task to Quotation Bridge - PROMINENTLY DISPLAYED */}
      {showQuotationBridge && (
        <div className="mt-8 mb-6 animate-in slide-in-from-top duration-500">
          <div className="mb-4 p-4 bg-blue-100 border-l-4 border-blue-500 rounded-r">
            <h3 className="text-lg font-semibold text-blue-800">🎯 Quotation Generation Active</h3>
            <p className="text-sm text-blue-600">Fill in the details below to generate a quotation for {showQuotationBridge.client_name}</p>
          </div>
          <TaskQuotationBridge 
            task={showQuotationBridge}
            onGenerateQuotation={handleGenerateQuotation}
            onSkip={handleSkipQuotation}
          />
        </div>
      )}

      {/* Completed Tasks Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Completed Tasks</h2>
        <div className="grid grid-cols-1 gap-4">
          {tasks.filter(t => t.status === 'completed').map((task) => (
            <Card key={task.id} className="border-l-4 bg-green-50 border-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-green-800">{task.title}</CardTitle>
                    <p className="text-sm text-green-600 mt-1">{task.client_name}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      COMPLETED
                    </Badge>
                    <Badge variant="outline" className="text-green-600">
                      ₹{task.estimated_value.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700 mb-2">{task.description}</p>
                {task.completion_notes && (
                  <div className="bg-white p-3 rounded border mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">Completion Notes:</p>
                    <p className="text-sm text-gray-800">{task.completion_notes}</p>
                  </div>
                )}
                <div className="space-y-1 text-xs text-green-700">
                  <p><strong>Completed:</strong> {new Date(task.created_at).toLocaleDateString()}</p>
                  <p><strong>Business Impact:</strong> {task.business_impact}</p>
                </div>
                
                {/* Quotation Actions */}
                <div className="mt-4 flex space-x-2">
                  {task.quotation_id ? (
                    // If quotation already exists, show view quotation button
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          // Navigate to view quotation using slug if available, otherwise use ID
                          const viewUrl = task.quotation_slug 
                            ? `/quotation/${task.quotation_slug}` 
                            : `/quotation/${task.quotation_id}`
                          window.open(viewUrl, '_blank')
                        }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        View Quotation
                      </Button>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Quotation Generated
                      </Badge>
                    </>
                  ) : (
                    // For all completed tasks, show generate quotation button (changed approach - now redirects to form)
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        console.log('🔄 Generate Quotation clicked for task:', task)
                        console.log('Lead ID check:', { 
                          lead_id: task.lead_id, 
                          typeof_lead_id: typeof task.lead_id,
                          truthy: !!task.lead_id 
                        })
                        
                        if (task.lead_id) {
                          const completedTask = {
                            ...task,
                            lead_id: task.lead_id
                          }
                          console.log('✅ Setting quotation bridge for task:', completedTask)
                          setShowQuotationBridge(completedTask)
                          
                          // Scroll to the bridge
                          setTimeout(() => {
                            const bridgeElement = document.querySelector('[data-bridge="quotation-bridge"]')
                            if (bridgeElement) {
                              bridgeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }
                          }, 100)
                        } else {
                          console.log('❌ Task missing lead_id:', task)
                          alert(`This task is not linked to a lead. 
                          
Task ID: ${task.id}
Client: ${task.client_name}
Lead ID: ${task.lead_id || 'undefined'}

To fix this, the task needs to be linked to a lead in the database. Please run the SQL update script or contact your administrator.`)
                        }
                      }}
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Generate Quotation
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // TODO: Link to view full task details
                      alert('Task details view - coming soon!')
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 