"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Phone,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  CreditCard,
  UserCheck,
  ArrowRight,
  Calendar,
  User,
  Settings,
  TrendingUp,
  UserCircle,
  Award
} from "lucide-react"
import type { 
  WorkflowStatus, 
  EnhancedQuotation, 
  WorkflowPermissions
} from '@/types/quotation-workflow'
import { 
  getWorkflowPermissions, 
  WORKFLOW_STATUS_LABELS, 
  WORKFLOW_STATUS_COLORS 
} from '@/types/quotation-workflow'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { differenceInDays, parseISO } from 'date-fns'
import { Switch } from '@/components/ui/switch'

interface QuotationWorkflowPipelineProps {
  quotations: EnhancedQuotation[]
  userRole: string
  onStatusUpdate: (quotationId: number, action: string, data?: any) => Promise<void>
  isLoading?: boolean
}

const statusIcons: Record<WorkflowStatus, React.ReactNode> = {
  draft: <FileText className="h-4 w-4" />,
  pending_client_confirmation: <Clock className="h-4 w-4" />,
  pending_approval: <AlertTriangle className="h-4 w-4" />,
  approved: <ThumbsUp className="h-4 w-4" />,
  payment_received: <CreditCard className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  rejected: <ThumbsDown className="h-4 w-4" />,
  cancelled: <AlertTriangle className="h-4 w-4" />
}

// Add a helper for card gradients/colors
const CARD_GRADIENTS: Record<WorkflowStatus, string> = {
  draft: 'from-gray-50 to-gray-100',
  pending_client_confirmation: 'from-blue-50 to-blue-100',
  pending_approval: 'from-yellow-50 to-yellow-100',
  approved: 'from-green-50 to-green-100',
  payment_received: 'from-purple-50 to-purple-100',
  confirmed: 'from-emerald-50 to-emerald-100',
  rejected: 'from-red-50 to-red-100',
  cancelled: 'from-slate-50 to-slate-100',
}
const CARD_ACCENTS: Record<WorkflowStatus, string> = {
  draft: 'bg-gray-400',
  pending_client_confirmation: 'bg-blue-400',
  pending_approval: 'bg-yellow-400',
  approved: 'bg-green-500',
  payment_received: 'bg-purple-500',
  confirmed: 'bg-emerald-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-slate-400',
}

// Example conversion rates (could be dynamic in future)
const STAGE_CONVERSION: Record<WorkflowStatus, number> = {
  draft: 0.2, // 20% of drafts convert
  pending_client_confirmation: 0.4, // 40%
  pending_approval: 0.7, // 70%
  approved: 0.95, // 95%
  payment_received: 1,
  confirmed: 1,
  rejected: 0,
  cancelled: 0,
}

export function QuotationWorkflowPipeline({ 
  quotations, 
  userRole, 
  onStatusUpdate, 
  isLoading = false 
}: QuotationWorkflowPipelineProps) {
  const [selectedQuotation, setSelectedQuotation] = useState<EnhancedQuotation | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState<string>('')
  const [comments, setComments] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [clientContactPerson, setClientContactPerson] = useState('')
  const [confirmationMethod, setConfirmationMethod] = useState('phone')
  const [clientExpectations, setClientExpectations] = useState('')
  const [simulateOverdue, setSimulateOverdue] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [customThresholds, setCustomThresholds] = useState<Partial<Record<WorkflowStatus, number>>>({})

  // Group quotations by status
  const quotationsByStatus = quotations.reduce((acc, quotation) => {
    const status = quotation.workflow_status
    if (!acc[status]) acc[status] = []
    acc[status].push(quotation)
    return acc
  }, {} as Record<WorkflowStatus, EnhancedQuotation[]>)

  // Calculate total value per stage
  const valueByStatus: Record<WorkflowStatus, number> = Object.fromEntries(
    Object.entries(quotationsByStatus).map(([status, qs]) => [status, qs.reduce((sum, q) => sum + (q.total_amount || 0), 0)])
  ) as Record<WorkflowStatus, number>

  // Default thresholds
  const DEFAULT_THRESHOLDS: Partial<Record<WorkflowStatus, number>> = {
    draft: 5,
    pending_client_confirmation: 3,
    pending_approval: 2,
  }

  // Use custom or default thresholds
  const getThreshold = (status: WorkflowStatus) =>
    customThresholds[status] ?? DEFAULT_THRESHOLDS[status] ?? 99

  // Helper: get days in current stage
  const getDaysInStage = (quotation: EnhancedQuotation) => {
    if (simulateOverdue) return 99 // Always overdue for testing
    const now = new Date()
    let stageDate: Date | null = null
    switch (quotation.workflow_status) {
      case 'draft':
        stageDate = new Date(quotation.created_at)
        break
      case 'pending_client_confirmation':
        stageDate = quotation.client_verbal_confirmation_date ? new Date(quotation.client_verbal_confirmation_date) : new Date(quotation.created_at)
        break
      case 'pending_approval':
        stageDate = quotation.approval?.approval_date ? new Date(quotation.approval.approval_date) : new Date(quotation.created_at)
        break
      case 'approved':
        stageDate = quotation.approval?.approval_date ? new Date(quotation.approval.approval_date) : new Date(quotation.created_at)
        break
      case 'payment_received':
        stageDate = quotation.payment_received_date ? new Date(quotation.payment_received_date) : new Date(quotation.created_at)
        break
      case 'confirmed':
        stageDate = quotation.post_sale_confirmation?.confirmation_date ? new Date(quotation.post_sale_confirmation.confirmation_date) : new Date(quotation.created_at)
        break
      default:
        stageDate = new Date(quotation.created_at)
    }
    return differenceInDays(now, stageDate)
  }

  // Detect overdue quotations per stage
  const overdueByStatus: Record<WorkflowStatus, number> = {
    draft: 0,
    pending_client_confirmation: 0,
    pending_approval: 0,
    approved: 0,
    payment_received: 0,
    confirmed: 0,
    rejected: 0,
    cancelled: 0
  }
  Object.entries(quotationsByStatus).forEach(([status, qs]) => {
    const threshold = getThreshold(status as WorkflowStatus)
    if (threshold) {
      overdueByStatus[status as WorkflowStatus] = qs.filter(q => getDaysInStage(q) >= threshold).length
    }
  })

  // Helper for aggressive business head insights
  const getAggressiveTooltip = (status: WorkflowStatus) => {
    const count = quotationsByStatus[status]?.length || 0
    const value = valueByStatus[status] || 0
    const overdue = overdueByStatus[status] || 0
    if (count === 0) return 'No quotations in this stage. Push your team!'
    if (overdue > 0) return `⚠️ ${overdue} overdue! ${count} quotations worth ₹${value.toLocaleString()} in this stage. Act now!`
    if (status === 'pending_approval' && count > 0) return `🔥 ${count} quotations worth ₹${value.toLocaleString()} need your approval! Don't let money wait!`
    if (status === 'pending_client_confirmation' && count > 0) return `⏳ ${count} quotations worth ₹${value.toLocaleString()} waiting for client confirmation. Follow up now!`
    if (status === 'approved' && count > 0) return `💸 ${count} quotations worth ₹${value.toLocaleString()} approved. Collect payment ASAP!`
    if (status === 'draft' && count > 0) return `✍️ ${count} drafts worth ₹${value.toLocaleString()}. Get these sent out!`
    if (status === 'payment_received' && count > 0) return `✅ ${count} paid, ₹${value.toLocaleString()} in the bank. Celebrate, but keep moving!`
    if (status === 'rejected' && count > 0) return `❌ ${count} lost, ₹${value.toLocaleString()} slipped away. Analyze and bounce back!`
    if (status === 'confirmed' && count > 0) return `🏆 ${count} confirmed, ₹${value.toLocaleString()} locked in. Great job!`
    if (status === 'cancelled' && count > 0) return `⚠️ ${count} cancelled, ₹${value.toLocaleString()} lost. Investigate why!`
    return `${count} quotations worth ₹${value.toLocaleString()} in this stage.`
  }

  const handleActionClick = (quotation: EnhancedQuotation, action: string) => {
    setSelectedQuotation(quotation)
    setCurrentAction(action)
    setActionDialogOpen(true)
    setComments('')
    setPaymentAmount('')
    setPaymentReference('')
    setClientContactPerson('')
    setClientExpectations('')
  }

  const handleActionSubmit = async () => {
    if (!selectedQuotation) return

    let actionData: any = {}

    if (currentAction === 'approve' || currentAction === 'reject') {
      actionData.comments = comments
    }

    if (currentAction === 'mark_payment_received') {
      actionData = {
        payment_amount: parseFloat(paymentAmount),
        payment_reference: paymentReference
      }
    }

    if (currentAction === 'confirm_post_sale') {
      actionData = {
        client_contact_person: clientContactPerson,
        confirmation_method: confirmationMethod,
        deliverables_confirmed: {}, // Could be enhanced with specific deliverable tracking
        event_details_confirmed: {},
        client_expectations: clientExpectations
      }
    }

    await onStatusUpdate(selectedQuotation.id, currentAction, actionData)
    setActionDialogOpen(false)
  }

  const getProgressValue = (status: WorkflowStatus): number => {
    const statusOrder: Record<WorkflowStatus, number> = {
      draft: 10,
      pending_client_confirmation: 20,
      pending_approval: 40,
      approved: 60,
      payment_received: 80,
      confirmed: 100,
      rejected: 0,
      cancelled: 0
    }
    return statusOrder[status] || 0
  }

  // Calculate forecast per stage
  const forecastByStage: { stage: string, value: number, probability: number }[] = [
    'draft',
    'pending_client_confirmation',
    'pending_approval',
    'approved',
  ].map(stage => ({
    stage: WORKFLOW_STATUS_LABELS[stage as WorkflowStatus],
    value: ((valueByStatus[stage as WorkflowStatus] || 0) * (STAGE_CONVERSION[stage as WorkflowStatus] || 0)),
    probability: STAGE_CONVERSION[stage as WorkflowStatus] || 0
  }))
  const totalForecast = forecastByStage.reduce((sum, s) => sum + s.value, 0)

  // Insights: total stuck in drafts
  const stuckInDrafts = valueByStatus['draft'] || 0
  // Top 3 clients to follow up (by value, in draft/pending_client_confirmation)
  const followUpCandidates = quotations
    .filter(q => ['draft', 'pending_client_confirmation'].includes(q.workflow_status))
    .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
    .slice(0, 3)
  // Average days in approval
  const approvalQuotations = quotations.filter(q => q.workflow_status === 'pending_approval')
  const avgDaysInApproval = approvalQuotations.length > 0 ?
    Math.round(approvalQuotations.reduce((sum, q) => sum + getDaysInStage(q), 0) / approvalQuotations.length) : 0

  // Team Performance Leaderboard data
  // Group quotations by sales rep (using client_name as placeholder for rep)
  const repStats: Record<string, {
    name: string,
    closedCount: number,
    closedValue: number,
    avgDaysToClose: number,
    overdue: number,
  }> = {}
  quotations.forEach(q => {
    const rep = q.client_name || 'Unknown'
    if (!repStats[rep]) {
      repStats[rep] = {
        name: rep,
        closedCount: 0,
        closedValue: 0,
        avgDaysToClose: 0,
        overdue: 0,
      }
    }
    // Closed = confirmed or approved
    if (['confirmed', 'approved'].includes(q.workflow_status)) {
      repStats[rep].closedCount += 1
      repStats[rep].closedValue += q.total_amount || 0
      // Days to close = from created_at to close date (if available)
      const closeDate = q.post_sale_confirmation?.confirmation_date || q.approval?.approval_date || q.created_at
      const days = differenceInDays(new Date(closeDate), new Date(q.created_at))
      repStats[rep].avgDaysToClose += days
    }
    // Overdue
    const threshold = getThreshold(q.workflow_status)
    if (threshold && getDaysInStage(q) >= threshold) {
      repStats[rep].overdue += 1
    }
  })
  // Finalize avgDaysToClose
  Object.values(repStats).forEach(rep => {
    if (rep.closedCount > 0) {
      rep.avgDaysToClose = Math.round(rep.avgDaysToClose / rep.closedCount)
    }
  })
  // Sort reps by closedValue desc
  const leaderboard = Object.values(repStats).sort((a, b) => b.closedValue - a.closedValue)

  return (
    <>
      {/* Pipeline Overview (top row, full width) */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {Object.entries(WORKFLOW_STATUS_LABELS).map(([status, label]) => {
            const count = quotationsByStatus[status as WorkflowStatus]?.length || 0
            const value = valueByStatus[status as WorkflowStatus] || 0
            const color = WORKFLOW_STATUS_COLORS[status as WorkflowStatus]
            const isAggressive = (status === 'pending_approval' || status === 'pending_client_confirmation' || status === 'draft') && count > 0
            const overdue = overdueByStatus[status as WorkflowStatus] || 0
            const gradient = CARD_GRADIENTS[status as WorkflowStatus]
            const accent = CARD_ACCENTS[status as WorkflowStatus]
            // Progress bar: percent of pipeline value in this stage
            const totalValue = Object.values(valueByStatus).reduce((a, b) => a + b, 0)
            const percent = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0
            return (
              <Tooltip key={status}>
                <TooltipTrigger asChild>
                  <div
                    className={`rounded-2xl shadow-md bg-gradient-to-br ${gradient} transition-all duration-200 border border-transparent hover:shadow-xl hover:-translate-y-1 relative group ${isAggressive ? 'ring-2 ring-red-500' : ''} ${overdue > 0 ? 'border-2 border-red-500 animate-pulse' : ''}`}
                    style={{ minWidth: 180 }}
                  >
                    <div className="flex flex-col items-center justify-center py-5 px-4">
                      <div className={`mb-2 text-2xl ${accent} rounded-full p-2 bg-opacity-20 flex items-center justify-center`}>
                        {statusIcons[status as WorkflowStatus]}
                      </div>
                      <div className="text-lg font-bold text-gray-900 mb-1">{label}</div>
                      <div className="text-4xl font-extrabold text-gray-800 mb-1">{count}</div>
                      <div className="text-base font-semibold text-green-700 mb-1">₹{value.toLocaleString()}</div>
                      <div className="text-xs text-gray-400 mb-2">{count === 1 ? 'quotation' : 'quotations'}</div>
                      {overdue > 0 && <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded animate-bounce font-bold">{overdue} Overdue</span>}
                    </div>
                    {/* Progress bar */}
                    <div className="absolute left-0 bottom-0 w-full h-1 rounded-b-2xl overflow-hidden">
                      <div className={`${accent} h-full transition-all duration-300`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {getAggressiveTooltip(status as WorkflowStatus)}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
      {/* Big Cards Row: Potential Revenue (left), Actionable Insights (right) */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 flex flex-col justify-center items-center border border-blue-200 transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]">
          <div className="text-lg font-semibold text-blue-900 mb-1 flex items-center gap-2">
            <span>Potential Revenue Forecast</span>
          </div>
          <div className="text-4xl font-extrabold text-blue-800 mb-2">₹{totalForecast.toLocaleString()}</div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {forecastByStage.map(s => (
              <div key={s.stage} className="flex flex-col items-center px-2">
                <span className="text-xs text-gray-500">{s.stage}</span>
                <span className="text-base font-bold text-blue-700">₹{Math.round(s.value).toLocaleString()}</span>
                <span className="text-xs text-gray-400">{Math.round(s.probability * 100)}% prob.</span>
              </div>
            ))}
          </div>
        </div>
        {/* Actionable Insights Card (same size, animated on hover) */}
        <div className="flex-1 rounded-2xl shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50 p-6 border border-blue-100 flex flex-col justify-center transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]">
          <div className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" /> Actionable Insights
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">₹{stuckInDrafts.toLocaleString()}</span>
              <span className="text-gray-600">stuck in Drafts</span>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" /> Top Clients to Follow Up
              </div>
              {followUpCandidates.length === 0 ? (
                <div className="text-xs text-gray-400">No clients to follow up right now.</div>
              ) : (
                <ul className="text-sm space-y-1">
                  {followUpCandidates.map(q => (
                    <li key={q.id} className="flex justify-between items-center">
                      <span>{q.client_name}</span>
                      <span className="font-bold text-blue-700">₹{q.total_amount?.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold">{avgDaysInApproval} days</span>
              <span className="text-gray-600">avg. in Approval</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-xl border">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="simulate-overdue"
              checked={simulateOverdue}
              onCheckedChange={setSimulateOverdue}
            />
            <Label htmlFor="simulate-overdue" className="text-sm font-medium">
              Simulate Overdue (Dev/Testing)
            </Label>
          </div>
          {simulateOverdue && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full animate-pulse">
              All quotations shown as overdue for testing
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Overdue Alert Banner */}
      {Object.values(overdueByStatus).some(count => count > 0) && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-bold text-red-800">⚠️ Bottleneck Alert:</span>
            <span className="text-red-700">
              {Object.entries(overdueByStatus)
                .filter(([_, count]) => count > 0)
                .map(([status, count]) => `${count} overdue in ${WORKFLOW_STATUS_LABELS[status as WorkflowStatus]}`)
                .join(', ')}. Take action now!
            </span>
          </div>
        </div>
      )}

      {/* Team Performance Leaderboard (full width) */}
      <div className="w-full mt-8">
        <div className="rounded-2xl shadow-lg bg-gradient-to-br from-yellow-50 to-blue-50 p-6 border border-yellow-100 max-w-3xl mx-auto transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]">
          <div className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" /> Team Performance Leaderboard
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="px-2 py-1 text-left">Rep</th>
                  <th className="px-2 py-1 text-right">Closed</th>
                  <th className="px-2 py-1 text-right">Value</th>
                  <th className="px-2 py-1 text-right">Avg Days</th>
                  <th className="px-2 py-1 text-right">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-4">No data yet.</td></tr>
                ) : (
                  leaderboard.map((rep, i) => (
                    <tr key={rep.name} className={`transition-all ${i < 3 ? 'bg-yellow-100/60 font-bold' : ''} hover:bg-blue-50`}>
                      <td className="px-2 py-2 flex items-center gap-2">
                        <UserCircle className="h-6 w-6 text-blue-400" />
                        <span>{rep.name}</span>
                        {i === 0 && <span className="ml-1 text-yellow-500">🥇</span>}
                        {i === 1 && <span className="ml-1 text-gray-400">🥈</span>}
                        {i === 2 && <span className="ml-1 text-orange-400">🥉</span>}
                      </td>
                      <td className="px-2 py-2 text-right">{rep.closedCount}</td>
                      <td className="px-2 py-2 text-right">₹{rep.closedValue.toLocaleString()}</td>
                      <td className="px-2 py-2 text-right">{rep.closedCount > 0 ? rep.avgDaysToClose : '-'}</td>
                      <td className="px-2 py-2 text-right">{rep.overdue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Quotation List (at the bottom) */}
      <div className="space-y-8 mt-8">
        {Object.entries(quotationsByStatus).map(([status, statusQuotations]) => {
          if (statusQuotations.length === 0) return null
          
          const statusLabel = WORKFLOW_STATUS_LABELS[status as WorkflowStatus]
          const statusColor = WORKFLOW_STATUS_COLORS[status as WorkflowStatus]
          const threshold = getThreshold(status as WorkflowStatus)
          
          return (
            <div key={status} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`bg-${statusColor}-50 text-${statusColor}-700 border-${statusColor}-200`}>
                  {statusIcons[status as WorkflowStatus]}
                  <span className="ml-2">{statusLabel}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {statusQuotations.length} {statusQuotations.length === 1 ? 'item' : 'items'}
                </span>
                {overdueByStatus[status as WorkflowStatus] > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded animate-bounce font-bold">
                    {overdueByStatus[status as WorkflowStatus]} Overdue
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusQuotations.map((quotation) => {
                  const permissions = getWorkflowPermissions(userRole, quotation.workflow_status)
                  const progressValue = getProgressValue(quotation.workflow_status)
                  const daysInStage = getDaysInStage(quotation)
                  const isOverdue = threshold && daysInStage >= threshold
                  
                  return (
                    <Card key={quotation.id} className={`relative ${isOverdue ? 'border-2 border-red-500 animate-pulse' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {quotation.client_name}
                              {isOverdue && <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded animate-bounce font-bold">Overdue {daysInStage}d</span>}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {quotation.bride_name} & {quotation.groom_name}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            ₹{quotation.total_amount?.toLocaleString() || '0'}
                          </Badge>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Timeline Info */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Created: {new Date(quotation.created_at).toLocaleDateString()}
                          </div>
                          {quotation.client_verbal_confirmation_date && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              Client Interest: {new Date(quotation.client_verbal_confirmation_date).toLocaleDateString()}
                            </div>
                          )}
                          {quotation.payment_received_date && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-3 w-3" />
                              Payment: {new Date(quotation.payment_received_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {permissions.can_submit_for_approval && (
                            <Button 
                              size="sm" 
                              onClick={() => handleActionClick(quotation, 'submit_for_approval')}
                              disabled={isLoading}
                              className={isOverdue ? 'bg-red-600 text-white animate-bounce' : ''}
                            >
                              {isOverdue ? 'Submit (Overdue!)' : 'Submit for Approval'}
                            </Button>
                          )}
                          
                          {permissions.can_approve && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleActionClick(quotation, 'approve')}
                              disabled={isLoading}
                              className={isOverdue ? 'bg-red-600 text-white animate-bounce' : ''}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {isOverdue ? 'Approve (Overdue!)' : 'Approve'}
                            </Button>
                          )}
                          
                          {permissions.can_reject && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleActionClick(quotation, 'reject')}
                              disabled={isLoading}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          )}
                          
                          {permissions.can_mark_payment_received && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleActionClick(quotation, 'mark_payment_received')}
                              disabled={isLoading}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          
                          {permissions.can_confirm_post_sale && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleActionClick(quotation, 'confirm_post_sale')}
                              disabled={isLoading}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                          )}

                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Overdue Threshold Settings</DialogTitle>
            <DialogDescription>
              Customize when quotations are considered overdue (in days)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="draft-threshold">Draft Stage</Label>
                <Input
                  id="draft-threshold"
                  type="number"
                  placeholder="5"
                  value={customThresholds.draft || ''}
                  onChange={(e) => setCustomThresholds(prev => ({
                    ...prev,
                    draft: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="client-threshold">Client Confirmation</Label>
                <Input
                  id="client-threshold"
                  type="number"
                  placeholder="3"
                  value={customThresholds.pending_client_confirmation || ''}
                  onChange={(e) => setCustomThresholds(prev => ({
                    ...prev,
                    pending_client_confirmation: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="approval-threshold">Pending Approval</Label>
                <Input
                  id="approval-threshold"
                  type="number"
                  placeholder="2"
                  value={customThresholds.pending_approval || ''}
                  onChange={(e) => setCustomThresholds(prev => ({
                    ...prev,
                    pending_approval: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Leave empty to use defaults: Draft (5 days), Client Confirmation (3 days), Approval (2 days)
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (outside main container) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'approve' && 'Approve Quotation'}
              {currentAction === 'reject' && 'Reject Quotation'}
              {currentAction === 'mark_payment_received' && 'Mark Payment Received'}
              {currentAction === 'confirm_post_sale' && 'Post-Sale Confirmation'}
              {currentAction === 'submit_for_approval' && 'Submit for Approval'}
            </DialogTitle>
            <DialogDescription>
              {selectedQuotation && `${selectedQuotation.client_name} - ${selectedQuotation.bride_name} & ${selectedQuotation.groom_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(currentAction === 'approve' || currentAction === 'reject') && (
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Add your comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            )}
            {currentAction === 'mark_payment_received' && (
              <>
                <div>
                  <Label htmlFor="payment_amount">Payment Amount</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    placeholder="Enter payment amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_reference">Payment Reference</Label>
                  <Input
                    id="payment_reference"
                    placeholder="Transaction ID, check number, etc."
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </div>
              </>
            )}
            {currentAction === 'confirm_post_sale' && (
              <>
                <div>
                  <Label htmlFor="client_contact">Client Contact Person</Label>
                  <Input
                    id="client_contact"
                    placeholder="Name of person contacted"
                    value={clientContactPerson}
                    onChange={(e) => setClientContactPerson(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmation_method">Confirmation Method</Label>
                  <select 
                    id="confirmation_method"
                    className="w-full p-2 border rounded"
                    value={confirmationMethod}
                    onChange={(e) => setConfirmationMethod(e.target.value)}
                  >
                    <option value="phone">Phone Call</option>
                    <option value="video_call">Video Call</option>
                    <option value="in_person">In Person</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="client_expectations">Client Expectations & Notes</Label>
                  <Textarea
                    id="client_expectations"
                    placeholder="What the client confirmed they expect..."
                    value={clientExpectations}
                    onChange={(e) => setClientExpectations(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleActionSubmit} disabled={isLoading}>
              {currentAction === 'approve' && 'Approve'}
              {currentAction === 'reject' && 'Reject'}
              {currentAction === 'mark_payment_received' && 'Mark as Paid'}
              {currentAction === 'confirm_post_sale' && 'Confirm'}
              {currentAction === 'submit_for_approval' && 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 