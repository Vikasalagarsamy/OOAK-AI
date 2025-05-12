"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { FollowUpWithLead } from "@/types/follow-up"

interface FollowUpCalendarViewProps {
  followUps: FollowUpWithLead[]
  onViewFollowUp: (followUp: FollowUpWithLead) => void
}

export function FollowUpCalendarView({ followUps, onViewFollowUp }: FollowUpCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const getFollowUpsForDay = (day: Date) => {
    return followUps.filter((followUp) => isSameDay(parseISO(followUp.scheduled_at), day))
  }

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    in_progress: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    completed: "bg-green-100 text-green-800 hover:bg-green-200",
    cancelled: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    missed: "bg-red-100 text-red-800 hover:bg-red-200",
    rescheduled: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Follow-up Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div key={`empty-start-${index}`} className="h-24 p-1 border border-dashed rounded-md opacity-50" />
          ))}

          {monthDays.map((day) => {
            const dayFollowUps = getFollowUpsForDay(day)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                className={`h-24 p-1 border rounded-md ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{format(day, "d")}</span>
                  {dayFollowUps.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {dayFollowUps.length}
                    </Badge>
                  )}
                </div>

                {dayFollowUps.length > 0 && (
                  <ScrollArea className="h-[calc(100%-20px)]">
                    <div className="space-y-1">
                      {dayFollowUps.map((followUp) => (
                        <button
                          key={followUp.id}
                          className={`w-full text-left px-1.5 py-0.5 text-xs rounded ${
                            statusColors[followUp.status] || "bg-gray-100"
                          }`}
                          onClick={() => onViewFollowUp(followUp)}
                        >
                          <div className="truncate">
                            {format(parseISO(followUp.scheduled_at), "h:mm a")} - {followUp.lead?.client_name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )
          })}

          {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
            <div key={`empty-end-${index}`} className="h-24 p-1 border border-dashed rounded-md opacity-50" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
