"use client"

import { useState, useEffect } from "react"
import { EmployeeDataControls } from "@/components/people/employee-data-controls"
import { EmployeeDataView } from "@/components/people/employee-data-view"

interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  email: string
  job_title: string
  hire_date: string
  status: string
  department_name: string
  branch_name: string
}

interface PeopleDashboardProps {
  employeeData: any[]
}

export function PeopleDashboard({ employeeData: initialEmployeeData }: PeopleDashboardProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "first_name", direction: "asc" })
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    branch: "",
    jobTitle: "",
    company: "",
  })
  const [employees, setEmployees] = useState<Employee[]>(initialEmployeeData || [])

  useEffect(() => {
    setEmployees(initialEmployeeData || [])
  }, [initialEmployeeData])

  const handleSort = (key: string) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      status: "",
      department: "",
      branch: "",
      jobTitle: "",
      company: "",
    })
  }

  const sortedAndFilteredData = () => {
    let filtered = [...employees]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((employee) => {
        const searchStr =
          `${employee.first_name} ${employee.last_name} ${employee.employee_id} ${employee.email}`.toLowerCase()
        return searchStr.includes(searchTerm.toLowerCase())
      })
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((employee) => employee.status === filters.status)
    }

    // Apply department filter
    if (filters.department) {
      filtered = filtered.filter((employee) => employee.department_name === filters.department)
    }

    // Apply job title filter
    if (filters.jobTitle) {
      filtered = filtered.filter((employee) => employee.job_title === filters.jobTitle)
    }

    // Apply branch filter
    if (filters.branch) {
      filtered = filtered.filter((employee) => employee.branch_name === filters.branch)
    }

    // Apply company filter
    if (filters.company) {
      filtered = filtered.filter((employee) => employee.primary_company_name === filters.company)
    }

    // Sort the filtered data
    filtered.sort((a, b) => {
      const key = sortConfig.key as keyof Employee
      const aValue = a[key] || ""
      const bValue = b[key] || ""

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

    return filtered
  }

  const sortedAndFiltered = sortedAndFilteredData()

  // Extract unique values for filters
  const departments = [...new Set(employees.map((employee) => employee.department_name).filter(Boolean))] as string[]
  const branches = [...new Set(employees.map((employee) => employee.branch_name).filter(Boolean))] as string[]
  const jobTitles = [...new Set(employees.map((employee) => employee.job_title).filter(Boolean))] as string[]
  const companies = [...new Set(employees.map((employee) => employee.primary_company_name).filter(Boolean))] as string[]
  const statuses = [...new Set(employees.map((employee) => employee.status).filter(Boolean))] as string[]

  return (
    <div className="space-y-4">
      <EmployeeDataControls
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        handleFilterChange={handleFilterChange}
        clearFilters={clearFilters}
        departments={departments}
        branches={branches}
        jobTitles={jobTitles}
        companies={companies}
        statuses={statuses}
        totalCount={employees.length}
        filteredCount={sortedAndFiltered.length}
      />
      <EmployeeDataView data={sortedAndFiltered} viewMode={viewMode} sortConfig={sortConfig} onSort={handleSort} />
    </div>
  )
}
