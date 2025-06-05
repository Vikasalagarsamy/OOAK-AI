"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow, format, isToday, isPast, isThisWeek } from "date-fns"
import { CalendarIcon, PhoneIcon, MailIcon, VideoIcon, MessageSquareIcon, UsersIcon, ClockIcon } from "lucide-react"
import { getFollowUps, updateFollowUpStatus } from "@/actions/follow-up-actions"
import type { FollowUpWithLead, FollowUpStatus } from "@/types/follow-up"
import { toast } from "@/hooks/use-toast"

const contactMethodIcons = {
  phone: PhoneIcon,
  email: MailIcon,
  video_call: VideoIcon,
  text_message: MessageSquareIcon,
  in_person: UsersIcon,
  social_media: MessageSquareIcon,
  other: ClockIcon,
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  missed: "bg-red-100 text-red-800",
  rescheduled: "bg-purple-100 text-purple-800",
}

export function FollowUpList() {
  const [allFollowUps, setAllFollowUps] = useState<FollowUpWithLead[]>([])
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUpWithLead[]>([])
  const [activeTab, setActiveTab] = useState("upcoming")
  const [loading, setLoading] = useState(true)

  const loadFollowUps = async () => {
    try {
      setLoading(true)
      const data = await getFollowUps() // Get all follow-ups
      setAllFollowUps(data)
    } catch (error) {
      console.error("Error loading follow-ups:", error)
      toast({
        title: "Error",
        description: "Failed to load follow-ups. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
      
      case "all":
      default:
        filtered = allFollowUps
    }

    // Sort by scheduled date
    filtered.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    setFilteredFollowUps(filtered)
  }, [allFollowUps, activeTab])

  useEffect(() => {
    loadFollowUps()
  }, [])

  const handleStatusUpdate = async (id: number, status: FollowUpStatus) => {
    try {
      const result = await updateFollowUpStatus(id, status)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        loadFollowUps() // Reload data
      } else {
        toast({
          title: "Error", 
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating follow-up:", error)
      toast({
        title: "Error",
        description: "Failed to update follow-up. Please try again.",
        variant: "destructive",
      })
    }
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
      all: allFollowUps.length,
    }
  }

  const counts = getTabCounts()

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading follow-ups...</div>
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overdue" className="text-red-600">
            Overdue {counts.overdue > 0 && `(${counts.overdue})`}
          </TabsTrigger>
          <TabsTrigger value="today" className="text-blue-600">
            Today {counts.today > 0 && `(${counts.today})`}
          </TabsTrigger>
          <TabsTrigger value="thisWeek" className="text-purple-600">
            This Week {counts.thisWeek > 0 && `(${counts.thisWeek})`}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-green-600">
            Upcoming {counts.upcoming > 0 && `(${counts.upcoming})`}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed {counts.completed > 0 && `(${counts.completed})`}
          </TabsTrigger>
          <TabsTrigger value="all">
            All {counts.all > 0 && `(${counts.all})`}
          </TabsTrigger>
        </TabsList>

        {["overdue", "today", "thisWeek", "upcoming", "completed", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {filteredFollowUps.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No follow-ups found for this filter.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFollowUps.map((followUp) => {
                  const ContactIcon = contactMethodIcons[followUp.contact_method as keyof typeof contactMethodIcons] || ClockIcon
                  const scheduledDate = new Date(followUp.scheduled_at)
                  const isOverdue = isPast(scheduledDate) && ["scheduled", "in_progress"].includes(followUp.status)

                  return (
                    <Card key={followUp.id} className={isOverdue ? "border-red-200 bg-red-50" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ContactIcon className="h-4 w-4" />
                            <CardTitle className="text-lg">
                              {followUp.lead.client_name}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {followUp.lead.lead_number}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={priorityColors[followUp.priority as keyof typeof priorityColors]}>
                              {followUp.priority}
                            </Badge>
                            <Badge className={statusColors[followUp.status as keyof typeof statusColors]}>
                              {followUp.status}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {format(scheduledDate, "MMM dd, yyyy 'at' h:mm a")}
                          </span>
                          <span className="text-xs">
                            ({formatDistanceToNow(scheduledDate, { addSuffix: true })})
                          </span>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              OVERDUE
                            </Badge>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {followUp.notes && (
                          <p className="text-sm text-muted-foreground mb-3">{followUp.notes}</p>
                        )}
                        {followUp.interaction_summary && (
                          <p className="text-sm mb-3">{followUp.interaction_summary}</p>
                        )}
                        {followUp.outcome && (
                          <p className="text-sm text-green-700 mb-3">
                            <strong>Outcome:</strong> {followUp.outcome}
                          </p>
                        )}
                        <div className="flex gap-2">
                          {followUp.status === "scheduled" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(followUp.id, "in_progress")}
                              >
                                Start
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(followUp.id, "completed")}
                              >
                                Complete
                              </Button>
                            </>
                          )}
                          {followUp.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(followUp.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                          {followUp.status === "completed" && followUp.follow_up_required && (
                            <Badge variant="secondary" className="text-xs">
                              Next follow-up required
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
} 