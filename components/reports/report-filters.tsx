"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Filter, ChevronDown, ChevronUp } from "lucide-react"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { subDays } from "date-fns"

interface ReportFiltersProps {
  onFilterChange?: (filters: any) => void
  showSourceFilter?: boolean
  showEmployeeFilter?: boolean
  showStatusFilter?: boolean
}

export function ReportFilters({
  onFilterChange,
  showSourceFilter = true,
  showEmployeeFilter = true,
  showStatusFilter = true,
}: ReportFiltersProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded)
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Report Filters</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleFilters}>
          {filtersExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Filters
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show Filters
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center mb-2">
        <span className="text-sm mr-2">Date Range:</span>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={(range) => {
            setDateRange(range)
            onFilterChange?.({ dateRange: range })
          }}
        />
      </div>

      {filtersExpanded && (
        <div className="space-y-4 mt-4 pt-4 border-t">
          {showSourceFilter && (
            <div>
              <h4 className="text-sm font-medium mb-2">Lead Sources</h4>
              <div className="text-sm text-muted-foreground">
                Lead source filters will be implemented in the next phase
              </div>
            </div>
          )}

          {showEmployeeFilter && (
            <div>
              <h4 className="text-sm font-medium mb-2">Sales Representatives</h4>
              <div className="text-sm text-muted-foreground">
                Employee filters will be implemented in the next phase
              </div>
            </div>
          )}

          {showStatusFilter && (
            <div>
              <h4 className="text-sm font-medium mb-2">Lead Status</h4>
              <div className="text-sm text-muted-foreground">Status filters will be implemented in the next phase</div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm">
              Reset
            </Button>
            <Button size="sm">Apply Filters</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
