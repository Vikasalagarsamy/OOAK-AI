"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, User, Building, Mail, Phone, ListChecks, ChevronDown, ChevronUp } from "lucide-react"

interface Task {
  id: number
  task_title: string
  task_description: string
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

interface Lead {
  id: number
  client_name: string
  contact_email?: string
  contact_phone?: string
  company_name?: string
  address?: string
  [key: string]: any
}

interface TaskDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
}

export default function TaskDetailsModal({ isOpen, onClose, task }: TaskDetailsModalProps) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [leadTasks, setLeadTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [showTaskMeta, setShowTaskMeta] = useState(false)
  const [showLeadRaw, setShowLeadRaw] = useState(false)

  useEffect(() => {
    if (isOpen && task && task.lead_id) {
      setLoading(true)
      Promise.all([
        fetch(`/api/leads/${task.lead_id}`).then(res => res.json()),
        fetch(`/api/tasks?lead_id=${task.lead_id}`).then(res => res.json())
      ]).then(([leadData, tasksData]) => {
        setLead(leadData)
        setLeadTasks(tasksData)
      }).finally(() => setLoading(false))
    } else if (isOpen) {
      setLead(null)
      setLeadTasks([])
      setLoading(false)
    }
  }, [isOpen, task])

  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-blue-600" /> Task & Lead Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">All insights for this task and lead</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading details...</p>
          </div>
        )}

        {/* Task Info */}
        {!loading && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {task.status === 'completed' ? 'Task History & Analytics' : 'Task Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <div className="font-semibold text-lg mb-1">{task.task_title}</div>
                <div className="text-gray-700 mb-2">{task.task_description}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline">Priority: {task.priority}</Badge>
                  <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                    Status: {task.status}
                  </Badge>
                  <Badge variant="outline">Due: {new Date(task.due_date).toLocaleString()}</Badge>
                  <Badge variant="outline">Assigned to: {task.assigned_to}</Badge>
                </div>
                
                {/* Completion Analytics for completed tasks */}
                {task.status === 'completed' && task.completed_at && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Task Completed</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium text-green-700">Completed At:</span> {new Date(task.completed_at).toLocaleString()}</div>
                      <div><span className="font-medium text-green-700">Time Taken:</span> {
                        (() => {
                          const start = new Date(task.created_at);
                          const end = new Date(task.completed_at);
                          const diffMs = end.getTime() - start.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          
                          if (diffDays > 0) return `${diffDays}d ${diffHours}h ${diffMins}m`;
                          if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
                          return `${diffMins}m`;
                        })()
                      }</div>
                      <div><span className="font-medium text-green-700">Started At:</span> {new Date(task.created_at).toLocaleString()}</div>
                      <div><span className="font-medium text-green-700">Due Date:</span> {new Date(task.due_date).toLocaleString()}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mb-2 text-xs text-gray-500">
                  <span>Created: {new Date(task.created_at).toLocaleString()}</span>
                  <span>Last Updated: {new Date(task.updated_at).toLocaleString()}</span>
                </div>
                {/* Business-friendly metadata fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                  {task.metadata?.rule_name && <div><span className="font-medium">Rule:</span> {task.metadata.rule_name}</div>}
                  {task.metadata?.sla_hours && <div><span className="font-medium">SLA Hours:</span> {task.metadata.sla_hours}</div>}
                  {task.metadata?.lead_number && <div><span className="font-medium">Lead Number:</span> {task.metadata.lead_number}</div>}
                  {task.metadata?.designation_assigned && <div><span className="font-medium">Designation:</span> {task.metadata.designation_assigned}</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead Info */}
        {!loading && lead && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" /> Lead & Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <div className="font-semibold text-lg mb-1">{lead.client_name}</div>
                {lead.company_name && <div className="text-gray-700 mb-1">Company: <span className="font-medium">{lead.company_name}</span></div>}
                {lead.address && <div className="text-gray-700 mb-1">Address: <span className="font-medium">{lead.address}</span></div>}
                <div className="flex flex-wrap gap-4 text-sm mt-2">
                  {lead.contact_email && <span><Mail className="inline h-4 w-4 mr-1" />{lead.contact_email}</span>}
                  {lead.contact_phone && <span><Phone className="inline h-4 w-4 mr-1" />{lead.contact_phone}</span>}
                </div>
                {/* Highlight lead creation and last action */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {lead.created_at && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Lead Created: {new Date(lead.created_at).toLocaleString()}</span>}
                  {lead.updated_at && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">Last Action: {new Date(lead.updated_at).toLocaleString()}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task History for this Lead */}
        {!loading && leadTasks.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-purple-600" /> Task History for this Lead
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm border rounded overflow-x-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2 font-semibold">Task Title</th>
                    <th className="text-left p-2 font-semibold">Status</th>
                    <th className="text-left p-2 font-semibold">Assignee</th>
                    <th className="text-left p-2 font-semibold">Due Date</th>
                    <th className="text-left p-2 font-semibold">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {leadTasks.map((t) => (
                    <tr key={t.id} className="border-b last:border-b-0">
                      <td className="p-2">{t.task_title}</td>
                      <td className="p-2">
                        <Badge variant={
                          t.status === 'completed' ? 'default' :
                          t.status === 'pending' ? 'secondary' :
                          'outline'
                        }>{t.status}</Badge>
                      </td>
                      <td className="p-2">{t.assigned_to}</td>
                      <td className="p-2">{new Date(t.due_date).toLocaleString()}</td>
                      <td className="p-2">{t.completed_at ? new Date(t.completed_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 