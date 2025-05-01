"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { format, isSameMonth } from "date-fns"
import { Button } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

interface CalendarNewProps {
  date: Date
  setDate: (date: Date) => void
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      onDayClick={(day, modifiers, e) => {
        // Prevent the event from bubbling up to parent elements
        e.stopPropagation()
      }}
      {...props}
    />
  )
}

function CalendarNew({ date, setDate }: CalendarNewProps) {
  const [month, setMonth] = React.useState(date)

  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const firstDayOfMonth = new Date(date.getFullYear(), month.getMonth(), 1)
  const lastDayOfMonth = new Date(date.getFullYear(), month.getMonth() + 1, 0)
  const prevMonth = new Date(date.getFullYear(), month.getMonth() - 1, 1)
  const nextMonth = new Date(date.getFullYear(), month.getMonth() + 1, 1)
  const canGoToPreviousMonth = month > new Date(2000, 0, 1)
  const canGoToNextMonth = month < new Date(2100, 0, 1)

  const onMonthChange = (newMonth: Date) => {
    setMonth(newMonth)
  }

  const onSelect = (day: Date) => {
    setDate(day)
  }

  const generateDays = () => {
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const firstDayOfWeek = firstDayOfMonth.getDay()

    const days = []

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i))
    }

    return days
  }

  const daysArray = generateDays()

  return (
    <div className="border rounded-md p-2 w-[300px] shadow-sm">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center">
          <Button
            variant="outline"
            className={cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              !canGoToPreviousMonth && "cursor-not-allowed opacity-25",
            )}
            disabled={!canGoToPreviousMonth}
            onClick={() => onMonthChange(prevMonth)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
        </div>
        <div className="text-sm font-medium">{format(firstDayOfMonth, "MMMM yyyy")}</div>
        <div className="flex items-center">
          <Button
            variant="outline"
            className={cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              !canGoToNextMonth && "cursor-not-allowed opacity-25",
            )}
            disabled={!canGoToNextMonth}
            onClick={() => onMonthChange(nextMonth)}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {days.map((day, index) => (
          <div key={day + index} className="h-8 w-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysArray.map((day, index) => {
          if (!day) {
            return <div key={index} />
          }

          const dateObj = new Date(day)
          const isSelected =
            isSameMonth(dateObj, date) &&
            dateObj.getTime() === new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
          const isToday = dateObj.toDateString() === new Date().toDateString()
          const disabled = dateObj > lastDayOfMonth
          const month = firstDayOfMonth.getMonth()
          const isFirstOrLastOfMonth = dateObj.getDate() === 1 || dateObj.getDate() === lastDayOfMonth.getDate()

          return (
            <button
              type="button"
              role="gridcell"
              key={dateObj.toString()}
              tabIndex={-1}
              className={cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md text-center",
                isFirstOrLastOfMonth && "text-muted-foreground",
                isToday && "bg-accent text-accent-foreground",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected &&
                  !isToday &&
                  dateObj.getMonth() === month &&
                  "hover:bg-accent hover:text-accent-foreground",
                !isSelected &&
                  !isToday &&
                  dateObj.getMonth() !== month &&
                  "hover:bg-accent/50 hover:text-accent-foreground",
                disabled && "text-muted-foreground opacity-50 cursor-not-allowed",
              )}
              disabled={disabled}
              aria-selected={isSelected}
              onClick={() => onSelect(dateObj)}
            >
              {dateObj.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar, CalendarNew }
