"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, isToday, isTomorrow, addDays } from "date-fns"
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
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

import { getFollowUps, updateFollowUpStatus, deleteFollowUp } from "@/actions/follow-up-actions"
import type { FollowUpWithLead, FollowUpStatus, FollowUpType } from "@/types/follow-up"

const followupTypeIcons: Record<FollowUpType, React.ReactNode> = {
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
  const [followUps, setFollowUps] = useState<FollowUpWithLead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpWithLead | null>(null)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [outcome, setOutcome] = useState("")
  const [duration, setDuration] = useState("")
  const [requireFollowUp, setRequireFollowUp] = useState(false)
  const [nextFollowUpDate, setNextFollowUpDate] = useState("")

  useEffect(() => {
    loadFollowUps()
  }, [activeTab])

  async function loadFollowUps() {
    setLoading(true)
    try {
      const filters: any = {}

      switch (activeTab) {
        case "upcoming":
          filters.status = "scheduled"
          break
        case "completed":
          filters.status = "completed"
          break
        case "missed":
          filters.status = "missed"
          break
        case "all":
          // No filters
          break
        default:
          filters.status = "scheduled"
      }

      const data = await getFollowUps(filters)
      setFollowUps(data)
    } catch (error) {
      console.error("Error loading follow-ups:", error)
      toast({
        title: "Error",
        description: "Failed to load follow-ups",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  async function handleComplete() {
    if (!selectedFollowUp) return

    try {
      const result = await updateFollowUpStatus(selectedFollowUp.id, "completed", {
        completed_at: new Date().toISOString(),
        outcome,
        duration_minutes: duration ? Number.parseInt(duration) : undefined,
        follow_up_required: requireFollowUp,
        next_follow_up_date: requireFollowUp && nextFollowUpDate ? nextFollowUpDate : undefined,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setCompleteDialogOpen(false)
        setSelectedFollowUp(null)
        setOutcome("")
        setDuration("")
        setRequireFollowUp(false)
        setNextFollowUpDate("")
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
    if (isToday(date)) {
      return "Today"
    } else if (isTomorrow(date)) {
      return "Tomorrow"
    } else {
      return format(date, "MMM d, yyyy")
    }
  }

  function renderFollowUpCards() {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <p>Loading follow-ups...</p>
        </div>
      )
    }

    if (followUps.length === 0) {
      return (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">No follow-ups found</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {followUps.map((followUp) => (
          <Card key={followUp.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{followUp.lead.client_name}</CardTitle>
                  <CardDescription>Lead #{followUp.lead.lead_number}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {followUp.status === "scheduled" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFollowUp(followUp)
                            setCompleteDialogOpen(true)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(followUp.id, "in_progress")}>
                          <Clock className="h-4 w-4 mr-2" />
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(followUp.id, "cancelled")}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Follow-up
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(followUp.id, "missed")}>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Mark as Missed
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedFollowUp(followUp)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{getDateLabel(followUp.scheduled_at)}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{format(new Date(followUp.scheduled_at), "h:mm a")}</span>
                </div>

                <div className="flex items-center text-sm">
                  <span className="mr-2">{followupTypeIcons[followUp.followup_type as FollowUpType]}</span>
                  <span className="capitalize">{followUp.followup_type.replace("_", " ")}</span>
                </div>

                {followUp.interaction_summary && <p className="text-sm mt-2">{followUp.interaction_summary}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Badge className={statusColors[followUp.status as FollowUpStatus]}>
                {followUp.status.charAt(0).toUpperCase() + followUp.status.slice(1)}
              </Badge>

              <Badge className={priorityColors[followUp.priority]}>
                {followUp.priority.charAt(0).toUpperCase() + followUp.priority.slice(1)} Priority
              </Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="missed">Missed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {renderFollowUpCards()}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderFollowUpCards()}
        </TabsContent>
        <TabsContent value="missed" className="mt-4">
          {renderFollowUpCards()}
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          {renderFollowUpCards()}
        </TabsContent>
      </Tabs>

      {/* Complete Follow-up Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Follow-up</DialogTitle>
            <DialogDescription>
              Record the outcome of this follow-up with {selectedFollowUp?.lead.client_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Textarea
                id="outcome"
                placeholder="What was the result of this follow-up?"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="How long did this follow-up take?"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireFollowUp"
                checked={requireFollowUp}
                onCheckedChange={(checked) => setRequireFollowUp(checked as boolean)}
              />
              <Label htmlFor="requireFollowUp">Requires another follow-up</Label>
            </div>

            {requireFollowUp && (
              <div className="grid gap-2">
                <Label htmlFor="nextFollowUpDate">Next Follow-up Date</Label>
                <Input
                  id="nextFollowUpDate"
                  type="datetime-local"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  min={format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete}>Complete Follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Follow-up Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
