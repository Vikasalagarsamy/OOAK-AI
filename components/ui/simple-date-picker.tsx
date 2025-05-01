"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface SimpleDatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function SimpleDatePicker({ date, setDate, placeholder = "Select date", className }: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close the calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Handle window resize to ensure calendar stays in viewport
    const handleResize = () => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const calendarEl = containerRef.current.querySelector('[role="grid"]')
        if (calendarEl) {
          // Adjust position if needed based on viewport
          const viewportHeight = window.innerHeight
          const bottomSpace = viewportHeight - rect.bottom

          // Log positioning for debugging
          console.log("Calendar positioning:", {
            bottomSpace,
            calendarHeight: calendarEl.clientHeight,
          })
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      window.addEventListener("resize", handleResize)
      // Initial position check
      setTimeout(handleResize, 50)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("resize", handleResize)
    }
  }, [isOpen])

  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setIsOpen(false)
  }

  // Function to ensure calendar is properly positioned
  const ensureCalendarInViewport = () => {
    if (!isOpen || !containerRef.current) return

    // Add a small delay to allow the calendar to render
    setTimeout(() => {
      const containerRect = containerRef.current?.getBoundingClientRect()
      const calendarEl = containerRef.current?.querySelector(".react-calendar")

      if (containerRect && calendarEl) {
        const calendarRect = calendarEl.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth

        // Check if calendar extends beyond bottom of viewport
        if (containerRect.bottom + calendarRect.height > viewportHeight) {
          // Position above if there's more space
          if (containerRect.top > viewportHeight - containerRect.bottom) {
            calendarEl.style.top = "auto"
            calendarEl.style.bottom = "100%"
            calendarEl.style.marginTop = "0"
            calendarEl.style.marginBottom = "8px"
          }
        }

        // Check if calendar extends beyond right edge of viewport
        if (containerRect.left + calendarRect.width > viewportWidth) {
          calendarEl.style.left = "auto"
          calendarEl.style.right = "0"
        }
      }
    }, 50)
  }

  // Use layout effect to handle positioning immediately after render
  useLayoutEffect(() => {
    if (isOpen) {
      const calendarEl = containerRef.current?.querySelector('[role="grid"]')
      if (calendarEl) {
        // Ensure calendar cells are properly aligned
        const cells = calendarEl.querySelectorAll('[role="gridcell"]')
        cells.forEach((cell) => {
          ;(cell as HTMLElement).style.display = "flex"
          ;(cell as HTMLElement).style.alignItems = "center"
          ;(cell as HTMLElement).style.justifyContent = "center"
        })
      }
    }
  }, [isOpen])

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            // Schedule positioning check after opening
            setTimeout(ensureCalendarInViewport, 50)
          }
        }}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : placeholder}
      </Button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 rounded-md border bg-popover shadow-md p-3"
          style={{
            top: "calc(100% + 4px)",
            left: 0,
            width: "auto",
          }}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            className="rounded-md border-0"
          />
        </div>
      )}
    </div>
  )
}
