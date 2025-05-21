"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Plus } from "lucide-react"
import type { BugFilterParams } from "@/types/bug"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface BugFiltersProps {
  initialFilters: BugFilterParams
}

export function BugFilters({ initialFilters }: BugFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [filters, setFilters] = useState<BugFilterParams>(initialFilters)
  const [searchInput, setSearchInput] = useState(initialFilters.search || "")

  // Apply filters when they change
  const applyFilters = () => {
    const queryParams = new URLSearchParams()

    if (filters.status) {
      queryParams.set("status", filters.status)
    }

    if (filters.severity) {
      queryParams.set("severity", filters.severity)
    }

    if (filters.assignee_id) {
      queryParams.set("assignee", filters.assignee_id)
    }

    if (filters.search) {
      queryParams.set("search", filters.search)
    }

    router.push(`${pathname}?${queryParams.toString()}`)
  }

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setFilters((prev) => ({ ...prev, search: value || undefined }))
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({})
    setSearchInput("")
    router.push(pathname)
  }

  // Apply filters when they change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      applyFilters()
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [filters])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Filter Bugs</h2>
        <Link href="/admin/bugs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Bug
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select
                value={filters.severity || ""}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, severity: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bugs..."
                  className="pl-8"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full">
                <X className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
