"use client"

import type React from "react"

import { format, isAfter, isSameDay } from "date-fns"
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
  MoreHorizontal,
  ExternalLink,
} from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { FollowUpWithLead } from "@/types/follow-up"

const followupTypeIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  in_person: <Users className="h-4 w-4" />,
  video_call: <Video className="h-4 w-4" />,
  text_message: <MessageSquare className="h-4 w-4" />,
  social_media: <Globe className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
}

const statusColors: Record<string, string> = {
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

interface FollowUpCardProps {
  followUp: FollowUpWithLead
  onView: () => void
  onComplete: () => void
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
}

export function FollowUpCard({ followUp, onView, onComplete, selected = false, onSelectChange }: FollowUpCardProps) {
  const isOverdue = followUp.status === "scheduled" && isAfter(new Date(), new Date(followUp.scheduled_at))

  const isToday = isSameDay(new Date(followUp.scheduled_at), new Date())

  return (
    <Card className={`overflow-hidden ${selected ? "border-primary" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {onSelectChange && <Checkbox checked={selected} onCheckedChange={onSelectChange} className="mt-1" />}

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{followUp.lead?.client_name || "Unknown Client"}</h3>
                <Badge variant="outline" className="text-xs">
                  {followUp.lead?.lead_number || "No Lead #"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={statusColors[followUp.status]}>
                  {followUp.status.charAt(0).toUpperCase() + followUp.status.slice(1)}
                </Badge>

                <Badge className={priorityColors[followUp.priority]}>
                  {followUp.priority.charAt(0).toUpperCase() + followUp.priority.slice(1)}
                </Badge>

                {isOverdue && (
                  <Badge variant="destructive" className="ml-2">
                    Overdue
                  </Badge>
                )}

                {isToday && followUp.status === "scheduled" && (
                  <Badge variant="secondary" className="ml-2">
                    Today
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Calendar className="mr-1 h-4 w-4" />
              <span className="mr-3">{format(new Date(followUp.scheduled_at), "MMM d, yyyy")}</span>

              <Clock className="mr-1 h-4 w-4" />
              <span className="mr-3">{format(new Date(followUp.scheduled_at), "h:mm a")}</span>

              <span className="flex items-center">
                {followupTypeIcons[followUp.followup_type] || <HelpCircle className="mr-1 h-4 w-4" />}
                <span className="ml-1 capitalize">{followUp.followup_type.replace(/_/g, " ")}</span>
              </span>
            </div>

            {followUp.interaction_summary && <p className="text-sm mb-2">{followUp.interaction_summary}</p>}

            {followUp.notes && (
              <div className="text-sm text-muted-foreground mt-2">
                <p className="line-clamp-2">{followUp.notes}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onView}>
                <ExternalLink className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </TooltipTrigger>
            <TooltipContent>View follow-up details</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {followUp.status === "scheduled" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="sm" onClick={onComplete}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Complete
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark this follow-up as completed</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>View Details</DropdownMenuItem>
            {followUp.status === "scheduled" && (
              <>
                <DropdownMenuItem onClick={onComplete}>Mark as Completed</DropdownMenuItem>
                <DropdownMenuItem>Reschedule</DropdownMenuItem>
                <DropdownMenuItem>Cancel Follow-up</DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem>View Lead</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
