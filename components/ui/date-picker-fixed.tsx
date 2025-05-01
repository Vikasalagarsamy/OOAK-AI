"use client"
import { format } from "date-fns"
import type React from "react"

import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCallback } from "react"

export interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  setDate,
  className,
  placeholder = "Select date",
  disabled = false,
}: DatePickerProps) {
  // Use a callback to handle date selection to prevent unnecessary re-renders
  const handleDateSelect = useCallback(
    (selectedDate: Date | undefined) => {
      console.log("Date selected in DatePicker:", selectedDate)
      setDate(selectedDate)
    },
    [setDate],
  )

  // Prevent event propagation to avoid any form submission
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button" // Explicitly set type to button to prevent form submission
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
          disabled={disabled}
          onClick={handleButtonClick}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
      </PopoverContent>
    </Popover>
  )
}
