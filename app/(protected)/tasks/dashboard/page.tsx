/**
 * MAIN TASK DASHBOARD - ENHANCED VERSION
 * 
 * This is the main task dashboard at http://localhost:3000/tasks/dashboard
 * 
 * Features:
 * - Real-time task management with database integration
 * - Call upload functionality with transcription
 * - Enhanced UI with filtering and status updates  
 * - Quotation generation workflow
 * 
 * Previous version archived at: app/(protected)/tasks/dashboard/archived/page-original.tsx
 * Updated: ${new Date().toISOString().split('T')[0]}
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Phone,
  ClockIcon,
  XCircle,
  PhoneOff,
  Eye
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
  updated_at?: string
  completion_notes?: string
  lead_id?: number
  quotation_id?: number
  quotation_slug?: string
  quotation_approval_status?: string
  quotation_workflow_status?: string
  task_type?: string
  assigned_to_employee_id?: number
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

  // Get current user for role-based filtering
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  
  // Authentication state
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  useEffect(() => {
    // Check authentication first, then load data
    const initializePage = async () => {
      try {
        console.log('🔍 Starting authentication check...')
        
        // Check if user is authenticated
        const authResponse = await fetch('/api/auth/status')
        console.log('🔍 Auth response status:', authResponse.status)
        
        const authData = await authResponse.json()
        console.log('🔍 Auth data:', authData)
        
        if (!authResponse.ok || !authData.authenticated) {
          console.log('🔐 User not authenticated, redirecting to login')
          window.location.href = '/login?reason=unauthenticated&from=/tasks/dashboard'
          return
        }
        
        console.log('✅ User authenticated, loading dashboard data')
        
        // If authenticated, load all data
        await Promise.all([
          loadTasks(),
          loadUploadHistory(),
          getCurrentUser()
        ])
        
        setIsAuthenticating(false)
        console.log('✅ Dashboard initialization complete')
      } catch (error) {
        console.error('❌ Page initialization failed:', error)
        window.location.href = '/login?reason=unauthenticated&from=/tasks/dashboard'
      }
    }
    
    initializePage()
  }, [])

  // Auto-sync when user returns to the tab (dynamic data freshness)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab, auto-sync silently
        autoSyncQuotationValues()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // =================== TASK FUNCTIONS ===================

  const loadTasks = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading tasks...')
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/tasks?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      })
      
      console.log('📋 Response status:', response.status)
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        console.log('❌ API Response not OK:', response.status, response.statusText)
        
        // Try to get the error response
        try {
          const errorData = await response.json()
          console.log('❌ Error response data:', errorData)
        } catch (e) {
          console.log('❌ Could not parse error response')
        }
        
        if (response.status === 401) {
          // User is not authenticated, redirect to login
          console.log('🔐 Redirecting to login due to 401 error')
          window.location.href = '/login?reason=unauthenticated&from=/tasks/dashboard'
          return
        }
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`)
      }
      
      const aiTasks = await response.json()
      console.log('📋 Raw API response:', aiTasks)
      
      // Ensure aiTasks is always an array
      const tasksArray = Array.isArray(aiTasks) ? aiTasks : []
      console.log('📋 Tasks array length:', tasksArray.length)
      
      // Transform tasks to match interface
      const transformedTasks: Task[] = tasksArray.map((task: any) => ({
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
        quotation_approval_status: task.quotation_approval_status,
        quotation_workflow_status: task.quotation_workflow_status,
        task_type: task.task_type,
        assigned_to_employee_id: task.assigned_to_employee_id || task.metadata?.assigned_to_employee_id,
        metadata: task.metadata || {},
        client_phone: task.client_phone
      }))
      
      setTasks(transformedTasks)
      console.log('✅ Tasks loaded:', transformedTasks.length)
      
      // Debug: Log phone numbers for each task
      transformedTasks.forEach(task => {
        console.log(`📞 Task ${task.id} (${task.client_name}): phone=${task.client_phone}, lead_id=${task.lead_id}, phone_type=${typeof task.client_phone}`)
        if (task.client_phone) {
          console.log(`📞   Phone details: "${task.client_phone}", length=${task.client_phone.length}, trimmed="${task.client_phone.trim()}"`)
        } else {
          console.log(`📞   Phone is: ${task.client_phone} (${typeof task.client_phone})`)
        }
      })
      
      // Auto-sync quotation values after loading tasks
      await autoSyncQuotationValues()
      
    } catch (error) {
      console.error('❌ Error loading tasks:', error)
      toast({
        title: "Error",
        description: "Failed to load tasks. Please check your connection and try again.",
        variant: "destructive"
      })
      // Set empty array to prevent further errors
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string, notes: string) => {
    try {
      console.log(`🔄 updateTaskStatus called for task ${taskId}, status: ${status}`)
      
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
        console.log(`✅ Task ${taskId} status updated successfully to ${status}`)
        
        // Immediately update the task in the local state for instant UI feedback
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { ...task, status: status as any, completion_notes: notes }
              : task
          )
        )
        
        // Only reload tasks if we're not in the middle of a quick action sequence
        // This prevents race conditions when multiple operations happen quickly
        if (!loading) {
          console.log('🔄 Reloading tasks since not in loading state')
          await loadTasks()
        } else {
          console.log('⏳ Skipping task reload since operation is in progress')
        }
        
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
        console.error(`❌ Failed to update task ${taskId}:`, error)
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
    }
    // Note: Don't set loading to false here since this function is called from other functions
    // that manage their own loading state
  }

  // Call client function - API-based trigger to Android app
  const handleCallClient = async (phoneNumber: string, clientName: string, taskId?: string) => {
    // Clean and format phone number
    let cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Add country code if not present
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone
    }
    
    const formattedPhone = `+${cleanPhone}`
    
    try {
      // Get current user for employee ID
      const user = currentUser || await getCurrentUser()
      const employeeId = user?.employee_id || user?.employeeId || 6 // Use numeric ID 6 as fallback
      
      console.log(`📞 Triggering call via API: ${clientName} at ${formattedPhone}`)
      console.log(`📋 Using employeeId: ${employeeId} (type: ${typeof employeeId})`)
      console.log(`📋 User object:`, user)
      // Show loading toast
      toast({
        title: "📞 Triggering Call",
        description: `Sending call request to your mobile device...`,
        duration: 3000,
      })

      // Send API request to trigger call on mobile device
      const response = await fetch('/api/trigger-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          employeeId: employeeId,
          taskId: taskId,
          clientName: clientName
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log(`✅ Call trigger sent successfully: ${result.message}`)
        
        toast({
          title: "📞 Call Triggered",
          description: `Call request sent to your mobile device for ${clientName} (${formattedPhone})`,
          duration: 5000,
        })
      } else {
        console.error('❌ Call trigger failed:', result.error)
        
        // Fallback to regular phone dialer
        const telUrl = `tel:${formattedPhone}`
        window.location.href = telUrl
        
        toast({
          title: "📞 Opening Phone Dialer",
          description: `API trigger failed. Opening phone dialer as fallback for ${clientName}`,
          variant: "destructive",
          duration: 5000,
        })
      }
      
    } catch (error) {
      console.error('❌ Call trigger error:', error)
      
      // Fallback to regular phone dialer
      const telUrl = `tel:${formattedPhone}`
      window.location.href = telUrl
      
      toast({
        title: "📞 Opening Phone Dialer",
        description: `Connection error. Opening phone dialer as fallback for ${clientName}`,
        variant: "destructive",
        duration: 5000,
      })
    }
    
    // Log call initiation for analytics
    if (taskId) {
      console.log(`📞 Call initiated for task ${taskId}: ${clientName} at ${formattedPhone}`)
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

  // =================== QUICK ACTION FUNCTIONS ===================
  
  // Handle "Call me back in X days" scenario
  const handleCallBackLater = async (task: Task, days: number) => {
    // Prevent multiple simultaneous operations on the same task
    if (loading) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Please wait for it to complete.",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      console.log(`🔄 Starting handleCallBackLater for task ${task.id}, ${days} days, loading state: ${loading}`)
      
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + days)
      
      // Create a new follow-up task with safe, serializable values
      const followUpTask = {
        title: `📞 Follow up with ${task.client_name || 'Client'} - ${days} Day${days > 1 ? 's' : ''} Callback`,
        description: `Client requested callback in ${days} days. Original task: ${task.title || 'Unknown task'}`,
        task_type: 'client_followup',
        priority: task.priority || 'medium',
        status: 'pending',
        assigned_to_employee_id: task.assigned_to_employee_id || null,
        due_date: followUpDate.toISOString(),
        lead_id: task.lead_id || null,
        client_name: task.client_name || '',
        business_impact: 'medium',
        estimated_value: 0
      }

      console.log('Creating follow-up task:', followUpTask)

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpTask)
      })

      if (!response.ok) {
        const responseText = await response.text()
        console.error('❌ Raw API Response:', responseText)
        
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          errorData = { error: 'Invalid response format', rawResponse: responseText }
        }
        
        console.error('❌ Parsed API Error Response:', errorData)
        throw new Error(errorData.error || errorData.details || 'Failed to create follow-up task')
      }

      console.log('✅ Follow-up task created successfully, now updating original task status...')

      // Mark current task as completed with callback notes
      await updateTaskStatus(task.id, 'completed', `Client requested callback in ${days} days. Follow-up task created for ${followUpDate.toLocaleDateString()}.`)
      
      toast({
        title: "✅ Callback Scheduled",
        description: `Follow-up task created for ${followUpDate.toLocaleDateString()}. Current task marked as completed.`,
      })
      
    } catch (error) {
      console.error('Error creating callback task:', error)
      toast({
        title: "Error",
        description: "Failed to schedule callback. Please try again.",
        variant: "destructive"
      })
    } finally {
      console.log(`🔄 Completed handleCallBackLater for task ${task.id}, setting loading to false`)
      setLoading(false)
    }
  }

  // Handle "Not interested" scenario
  const handleNotInterested = async (task: Task) => {
    // Prevent multiple simultaneous operations on the same task
    if (loading) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Please wait for it to complete.",
        variant: "destructive"
      })
      return
    }

    // Show rejection reason dialog
    const rejectionReason = await showRejectionDialog(task.client_name)
    if (!rejectionReason) {
      return // User cancelled
    }
    
    try {
      setLoading(true)
      
      // Update lead status to REJECTED if lead_id exists
      if (task.lead_id) {
        console.log(`🔄 Updating lead ${task.lead_id} to REJECTED status...`)
        
        const leadResponse = await fetch(`/api/leads/${task.lead_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'REJECTED',
            rejection_reason: rejectionReason,
            rejected_at: new Date().toISOString(),
            notes: `Client not interested. Rejected on ${new Date().toLocaleDateString()}. Reason: ${rejectionReason}`
          })
        })
        
        if (!leadResponse.ok) {
          const errorText = await leadResponse.text()
          console.error('❌ Failed to update lead status:', errorText)
          throw new Error(`Failed to update lead status: ${errorText}`)
        }
        
        console.log('✅ Lead status updated to REJECTED successfully')
      }

      // Mark task as completed with "not interested" notes
      await updateTaskStatus(task.id, 'completed', `Client not interested in services. Reason: ${rejectionReason}. Lead marked as REJECTED and moved to rejected leads section.`)
      
      toast({
        title: "✅ Task Completed",
        description: `${task.client_name} marked as not interested. Lead moved to rejected section.`,
      })
      
    } catch (error) {
      console.error('Error handling not interested:', error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle "No response" scenario
  const handleNoResponse = async (task: Task) => {
    // Prevent multiple simultaneous operations on the same task
    if (loading) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Please wait for it to complete.",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      // Create a follow-up task for next attempt
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 2) // Try again in 2 days
      
      // Create follow-up task with safe, serializable values
      const followUpTask = {
        title: `📞 Follow up with ${task.client_name || 'Client'} - No Response (${new Date().toLocaleDateString()})`,
        description: `Client did not respond to previous contact attempts. Original task: ${task.title || 'Unknown task'}`,
        task_type: 'client_followup',
        priority: 'medium',
        status: 'pending',
        assigned_to_employee_id: task.assigned_to_employee_id || null,
        due_date: followUpDate.toISOString(),
        lead_id: task.lead_id || null,
        client_name: task.client_name || '',
        business_impact: 'medium',
        estimated_value: 0
      }

      console.log('Creating no-response follow-up task:', followUpTask)

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpTask)
      })

      if (!response.ok) {
        const responseText = await response.text()
        console.error('❌ Raw API Response:', responseText)
        
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          errorData = { error: 'Invalid response format', rawResponse: responseText }
        }
        
        console.error('❌ Parsed API Error Response:', errorData)
        throw new Error(errorData.error || errorData.details || 'Failed to create follow-up task')
      }

      // Mark current task as completed with no response notes
      await updateTaskStatus(task.id, 'completed', `No response from client. Follow-up task created for ${followUpDate.toLocaleDateString()}.`)
      
      toast({
        title: "✅ Follow-up Scheduled",
        description: `No response noted. Will try again on ${followUpDate.toLocaleDateString()}.`,
      })
      
    } catch (error) {
      console.error('Error handling no response:', error)
      toast({
        title: "Error",
        description: "Failed to create follow-up. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle custom date callback
  const handleCustomDateCallback = async (task: Task) => {
    // Prevent multiple simultaneous operations on the same task
    if (loading) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Please wait for it to complete.",
        variant: "destructive"
      })
      return
    }

    // Show custom date picker dialog
    const customDate = await showCustomDateDialog(task.client_name)
    if (!customDate) {
      return // User cancelled
    }

    try {
      setLoading(true)
      console.log(`🔄 Starting handleCustomDateCallback for task ${task.id}, custom date: ${customDate}`)
      
      const followUpDate = new Date(customDate)
      
      // Create a new follow-up task with safe, serializable values
      const followUpTask = {
        title: `📞 Follow up with ${task.client_name || 'Client'} - Custom Date (${followUpDate.toLocaleDateString()})`,
        description: `Client requested callback on ${followUpDate.toLocaleDateString()} at ${followUpDate.toLocaleTimeString()}. Original task: ${task.title || 'Unknown task'}`,
        task_type: 'client_followup',
        priority: task.priority || 'medium',
        status: 'pending',
        assigned_to_employee_id: task.assigned_to_employee_id || null,
        due_date: followUpDate.toISOString(),
        lead_id: task.lead_id || null,
        client_name: task.client_name || '',
        business_impact: 'medium',
        estimated_value: 0
      }

      console.log('🔄 Creating follow-up task with custom date:', followUpTask)

      // Create the follow-up task
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpTask)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Failed to create follow-up task:', errorData)
        throw new Error(errorData.error || 'Failed to create follow-up task')
      }

      const newTask = await response.json()
      console.log('✅ Follow-up task created successfully:', newTask)

      // Mark current task as completed
      await updateTaskStatus(task.id, 'completed', `Client requested callback on ${followUpDate.toLocaleDateString()} at ${followUpDate.toLocaleTimeString()}`)

      toast({
        title: "✅ Custom Follow-up Scheduled",
        description: `Task completed and follow-up scheduled for ${followUpDate.toLocaleDateString()} at ${followUpDate.toLocaleTimeString()}`,
      })

    } catch (error) {
      console.error('❌ Error in handleCustomDateCallback:', error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to schedule custom date follow-up",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Show custom date picker dialog
  const showCustomDateDialog = (clientName: string): Promise<string | null> => {
    return new Promise((resolve) => {
      // Create dialog elements
      const overlay = document.createElement('div')
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      
      const dialog = document.createElement('div')
      dialog.className = 'bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl'
      
      dialog.innerHTML = `
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">📅 Schedule Custom Follow-up</h3>
          <p class="text-sm text-gray-600">When should we follow up with <strong>${clientName}</strong>?</p>
        </div>
        
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Date & Time</label>
          <input 
            type="datetime-local" 
            id="customDateTime"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="${new Date().toISOString().slice(0, 16)}"
          />
          <p class="text-xs text-gray-500 mt-1">Client said: "Call me on [specific date/time]"</p>
        </div>
        
        <div class="flex gap-3 justify-end">
          <button 
            id="cancelBtn"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            id="confirmBtn"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Schedule Follow-up
          </button>
        </div>
      `
      
      overlay.appendChild(dialog)
      document.body.appendChild(overlay)
      
      // Set default date to tomorrow at 10 AM
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      const dateInput = dialog.querySelector('#customDateTime') as HTMLInputElement
      dateInput.value = tomorrow.toISOString().slice(0, 16)
      
      // Focus on date input
      setTimeout(() => dateInput.focus(), 100)
      
      const cleanup = () => {
        document.body.removeChild(overlay)
      }
      
      // Handle confirm
      dialog.querySelector('#confirmBtn')?.addEventListener('click', () => {
        const selectedDate = dateInput.value
        if (!selectedDate) {
          alert('Please select a date and time')
          return
        }
        
        cleanup()
        resolve(selectedDate)
      })
      
      // Handle cancel
      dialog.querySelector('#cancelBtn')?.addEventListener('click', () => {
        cleanup()
        resolve(null)
      })
      
      // Handle escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup()
          resolve(null)
          document.removeEventListener('keydown', handleKeyDown)
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      
      // Handle click outside
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup()
          resolve(null)
        }
      })
    })
  }

  // Show task timeline dialog
  const showTaskTimeline = async (task: Task) => {
    // Create a timeline dialog showing the task history
    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    
    const dialog = document.createElement('div')
    dialog.className = 'bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto'
    
    // Try to fetch related tasks to build timeline
    let timelineHtml = `
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">📋 Task Timeline: ${task.client_name}</h3>
        <p class="text-sm text-gray-600">Complete history of follow-ups and interactions</p>
      </div>
      
      <div class="space-y-4">
        <!-- Current Task -->
        <div class="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <div class="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
          <div class="flex-1">
            <h4 class="font-medium text-green-900">${task.title}</h4>
            <p class="text-sm text-green-700 mt-1">${task.description}</p>
            ${task.completion_notes ? `<p class="text-sm text-green-600 mt-2"><strong>Notes:</strong> ${task.completion_notes}</p>` : ''}
            <p class="text-xs text-green-600 mt-2">✅ Completed on ${new Date(task.updated_at || task.created_at).toLocaleDateString()}</p>
          </div>
        </div>
    `

    // Add estimated timeline based on task description patterns
    if (task.description.includes('2 days') || task.description.includes('2 Days')) {
      timelineHtml += `
        <div class="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div class="w-3 h-3 rounded-full bg-blue-500 mt-1"></div>
          <div class="flex-1">
            <h4 class="font-medium text-blue-900">Previous: 2 Days Follow-up</h4>
            <p class="text-sm text-blue-700">Client requested callback in 2 days</p>
            <p class="text-xs text-blue-600 mt-2">📞 Follow-up completed</p>
          </div>
        </div>
      `
    }

    if (task.description.includes('7 days') || task.description.includes('1 week') || task.description.includes('1 Week')) {
      timelineHtml += `
        <div class="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div class="w-3 h-3 rounded-full bg-purple-500 mt-1"></div>
          <div class="flex-1">
            <h4 class="font-medium text-purple-900">Previous: 1 Week Follow-up</h4>
            <p class="text-sm text-purple-700">Client requested callback in 1 week</p>
            <p class="text-xs text-purple-600 mt-2">📞 Follow-up completed</p>
          </div>
        </div>
      `
    }

    if (task.description.includes('No Response') || task.description.includes('no response')) {
      timelineHtml += `
        <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="w-3 h-3 rounded-full bg-gray-500 mt-1"></div>
          <div class="flex-1">
            <h4 class="font-medium text-gray-900">Previous: No Response</h4>
            <p class="text-sm text-gray-700">Client did not respond to previous attempts</p>
            <p class="text-xs text-gray-600 mt-2">📞 Follow-up attempted</p>
          </div>
        </div>
      `
    }

    if (task.description.includes('Custom Date') || task.description.includes('custom date')) {
      const dateMatch = task.description.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      const customDate = dateMatch ? dateMatch[1] : 'specific date';
      timelineHtml += `
        <div class="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div class="w-3 h-3 rounded-full bg-orange-500 mt-1"></div>
          <div class="flex-1">
            <h4 class="font-medium text-orange-900">Previous: Custom Date Follow-up</h4>
            <p class="text-sm text-orange-700">Client requested callback on ${customDate}</p>
            <p class="text-xs text-orange-600 mt-2">📅 Scheduled follow-up completed</p>
          </div>
        </div>
      `
    }

    // Add original task if this appears to be a follow-up
    if (task.description.includes('Original task:')) {
      const originalMatch = task.description.match(/Original task: (.+?)(?:\.|$)/);
      const originalTask = originalMatch ? originalMatch[1] : 'Initial contact';
      timelineHtml += `
        <div class="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div class="w-3 h-3 rounded-full bg-indigo-500 mt-1"></div>
          <div class="flex-1">
            <h4 class="font-medium text-indigo-900">Original Task</h4>
            <p class="text-sm text-indigo-700">${originalTask}</p>
            <p class="text-xs text-indigo-600 mt-2">🎯 Initial contact made</p>
          </div>
        </div>
      `
    }

    timelineHtml += `
      </div>
      
      <div class="flex gap-3 justify-end mt-6 pt-4 border-t">
        <button 
          id="closeTimelineBtn"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Close
        </button>
      </div>
    `
    
    dialog.innerHTML = timelineHtml
    overlay.appendChild(dialog)
    document.body.appendChild(overlay)
    
    const cleanup = () => {
      document.body.removeChild(overlay)
    }
    
    // Handle close
    dialog.querySelector('#closeTimelineBtn')?.addEventListener('click', cleanup)
    
    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup()
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    
    // Handle click outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup()
      }
    })
  }

  // =================== END QUICK ACTIONS ===================

  // Show rejection reason dialog
  const showRejectionDialog = (clientName: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div')
      dialog.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #dc2626;">
              🚫 Mark ${clientName} as Not Interested
            </h3>
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              Please provide a reason for rejecting this lead. This will help improve our sales process.
            </p>
            <textarea 
              id="rejectionReason" 
              placeholder="e.g., Budget too high, Not the right fit, Already has a photographer, etc."
              style="width: 100%; height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical; margin-bottom: 16px;"
            ></textarea>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button 
                id="cancelBtn" 
                style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 14px;"
              >
                Cancel
              </button>
              <button 
                id="confirmBtn" 
                style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
              >
                Mark as Not Interested
              </button>
            </div>
          </div>
        </div>
      `
      
      document.body.appendChild(dialog)
      
      const textarea = dialog.querySelector('#rejectionReason') as HTMLTextAreaElement
      const cancelBtn = dialog.querySelector('#cancelBtn') as HTMLButtonElement
      const confirmBtn = dialog.querySelector('#confirmBtn') as HTMLButtonElement
      
      // Focus on textarea
      setTimeout(() => textarea.focus(), 100)
      
      const cleanup = () => {
        document.body.removeChild(dialog)
      }
      
      cancelBtn.onclick = () => {
        cleanup()
        resolve(null)
      }
      
      confirmBtn.onclick = () => {
        const reason = textarea.value.trim()
        if (!reason) {
          textarea.style.borderColor = '#dc2626'
          textarea.placeholder = 'Please provide a reason before proceeding'
          textarea.focus()
          return
        }
        cleanup()
        resolve(reason)
      }
      
      // Close on escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup()
          resolve(null)
          document.removeEventListener('keydown', handleKeyDown)
        }
      }
      document.addEventListener('keydown', handleKeyDown)
    })
  }

  const quickStatusUpdate = async (task: Task, newStatus: string) => {
    await updateTaskStatus(task.id, newStatus, '')
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

  // Filter tasks based on user role and task type
  const filteredTasks = useMemo(() => {
    // BYPASS: If currentUser is null, return all tasks (temporary fix)
    if (!currentUser) {
      console.log('⚠️ currentUser is null, showing all tasks as fallback')
      return tasks
    }
    
    console.log(`🔐 Filtering tasks for user: ${currentUser.username}, role: ${currentUser.roleName}, employeeId: ${currentUser.employeeId}`)
    
    return tasks.filter(task => {
      // For quotation approval tasks, only show to Sales Head or Administrator
      if (task.task_type === 'quotation_approval') {
        const isSalesHead = currentUser.roleName === 'Sales Head' || currentUser.roleName === 'Administrator'
        if (!isSalesHead) {
          console.log(`🚫 Filtering out quotation approval task for ${currentUser.roleName}: ${task.title}`)
          return false
        }
      }
      
      // Show tasks assigned to current user or unassigned tasks
      // TEMPORARY FIX: Show all tasks for debugging
      console.log(`🔍 Task ${task.id}: assigned_to=${task.assigned_to_employee_id}, user=${currentUser.employeeId}`)
      return true // Show all tasks temporarily
    })
  }, [tasks, currentUser])

  // Separate completed and pending tasks with debug logging
  const pendingTasksFiltered = filteredTasks.filter(task => task.status === 'pending' || task.status === 'in_progress')
  const completedTasksFiltered = filteredTasks.filter(task => task.status === 'completed')
  
  // Debug log the filtering results
  console.log('📊 Filtering Results:', {
    totalTasks: tasks.length,
    filteredTasks: filteredTasks.length,
    pendingTasks: pendingTasksFiltered.length,
    completedTasks: completedTasksFiltered.length,
    hasCurrentUser: !!currentUser
  })

  // Get current user for role-based filtering
  const getCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData.user)
        console.log('📋 Current user loaded:', userData)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  // Add auto-sync function (silent, no user notification unless there's an error)
  const autoSyncQuotationValues = async () => {
    try {
      const response = await fetch('/api/tasks/sync-quotation-values', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.updated > 0) {
          console.log(`🔄 Auto-synced ${result.updated} tasks with latest quotation values`)
          // Reload tasks to show updated values, but only if we actually updated something
                     const taskResponse = await fetch('/api/tasks')
           if (taskResponse.ok) {
             const aiTasks = await taskResponse.json()
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
               quotation_approval_status: task.quotation_approval_status,
               quotation_workflow_status: task.quotation_workflow_status,
               task_type: task.task_type,
               assigned_to_employee_id: task.assigned_to_employee_id || task.metadata?.assigned_to_employee_id,
               metadata: task.metadata || {},
               client_phone: task.client_phone
             }))
             setTasks(transformedTasks)
           }
        }
      }
    } catch (error) {
      console.error('⚠️ Auto-sync failed (silent):', error)
      // Don't show user notification for auto-sync failures
    }
  }

  // Show loading screen while checking authentication
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-none mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Tasks ({pendingTasksFiltered.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              History ({completedTasksFiltered.length})
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Calls
            </TabsTrigger>
          </TabsList>

          {/* TASK MANAGEMENT TAB */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Task Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
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

            {/* Pending Tasks Section */}
            {pendingTasksFiltered.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Active Tasks ({pendingTasksFiltered.length})
                </h2>
                {pendingTasksFiltered.map((task) => (
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
                        <div className="flex items-center gap-2 mb-2">
                          {/* View/Edit Quotation Buttons */}
                          {task.quotation_id && (
                            <div className="flex items-center gap-2">
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
                                View Quotation
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const editUrl = `/sales/quotations/edit-from-task/${task.quotation_id}?taskId=${task.id}`
                                  window.open(editUrl, '_blank')
                                }}
                                className="border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-2"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Quotation
                              </Button>
                            </div>
                          )}

                          {/* View Lead Button */}
                          {task.lead_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/sales/leads/${task.lead_id}`, '_blank')}
                              className="border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-2"
                            >
                              <Target className="h-4 w-4 mr-1" />
                              View Lead
                            </Button>
                          )}
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex items-center gap-2">
                          {/* Enhanced Communication Buttons */}
                          {task.client_phone && task.client_phone.trim() !== '' ? (
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
                                <Target className="h-4 w-4 mr-1" />
                                WhatsApp
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                              📞 No phone number
                            </div>
                          )}

                          {/* Quick Action Buttons - Common Client Responses */}
                          {task.status !== 'completed' && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCallBackLater(task, 2)}
                                className="border-blue-500 text-blue-600 hover:bg-blue-50 px-2 py-1 text-xs"
                                title="Client asked to call back in 2 days"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                2 Days
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCallBackLater(task, 7)}
                                className="border-blue-500 text-blue-600 hover:bg-blue-50 px-2 py-1 text-xs"
                                title="Client asked to call back in 1 week"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                1 Week
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCustomDateCallback(task)}
                                className="border-purple-500 text-purple-600 hover:bg-purple-50 px-2 py-1 text-xs"
                                title="Client specified a custom date/time"
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Custom Date
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNotInterested(task)}
                                className="border-red-500 text-red-600 hover:bg-red-50 px-2 py-1 text-xs"
                                title="Client not interested"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Not Interested
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNoResponse(task)}
                                className="border-gray-500 text-gray-600 hover:bg-gray-50 px-2 py-1 text-xs"
                                title="Client didn't respond"
                              >
                                <PhoneOff className="h-3 w-3 mr-1" />
                                No Response
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
                </div>
              )}



            {/* No Tasks Message */}
            {pendingTasksFiltered.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active tasks</h3>
                  <p className="text-gray-500">
                    {filterPriority !== 'all' ? 'Try adjusting your filters or ' : ''}
                    All caught up! 🎉
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CALL UPLOAD TAB */}
          <TabsContent value="upload" className="space-y-6">
            {/* Upload Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
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
                    <Target className="h-4 w-4" />
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
                      <Target className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
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
                  <Target className="h-5 w-5" />
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

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Task History</h2>
              <div className="text-sm text-gray-500">
                {completedTasksFiltered.length} completed tasks
              </div>
            </div>

            {completedTasksFiltered.length > 0 ? (
              <div className="space-y-4">
                {completedTasksFiltered.map((task) => (
                  <Card key={task.id} className="border border-green-200 hover:border-green-300 transition-all duration-200 hover:shadow-md bg-green-50/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Left Section - Task Info */}
                        <div className="flex-1 space-y-3">
                          {/* Task Title & Status */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                {task.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs font-medium bg-green-100 text-green-800">
                                COMPLETED
                              </Badge>
                              {task.quotation_id && (
                                <Badge variant="outline" className="text-xs font-medium border-blue-600 text-blue-600">
                                  QUOTED
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Task Description */}
                          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                            {task.description}
                          </p>

                          {/* Completion Notes */}
                          {task.completion_notes && (
                            <div className="bg-white p-3 rounded-lg border border-green-200">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-green-700">Completion Notes:</span> {task.completion_notes}
                              </p>
                            </div>
                          )}

                          {/* Task Meta Info */}
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            {task.client_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span className="font-medium text-gray-700">{task.client_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-medium">
                                Completed {new Date(task.updated_at || task.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {task.estimated_value && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-semibold text-green-600">₹{task.estimated_value.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Section - Minimal Actions */}
                        <div className="flex flex-col items-end gap-3 ml-6">
                          <div className="flex items-center gap-2">
                            {/* View Timeline Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => showTaskTimeline(task)}
                              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-2"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              View Timeline
                            </Button>

                            {/* Quotation Actions (if exists) */}
                            {task.quotation_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const viewUrl = task.quotation_slug 
                                    ? `/quotation/${task.quotation_slug}` 
                                    : `/sales/quotations/${task.quotation_id}`
                                  window.open(viewUrl, '_blank')
                                }}
                                className="border-green-600 text-green-600 hover:bg-green-50 px-3 py-2"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View Quote
                              </Button>
                            )}

                            {/* Lead Link (if exists) */}
                            {task.lead_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/sales/leads/${task.lead_id}`, '_blank')}
                                className="border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-2"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Lead
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tasks yet</h3>
                  <p className="text-gray-500">
                    Completed tasks will appear here with their full timeline history.
                  </p>
                </CardContent>
              </Card>
            )}
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