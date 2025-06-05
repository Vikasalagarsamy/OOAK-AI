"use client"

import React, { useState, useEffect } from "react"
import { format, isToday, isTomorrow, addDays, isPast, isThisWeek } from "date-fns"
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Video,
  Users,
  MessageSquare,
  Globe,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Play,
  FileText,
  Eye,
  Send,
  Edit,
  ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getFollowUps, updateFollowUpStatus, deleteFollowUp, updateFollowUpWithLeadStatus, syncQuotationStatusForLead } from "@/actions/follow-up-actions"
import { getSuggestedLeadStatuses } from "@/lib/follow-up-utils"
import type { FollowUpWithLead, FollowUpStatus, LeadStatus } from "@/types/follow-up"
import type { FollowupType } from "@/lib/follow-up-constants"
import { VALID_FOLLOWUP_TYPES } from "@/lib/follow-up-constants"
import { getQuotationByLeadId, type SavedQuotation } from "@/actions/quotations-actions"
import { getQuotationAction } from "@/lib/quotation-utils"

// Local followup type icons
const followupTypeIcons: Record<FollowupType, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  in_person: <Users className="h-4 w-4" />,
  video_call: <Video className="h-4 w-4" />,
  text_message: <MessageSquare className="h-4 w-4" />,
  social_media: <Globe className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
}

const statusColors: Record<FollowUpStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  missed: "bg-red-100 text-red-800",
  rescheduled: "bg-purple-100 text-purple-800",
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export function FollowUpList() {
  const [allFollowUps, setAllFollowUps] = useState<FollowUpWithLead[]>([])
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUpWithLead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpWithLead | null>(null)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [outcome, setOutcome] = useState("")
  const [duration, setDuration] = useState("")
  const [requireFollowUp, setRequireFollowUp] = useState(false)
  const [nextFollowUpDate, setNextFollowUpDate] = useState("")
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<LeadStatus | "">("")
  const [suggestedStatuses, setSuggestedStatuses] = useState<LeadStatus[]>([])
  const [quotationsMap, setQuotationsMap] = useState<Map<number, SavedQuotation>>(new Map())
  const [loadingQuotations, setLoadingQuotations] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFollowUps()
  }, [])

  useEffect(() => {
    // Load quotations for all leads when follow-ups are loaded
    if (allFollowUps.length > 0) {
      loadQuotationsForLeads()
    }
  }, [allFollowUps])

  // Smart filtering logic
  useEffect(() => {
    const now = new Date()
    let filtered: FollowUpWithLead[] = []

    switch (activeTab) {
      case "overdue":
        // Past scheduled follow-ups that aren't completed, cancelled, or missed
        filtered = allFollowUps.filter(f => 
          isPast(new Date(f.scheduled_at)) && 
          ["scheduled", "in_progress"].includes(f.status)
        )
        break
      
      case "today":
        // Follow-ups scheduled for today
        filtered = allFollowUps.filter(f => 
          isToday(new Date(f.scheduled_at)) && 
          ["scheduled", "in_progress"].includes(f.status)
        )
        break
      
      case "thisWeek": 
        // Follow-ups scheduled for this week
        filtered = allFollowUps.filter(f => 
          isThisWeek(new Date(f.scheduled_at)) && 
          ["scheduled", "in_progress"].includes(f.status)
        )
        break
      
      case "upcoming":
        // Future + current follow-ups that aren't done
        filtered = allFollowUps.filter(f => 
          !isPast(new Date(f.scheduled_at)) && 
          ["scheduled", "in_progress", "rescheduled"].includes(f.status)
        )
        break
      
      case "completed":
        filtered = allFollowUps.filter(f => f.status === "completed")
        break

      case "missed":
        filtered = allFollowUps.filter(f => f.status === "missed")
        break
      
      case "all":
      default:
        filtered = allFollowUps
    }

    // Sort by scheduled date
    filtered.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    setFilteredFollowUps(filtered)
  }, [allFollowUps, activeTab])

  const loadFollowUps = async () => {
    try {
      setLoading(true)
      setError(null)
      const followUps = await getFollowUps()
      setAllFollowUps(followUps)
    } catch (err) {
      console.error("Error loading follow-ups:", err)
      setError("Failed to load follow-ups")
    } finally {
      setLoading(false)
    }
  }

  const loadQuotationsForLeads = async () => {
    try {
      setLoadingQuotations(true)
      const quotationPromises = allFollowUps.map(async (followUp) => {
        if (followUp.lead_id) {
          const result = await getQuotationByLeadId(followUp.lead_id.toString())
          return { leadId: followUp.lead_id, quotation: result.quotation || null }
        }
        return { leadId: null, quotation: null }
      })

      const quotationResults = await Promise.all(quotationPromises)
      const newQuotationsMap = new Map<number, SavedQuotation>()
      
      quotationResults.forEach(({ leadId, quotation }) => {
        if (leadId && quotation) {
          newQuotationsMap.set(leadId, quotation)
        }
      })
      
      setQuotationsMap(newQuotationsMap)
    } catch (error) {
      console.error("Error loading quotations:", error)
    } finally {
      setLoadingQuotations(false)
    }
  }

  async function handleStatusUpdate(id: number, status: FollowUpStatus) {
    try {
      const result = await updateFollowUpStatus(id, status)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        loadFollowUps()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating follow-up status:", error)
      toast({
        title: "Error",
        description: "Failed to update follow-up status",
        variant: "destructive",
      })
    }
  }

  // Lead status options (only relevant statuses for follow-up completion)
  const leadStatusOptions: { value: LeadStatus; label: string; description: string }[] = [
    { value: "CONTACTED", label: "Contacted", description: "Initial contact made" },
    { value: "QUALIFIED", label: "Qualified", description: "Lead meets criteria" },
    { value: "PROPOSAL", label: "Proposal", description: "Proposal sent/prepared" },
    { value: "NEGOTIATION", label: "Negotiation", description: "In negotiation phase" },
    { value: "WON", label: "Won", description: "Deal closed successfully" },
    { value: "LOST", label: "Lost", description: "Deal lost to competitor/declined" },
    { value: "REJECTED", label: "Rejected", description: "Lead rejected" },
  ]

  // Check if next follow-up is required based on selected lead status
  const isNextFollowUpRequired = () => {
    // If no specific lead status is selected, use the current follow-up requirement
    if (!selectedLeadStatus) {
      return requireFollowUp
    }
    
    // Don't require follow-up for terminal statuses (business closed or rejected)
    return !["REJECTED", "LOST", "WON"].includes(selectedLeadStatus)
  }

  // Enhanced complete handler with lead status
  async function handleComplete() {
    if (!selectedFollowUp) return

    // Validation
    if (!outcome.trim()) {
      toast({
        title: "Error",
        description: "Please provide an outcome description",
        variant: "destructive",
      })
      return
    }

    // Check if next follow-up is required but not provided
    const nextFollowUpRequired = isNextFollowUpRequired()
    if (nextFollowUpRequired && !nextFollowUpDate) {
      toast({
        title: "Error", 
        description: "Next follow-up date is required for this lead status",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await updateFollowUpWithLeadStatus(selectedFollowUp.id, "completed", {
        completed_at: new Date().toISOString(),
        outcome,
        duration_minutes: duration ? Number.parseInt(duration) : undefined,
        follow_up_required: nextFollowUpRequired,
        next_follow_up_date: nextFollowUpRequired && nextFollowUpDate ? nextFollowUpDate : undefined,
        lead_status: selectedLeadStatus || undefined,
      })

      if (result.success) {
        // If lead status was updated to REJECTED or LOST, sync quotation status
        if (selectedLeadStatus && ['REJECTED', 'LOST'].includes(selectedLeadStatus) && selectedFollowUp.lead_id) {
          console.log(`Syncing quotation status for lead ${selectedFollowUp.lead_id}...`)
          const syncResult = await syncQuotationStatusForLead(selectedFollowUp.lead_id, selectedLeadStatus)
          
          if (syncResult.success && syncResult.message !== 'No quotation found to sync') {
            toast({
              title: "Success",
              description: `${result.message} ${syncResult.message}`,
            })
          } else {
            toast({
              title: "Success",
              description: result.message,
            })
          }
        } else {
          toast({
            title: "Success",
            description: result.message,
          })
        }
        
        setCompleteDialogOpen(false)
        resetCompleteForm()
        loadFollowUps()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error completing follow-up:", error)
      toast({
        title: "Error",
        description: "Failed to complete follow-up",
        variant: "destructive",
      })
    }
  }

  function resetCompleteForm() {
    setSelectedFollowUp(null)
    setOutcome("")
    setDuration("")
    setRequireFollowUp(false)
    setNextFollowUpDate("")
    setSelectedLeadStatus("")
    setSuggestedStatuses([])
  }

  // Update suggested statuses when outcome changes
  useEffect(() => {
    if (outcome) {
      const suggested = getSuggestedLeadStatuses(outcome)
      setSuggestedStatuses(suggested)
    } else {
      setSuggestedStatuses([])
    }
  }, [outcome])

  async function handleDelete() {
    if (!selectedFollowUp) return

    try {
      const result = await deleteFollowUp(selectedFollowUp.id)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setDeleteDialogOpen(false)
        setSelectedFollowUp(null)
        loadFollowUps()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting follow-up:", error)
      toast({
        title: "Error",
        description: "Failed to delete follow-up",
        variant: "destructive",
      })
    }
  }

  function getDateLabel(dateString: string) {
    const date = new Date(dateString)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "MMM d, yyyy")
  }

  const getTabCounts = () => {
    const now = new Date()
    return {
      overdue: allFollowUps.filter(f => 
        isPast(new Date(f.scheduled_at)) && 
        ["scheduled", "in_progress"].includes(f.status)
      ).length,
      today: allFollowUps.filter(f => 
        isToday(new Date(f.scheduled_at)) && 
        ["scheduled", "in_progress"].includes(f.status)
      ).length,
      thisWeek: allFollowUps.filter(f => 
        isThisWeek(new Date(f.scheduled_at)) && 
        ["scheduled", "in_progress"].includes(f.status)
      ).length,
      upcoming: allFollowUps.filter(f => 
        !isPast(new Date(f.scheduled_at)) && 
        ["scheduled", "in_progress", "rescheduled"].includes(f.status)
      ).length,
      completed: allFollowUps.filter(f => f.status === "completed").length,
      missed: allFollowUps.filter(f => f.status === "missed").length,
      all: allFollowUps.length,
    }
  }

  const counts = getTabCounts()

  const handleQuotationAction = (followUp: FollowUpWithLead, action: string, quotation?: SavedQuotation) => {
    switch (action) {
      case 'generate':
        window.location.href = `/sales/quotations/generate?leadId=${followUp.lead_id}&followUpId=${followUp.id}`
        break
      case 'view':
        if (quotation) {
          window.open(`/quotation/${quotation.slug}`, '_blank')
        }
        break
      case 'remind':
        // TODO: Implement send reminder functionality
        toast({
          title: "Reminder Feature",
          description: "Send reminder functionality will be implemented soon.",
        })
        break
      case 'follow-up':
        // TODO: Implement follow-up scheduling
        toast({
          title: "Follow-up Feature",
          description: "Advanced follow-up scheduling will be implemented soon.",
        })
        break
      case 'revise':
        if (quotation) {
          window.location.href = `/sales/quotations/edit/${quotation.id}`
        }
        break
      case 'contract':
        // TODO: Implement contract creation
        toast({
          title: "Contract Feature",
          description: "Contract creation functionality will be implemented soon.",
        })
        break
      case 'renew':
        window.location.href = `/sales/quotations/generate?leadId=${followUp.lead_id}&followUpId=${followUp.id}`
        break
      default:
        console.log('Unknown action:', action)
    }
  }

  function renderFollowUpCards() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading follow-ups...</p>
          </div>
        </div>
      )
    }

    if (filteredFollowUps.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No follow-ups found</h3>
          <p className="text-muted-foreground">
            {activeTab === "upcoming" 
              ? "You don't have any upcoming follow-ups scheduled."
              : `No follow-ups found for the ${activeTab} filter.`
            }
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {filteredFollowUps.map((followUp) => {
          const followupType = (followUp.contact_method || followUp.followup_type || "other") as FollowupType
          const icon = followupTypeIcons[followupType] || followupTypeIcons.other
          const scheduledDate = new Date(followUp.scheduled_at)
          const isOverdue = isPast(scheduledDate) && ["scheduled", "in_progress"].includes(followUp.status)

          return (
            <Card key={followUp.id} className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">{icon}</div>
                    <div>
                      <CardTitle className="text-lg font-medium">
                        {followUp.lead.client_name}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {getDateLabel(followUp.scheduled_at)} at {format(scheduledDate, "h:mm a")}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {followUp.lead.lead_number}
                        </Badge>
                        {/* Quotation Status Info */}
                        {(() => {
                          const quotation = followUp.lead_id ? quotationsMap.get(followUp.lead_id) : null
                          if (quotation) {
                            return (
                              <div className="flex items-center space-x-1">
                                <FileText className="h-3 w-3" />
                                <span>{quotation.quotation_number}</span>
                                <Badge 
                                  variant={
                                    quotation.status === 'approved' ? 'default' :
                                    quotation.status === 'sent' ? 'secondary' :
                                    quotation.status === 'draft' ? 'outline' :
                                    quotation.status === 'rejected' ? 'destructive' :
                                    quotation.status === 'expired' ? 'destructive' : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {quotation.status}
                                </Badge>
                              </div>
                            )
                          }
                          return (
                            <Badge variant="outline" className="text-xs text-gray-400">
                              No Quote
                            </Badge>
                          )
                        })()}
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            OVERDUE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={priorityColors[followUp.priority]}>
                      {followUp.priority}
                    </Badge>
                    <Badge className={statusColors[followUp.status]}>
                      {followUp.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {followUp.notes && (
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Notes:</strong> {followUp.notes}
                  </p>
                )}
                {followUp.interaction_summary && (
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Summary:</strong> {followUp.interaction_summary}
                  </p>
                )}
                {followUp.outcome && (
                  <p className="text-sm text-green-700 mb-3">
                    <strong>Outcome:</strong> {followUp.outcome}
                  </p>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex space-x-2">
                    {followUp.status === "scheduled" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(followUp.id, "in_progress")}
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedFollowUp(followUp)
                            setCompleteDialogOpen(true)
                          }}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Mark as Completed
                        </Button>
                      </>
                    )}

                    {followUp.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFollowUp(followUp)
                          setCompleteDialogOpen(true)
                        }}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Mark as Completed
                      </Button>
                    )}

                    {followUp.status === "missed" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedFollowUp(followUp)
                            setCompleteDialogOpen(true)
                          }}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Mark as Completed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(followUp.id, "rescheduled")}
                        >
                          <Calendar className="mr-1 h-3 w-3" />
                          Reschedule
                        </Button>
                      </>
                    )}

                    {["scheduled", "in_progress"].includes(followUp.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(followUp.id, "cancelled")}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    )}
                    
                    {/* Smart Quotation Action Button */}
                    {(() => {
                      const quotation = followUp.lead_id ? quotationsMap.get(followUp.lead_id) : null
                      const quotationAction = getQuotationAction(quotation || null)
                      
                      return (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={quotationAction.buttonVariant}
                            onClick={() => handleQuotationAction(followUp, quotationAction.action, quotation || undefined)}
                            className="flex items-center space-x-1"
                            title={quotationAction.description}
                          >
                            {quotationAction.action === 'generate' && <FileText className="h-3 w-3" />}
                            {quotationAction.action === 'view' && <Eye className="h-3 w-3" />}
                            {quotationAction.action === 'remind' && <Send className="h-3 w-3" />}
                            {quotationAction.action === 'revise' && <Edit className="h-3 w-3" />}
                            {quotationAction.action === 'contract' && <CheckCircle className="h-3 w-3" />}
                            {quotationAction.action === 'renew' && <FileText className="h-3 w-3" />}
                            <span>{quotationAction.buttonText}</span>
                          </Button>
                          
                          {/* Show quotation status indicator */}
                          {quotation && (
                            <div className="flex items-center space-x-1">
                              <Badge 
                                variant={
                                  quotation.status === 'approved' ? 'default' :
                                  quotation.status === 'sent' ? 'secondary' :
                                  quotation.status === 'draft' ? 'outline' :
                                  quotation.status === 'rejected' ? 'destructive' :
                                  quotation.status === 'expired' ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(`/quotation/${quotation.slug}`, '_blank')}
                                className="p-1 h-6 w-6"
                                title="View quotation"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFollowUp(followUp)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overdue" className="text-red-600">
            Overdue {counts.overdue > 0 && `(${counts.overdue})`}
          </TabsTrigger>
          <TabsTrigger value="today" className="text-blue-600">
            Today {counts.today > 0 && `(${counts.today})`}
          </TabsTrigger>
          <TabsTrigger value="thisWeek" className="text-purple-600">
            This Week {counts.thisWeek > 0 && `(${counts.thisWeek})`}
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming {counts.upcoming > 0 && `(${counts.upcoming})`}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed {counts.completed > 0 && `(${counts.completed})`}
          </TabsTrigger>
          <TabsTrigger value="missed">
            Missed {counts.missed > 0 && `(${counts.missed})`}
          </TabsTrigger>
          <TabsTrigger value="all">
            All {counts.all > 0 && `(${counts.all})`}
          </TabsTrigger>
        </TabsList>

        {["overdue", "today", "thisWeek", "upcoming", "completed", "missed", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {renderFollowUpCards()}
          </TabsContent>
        ))}
      </Tabs>

      {/* Enhanced Complete Follow-up Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Follow-up</DialogTitle>
            <DialogDescription>
              Mark this follow-up as completed and optionally update the lead status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedFollowUp && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium">{selectedFollowUp.lead.client_name}</div>
                <div className="text-sm text-muted-foreground">
                  Lead #{selectedFollowUp.lead.lead_number} • Current Status: {selectedFollowUp.lead.status || 'Not Set'}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="outcome">Outcome *</Label>
              <Textarea
                id="outcome"
                placeholder="Describe the outcome of this follow-up..."
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: Keywords like "interested", "qualified", "not interested" will suggest lead status updates
              </p>
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            {/* Lead Status Selection */}
            <div>
              <Label htmlFor="leadStatus">Update Lead Status (Optional)</Label>
              <Select value={selectedLeadStatus} onValueChange={(value) => setSelectedLeadStatus(value as LeadStatus | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current status" />
                </SelectTrigger>
                <SelectContent>
                  {leadStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {suggestedStatuses.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Suggested based on outcome:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedStatuses.map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setSelectedLeadStatus(status)}
                      >
                        {leadStatusOptions.find(opt => opt.value === status)?.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Smart follow-up scheduling based on lead status */}
            <div className="space-y-3">
              {isNextFollowUpRequired() ? (
                <>
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-700 font-medium">
                      Next follow-up is required for this lead status
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="nextFollowUpDate">Next Follow-up Date *</Label>
                    <Input
                      id="nextFollowUpDate"
                      type="datetime-local"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className={!nextFollowUpDate ? "border-red-300" : ""}
                    />
                    {!nextFollowUpDate && (
                      <p className="text-xs text-red-600 mt-1">This field is required</p>
                    )}
                  </div>
                </>
              ) : selectedLeadStatus && ["WON", "LOST", "REJECTED"].includes(selectedLeadStatus) ? (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700 font-medium">
                    {selectedLeadStatus === "WON" ? "Deal closed successfully - no follow-up needed!" : 
                     "Lead closed - no follow-up needed"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireFollowUp"
                    checked={requireFollowUp}
                    onCheckedChange={(checked) => setRequireFollowUp(checked as boolean)}
                  />
                  <Label htmlFor="requireFollowUp">Schedule another follow-up (optional)</Label>
                </div>
              )}

              {requireFollowUp && !isNextFollowUpRequired() && !selectedLeadStatus && (
                <div>
                  <Label htmlFor="nextFollowUpDate">Next Follow-up Date</Label>
                  <Input
                    id="nextFollowUpDate"
                    type="datetime-local"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCompleteDialogOpen(false)
              resetCompleteForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={!outcome.trim()}>
              Complete Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Follow-up Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Follow-up</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this follow-up? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
