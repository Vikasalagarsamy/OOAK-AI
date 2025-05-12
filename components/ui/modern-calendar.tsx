"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { addMonths, subMonths, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface ModernCalendarProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  minDate?: Date
  className?: string
  highlightedDates?: Date[]
}

export function ModernCalendar({
  selectedDate,
  onDateSelect,
  minDate = new Date(),
  className,
  highlightedDates = [],
}: ModernCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [yearSelectOpen, setYearSelectOpen] = React.useState(false)
  const [monthSelectOpen, setMonthSelectOpen] = React.useState(false)

  // Get current year and month
  const currentYear = currentMonth.getFullYear()
  const currentMonthNumber = currentMonth.getMonth()

  // Generate years for selection (5 years back, 10 years forward)
  const years = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 5 + i)

  // Month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1))
  }

  // Handle year selection
  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(Number.parseInt(year))
    setCurrentMonth(newDate)
  }

  // Handle month selection
  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(months.indexOf(month))
    setCurrentMonth(newDate)
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    // Get first day of the month
    const firstDayOfMonth = new Date(currentYear, currentMonthNumber, 1)
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    // Get the number of days in the month
    const daysInMonth = new Date(currentYear, currentMonthNumber + 1, 0).getDate()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total cells needed (previous month days + current month days + potential next month days)
    const totalCells = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7

    // Generate calendar cells
    const days = []

    // Previous month days
    const prevMonth = subMonths(firstDayOfMonth, 1)
    const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate()

    for (let i = 0; i < daysFromPrevMonth; i++) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - daysFromPrevMonth + i + 1)
      days.push({ date, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonthNumber, i)
      days.push({ date, isCurrentMonth: true })
    }

    // Next month days
    const remainingCells = totalCells - days.length
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(currentYear, currentMonthNumber + 1, i)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Check if a date is disabled (before minDate)
  const isDateDisabled = (date: Date) => {
    if (!minDate) return false
    return date < new Date(minDate.setHours(0, 0, 0, 0))
  }

  // Check if a date is highlighted
  const isHighlighted = (date: Date) => {
    return highlightedDates.some((highlightedDate) => isSameDay(date, highlightedDate))
  }

  return (
    <div className={cn("p-3 bg-white rounded-lg shadow-sm border", className)}>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={goToPreviousMonth}
          disabled={subMonths(currentMonth, 1) < minDate}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>

        <div className="flex items-center space-x-1">
          <Select value={months[currentMonthNumber]} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 w-[110px] text-sm font-medium">
              <SelectValue placeholder={months[currentMonthNumber]} />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month} className="text-sm">
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 w-[80px] text-sm font-medium">
              <SelectValue placeholder={currentYear.toString()} />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()} className="text-sm">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
          const isDisabled = isDateDisabled(date)
          const dateIsToday = isToday(date)
          const isDateHighlighted = isHighlighted(date)

          return (
            <button
              key={index}
              type="button"
              onClick={() => !isDisabled && onDateSelect(date)}
              disabled={isDisabled}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center text-sm transition-colors relative",
                isCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                isDisabled && "opacity-50 cursor-not-allowed",
                !isDisabled && !isSelected && "hover:bg-accent",
                isSelected && "bg-primary text-primary-foreground font-medium",
                dateIsToday && !isSelected && "border border-primary text-primary font-medium",
                isDateHighlighted && !isSelected && "bg-amber-100",
              )}
            >
              {date.getDate()}
              {isDateHighlighted && !isSelected && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500"></span>
              )}
            </button>
          )
        })}
      </div>

      {/* Today button */}
      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => {
            const today = new Date()
            if (!isDateDisabled(today)) {
              onDateSelect(today)
              setCurrentMonth(today)
            }
          }}
          disabled={isDateDisabled(new Date())}
        >
          <CalendarIcon className="mr-1 h-3 w-3" />
          Today
        </Button>
      </div>
    </div>
  )
}
