"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, LayoutList, LayoutGrid, Download, Filter } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EmployeeDataControlsProps {
  viewMode: "table" | "cards"
  setViewMode: (mode: "table" | "cards") => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  filters: {
    status: string
    department: string
    branch: string
    jobTitle: string
    company: string
  }
  handleFilterChange: (filterType: string, value: string) => void
  clearFilters: () => void
  departments: string[]
  branches: string[]
  jobTitles: string[]
  companies: string[]
  statuses: string[]
  totalCount: number
  filteredCount: number
}

export function EmployeeDataControls({
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  filters,
  handleFilterChange,
  clearFilters,
  departments,
  branches,
  jobTitles,
  companies,
  statuses,
  totalCount,
  filteredCount,
}: EmployeeDataControlsProps) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const exportToCSV = () => {
    // Implementation for CSV export would go here
    console.log("Export to CSV")
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
              aria-label="Search employees"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[130px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.department || "all"}
              onValueChange={(value) => handleFilterChange("department", value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[150px]" aria-label="Filter by department">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.jobTitle || "all"}
              onValueChange={(value) => handleFilterChange("jobTitle", value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[150px]" aria-label="Filter by job title">
                <SelectValue placeholder="Job Title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Titles</SelectItem>
                {jobTitles.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Advanced Filters */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 relative" aria-label="Advanced filters">
                      <Filter className="h-4 w-4" aria-hidden="true" />
                      {activeFilterCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                        >
                          {activeFilterCount}
                        </Badge>
                      )}
                      <span className="sr-only">Advanced filters</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[220px]">
                    <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <div className="p-2">
                      <p className="text-xs text-muted-foreground mb-1">Branch</p>
                      <Select
                        value={filters.branch || "all"}
                        onValueChange={(value) => handleFilterChange("branch", value === "all" ? "" : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-2">
                      <p className="text-xs text-muted-foreground mb-1">Company</p>
                      <Select
                        value={filters.company || "all"}
                        onValueChange={(value) => handleFilterChange("company", value === "all" ? "" : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Companies</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearFilters} className="justify-center text-center">
                      Clear all filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>Advanced filters</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* View Toggle */}
          <TooltipProvider>
            <div className="border rounded-md flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => setViewMode("table")}
                    aria-label="Table view"
                    aria-pressed={viewMode === "table"}
                  >
                    <LayoutList className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Table view</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Table view</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setViewMode("cards")}
                    aria-label="Card view"
                    aria-pressed={viewMode === "cards"}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Card view</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Card view</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Export */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={exportToCSV}
                  aria-label="Export to CSV"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Export data</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export to CSV</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Active Filters */}
      {(activeFilterCount > 0 || searchTerm) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchTerm}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSearchTerm("")}
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Remove search filter</span>
              </Button>
            </Badge>
          )}

          {filters.status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace("_", " ")}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleFilterChange("status", "")}
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Remove status filter</span>
              </Button>
            </Badge>
          )}

          {filters.department && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Department: {filters.department}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleFilterChange("department", "")}
                aria-label="Remove department filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Remove department filter</span>
              </Button>
            </Badge>
          )}

          {filters.jobTitle && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Job Title: {filters.jobTitle}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleFilterChange("jobTitle", "")}
                aria-label="Remove job title filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Remove job title filter</span>
              </Button>
            </Badge>
          )}

          {filters.branch && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Branch: {filters.branch}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleFilterChange("branch", "")}
                aria-label="Remove branch filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Remove branch filter</span>
              </Button>
            </Badge>
          )}

          {filters.company && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Company: {filters.company}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleFilterChange("company", "")}
                aria-label="Remove company filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Remove company filter</span>
              </Button>
            </Badge>
          )}

          {(activeFilterCount > 0 || searchTerm) && (
            <Button variant="ghost" size="sm" className="h-7" onClick={clearFilters} aria-label="Clear all filters">
              Clear all
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount} employees
          </div>
        </div>
      )}
    </div>
  )
}
