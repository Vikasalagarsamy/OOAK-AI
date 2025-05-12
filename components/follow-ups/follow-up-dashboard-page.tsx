"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { format, isAfter, isBefore, parseISO } from "date-fns"
import { Calendar, Clock, Filter, Search, Bell, CheckCircle, AlertCircle, RefreshCw, ChevronDown } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { getFollowUps, updateFollowUpStatus } from "@/actions/follow-up-actions"
import { FollowUpCard } from "@/components/follow-ups/follow-up-card"
import { FollowUpDetailsDialog } from "@/components/follow-ups/follow-up-details-dialog"
import { FollowUpStatsCards } from "@/components/follow-ups/follow-up-stats-cards"
import { FollowUpCalendarView } from "@/components/follow-ups/follow-up-calendar-view"
import { FollowUpNotificationSettings } from "@/components/follow-ups/follow-up-notification-settings"
import { FollowUpBulkActions } from "@/components/follow-ups/follow-up-bulk-actions"
import type { FollowUpWithLead, FollowUpStatus } from "@/types/follow-up"

export function FollowUpDashboardPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "upcoming"

  const [activeTab, setActiveTab] = useState(initialTab)
  const [followUps, setFollowUps] = useState<FollowUpWithLead[]>([])
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUpWithLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpWithLead | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  // Filters
  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  // Sorting
  const [sortField, setSortField] = useState<string>("scheduled_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadFollowUps()
  }, [activeTab])

  useEffect(() => {
    applyFilters()
  }, [followUps, searchTerm, statusFilter, typeFilter, priorityFilter, dateRange, sortField, sortDirection])

  async function loadFollowUps() {
    setLoading(true)
    setError(null)

    try {
      const filters: any = {}

      switch (activeTab) {
        case "upcoming":
          filters.status = "scheduled"
          break
        case "completed":
          filters.status = "completed"
          break
        case "overdue":
          filters.status = "scheduled"
          // We'll filter overdue items client-side
          break
        case "all":
          // No status filter
          break
        default:
          filters.status = "scheduled"
      }

      const data = await getFollowUps(filters)
      setFollowUps(data)
    } catch (error) {
      console.error("Error loading follow-ups:", error)
      setError("Failed to load follow-ups. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...followUps]

    // Filter by tab-specific criteria
    if (activeTab === "overdue") {
      filtered = filtered.filter(
        (item) => item.status === "scheduled" && isAfter(new Date(), parseISO(item.scheduled_at)),
      )
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          (item.lead?.client_name && item.lead.client_name.toLowerCase().includes(search)) ||
          (item.lead?.lead_number && item.lead.lead_number.toLowerCase().includes(search)) ||
          (item.interaction_summary && item.interaction_summary.toLowerCase().includes(search)) ||
          (item.notes && item.notes.toLowerCase().includes(search)),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.followup_type === typeFilter)
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((item) => item.priority === priorityFilter)
    }

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter(
        (item) =>
          isAfter(parseISO(item.scheduled_at), dateRange.from!) ||
          format(parseISO(item.scheduled_at), "yyyy-MM-dd") === format(dateRange.from!, "yyyy-MM-dd"),
      )
    }

    if (dateRange.to) {
      filtered = filtered.filter(
        (item) =>
          isBefore(parseISO(item.scheduled_at), dateRange.to!) ||
          format(parseISO(item.scheduled_at), "yyyy-MM-dd") === format(dateRange.to!, "yyyy-MM-dd"),
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any = a[sortField as keyof typeof a]
      let valueB: any = b[sortField as keyof typeof b]

      // Handle nested properties for lead data
      if (sortField === "client_name") {
        valueA = a.lead?.client_name
        valueB = b.lead?.client_name
      } else if (sortField === "lead_number") {
        valueA = a.lead?.lead_number
        valueB = b.lead?.lead_number
      }

      // Handle date comparison
      if (sortField === "scheduled_at" || sortField === "created_at" || sortField === "completed_at") {
        valueA = valueA ? new Date(valueA).getTime() : 0
        valueB = valueB ? new Date(valueB).getTime() : 0
      }

      // Handle string comparison
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }

      // Handle number comparison
      if (sortDirection === "asc") {
        return (valueA || 0) - (valueB || 0)
      } else {
        return (valueB || 0) - (valueA || 0)
      }
    })

    setFilteredFollowUps(filtered)
  }

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  function handleTabChange(value: string) {
    setActiveTab(value)
    setCurrentPage(1)
    setSelectedItems([])
  }

  function handleViewFollowUp(followUp: FollowUpWithLead) {
    setSelectedFollowUp(followUp)
    setDetailsDialogOpen(true)
  }

  async function handleMarkComplete(id: number) {
    try {
      const result = await updateFollowUpStatus(id, "completed")

      if (result.success) {
        toast({
          title: "Success",
          description: "Follow-up marked as completed",
        })
        loadFollowUps()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to update follow-up",
        })
      }
    } catch (error) {
      console.error("Error updating follow-up:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    }
  }

  function handleSelectItem(id: number, selected: boolean) {
    if (selected) {
      setSelectedItems((prev) => [...prev, id])
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id))
    }
  }

  function handleSelectAll(selected: boolean) {
    if (selected) {
      setSelectedItems(filteredFollowUps.map((item) => item.id))
    } else {
      setSelectedItems([])
    }
  }

  function handleBulkAction(action: string) {
    if (selectedItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No items selected",
        description: "Please select at least one follow-up to perform this action",
      })
      return
    }

    // Implement bulk actions (complete, reschedule, delete)
    switch (action) {
      case "complete":
        // Implementation for bulk complete
        toast({
          title: "Bulk action",
          description: `Marked ${selectedItems.length} follow-ups as completed`,
        })
        break
      case "reschedule":
        // Implementation for bulk reschedule
        toast({
          title: "Bulk action",
          description: `Rescheduled ${selectedItems.length} follow-ups`,
        })
        break
      case "delete":
        // Implementation for bulk delete
        toast({
          title: "Bulk action",
          description: `Deleted ${selectedItems.length} follow-ups`,
        })
        break
    }

    // Reset selection after bulk action
    setSelectedItems([])
    loadFollowUps()
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredFollowUps.length / itemsPerPage)
  const paginatedFollowUps = filteredFollowUps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" onClick={loadFollowUps} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Follow-up Management</h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setNotificationSettingsOpen(true)}>
            <Bell className="mr-2 h-4 w-4" />
            Notification Settings
          </Button>

          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}>
            {viewMode === "list" ? (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar View
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                List View
              </>
            )}
          </Button>

          <Button variant="default" size="sm" onClick={loadFollowUps}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <FollowUpStatsCards />

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search follow-ups..."
                className="pl-8 w-[200px] sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Statuses
                    {statusFilter === "all" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("scheduled")}>
                    Scheduled
                    {statusFilter === "scheduled" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                    Completed
                    {statusFilter === "completed" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
                    Cancelled
                    {statusFilter === "cancelled" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">Follow-up Type</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                    All Types
                    {typeFilter === "all" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("phone")}>
                    Phone Call
                    {typeFilter === "phone" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("email")}>
                    Email
                    {typeFilter === "email" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("in_person")}>
                    In Person
                    {typeFilter === "in_person" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("video_call")}>
                    Video Call
                    {typeFilter === "video_call" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">Priority</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
                    All Priorities
                    {priorityFilter === "all" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
                    High
                    {priorityFilter === "high" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
                    Medium
                    {priorityFilter === "medium" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
                    Low
                    {priorityFilter === "low" && <CheckCircle className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <p className="text-xs font-medium mb-2">Date Range</p>
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <FollowUpBulkActions
            selectedCount={selectedItems.length}
            onAction={handleBulkAction}
            onClearSelection={() => setSelectedItems([])}
          />
        )}

        <div className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-6 w-1/4" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <TabsContent value={activeTab} className="mt-0">
              {viewMode === "list" ? (
                <>
                  {paginatedFollowUps.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No follow-ups found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {paginatedFollowUps.map((followUp) => (
                        <FollowUpCard
                          key={followUp.id}
                          followUp={followUp}
                          onView={() => handleViewFollowUp(followUp)}
                          onComplete={() => handleMarkComplete(followUp.id)}
                          selected={selectedItems.includes(followUp.id)}
                          onSelectChange={(selected) => handleSelectItem(followUp.id, selected)}
                        />
                      ))}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                            {Math.min(currentPage * itemsPerPage, filteredFollowUps.length)} of{" "}
                            {filteredFollowUps.length} follow-ups
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <FollowUpCalendarView followUps={filteredFollowUps} onViewFollowUp={handleViewFollowUp} />
              )}
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Follow-up Details Dialog */}
      {selectedFollowUp && (
        <FollowUpDetailsDialog
          followUp={selectedFollowUp}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onStatusChange={loadFollowUps}
        />
      )}

      {/* Notification Settings Dialog */}
      <FollowUpNotificationSettings open={notificationSettingsOpen} onOpenChange={setNotificationSettingsOpen} />
    </div>
  )
}
