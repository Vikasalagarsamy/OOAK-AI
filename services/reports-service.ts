import { createClient } from "@/lib/supabase"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

// Shared interface for report filters
export interface ReportFilters {
  dateRange?: DateRange
  leadSourceIds?: number[]
  employeeIds?: number[]
  statuses?: string[]
  companyIds?: number[]
  branchIds?: number[]
}

// Lead source report data
export async function getLeadSourceReportData(filters: ReportFilters = {}) {
  const supabase = createClient()

  try {
    let query = supabase.from("leads").select(`
        id,
        lead_number,
        status,
        created_at,
        updated_at,
        lead_source_id,
        lead_sources(id, name),
        assigned_to,
        employees:assigned_to(id, first_name, last_name)
      `)

    // Apply date filters if provided
    if (filters.dateRange?.from) {
      const fromDate = format(filters.dateRange.from, "yyyy-MM-dd")
      query = query.gte("created_at", fromDate)
    }

    if (filters.dateRange?.to) {
      const toDate = format(filters.dateRange.to, "yyyy-MM-dd")
      query = query.lte("created_at", toDate)
    }

    // Apply other filters
    if (filters.leadSourceIds?.length) {
      query = query.in("lead_source_id", filters.leadSourceIds)
    }

    if (filters.employeeIds?.length) {
      query = query.in("assigned_to", filters.employeeIds)
    }

    if (filters.statuses?.length) {
      query = query.in("status", filters.statuses)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching lead source report data:", error)
    return []
  }
}

// Conversion funnel report data
export async function getConversionFunnelData(filters: ReportFilters = {}) {
  const supabase = createClient()

  try {
    let query = supabase
      .from("leads")
      .select(`
        status,
        count(*),
        lead_source_id,
        lead_sources(name)
      `)
      .groupBy("status, lead_source_id, lead_sources.name")

    // Apply date filters if provided
    if (filters.dateRange?.from) {
      const fromDate = format(filters.dateRange.from, "yyyy-MM-dd")
      query = query.gte("created_at", fromDate)
    }

    if (filters.dateRange?.to) {
      const toDate = format(filters.dateRange.to, "yyyy-MM-dd")
      query = query.lte("created_at", toDate)
    }

    // Apply other filters
    if (filters.leadSourceIds?.length) {
      query = query.in("lead_source_id", filters.leadSourceIds)
    }

    const { data, error } = await query

    if (error) throw error

    // Process data for funnel visualization
    const statusOrder = ["NEW", "ASSIGNED", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]

    // Sort by status order
    data?.sort((a, b) => {
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
    })

    return data || []
  } catch (error) {
    console.error("Error fetching conversion funnel data:", error)
    return []
  }
}

// Team performance report data
export async function getTeamPerformanceData(filters: ReportFilters = {}) {
  const supabase = createClient()

  try {
    let query = supabase
      .from("leads")
      .select(`
        assigned_to,
        employees:assigned_to(id, first_name, last_name),
        status,
        count(*)
      `)
      .not("assigned_to", "is", null)
      .groupBy("assigned_to, employees.id, employees.first_name, employees.last_name, status")

    // Apply date filters if provided
    if (filters.dateRange?.from) {
      const fromDate = format(filters.dateRange.from, "yyyy-MM-dd")
      query = query.gte("created_at", fromDate)
    }

    if (filters.dateRange?.to) {
      const toDate = format(filters.dateRange.to, "yyyy-MM-dd")
      query = query.lte("created_at", toDate)
    }

    // Apply other filters
    if (filters.employeeIds?.length) {
      query = query.in("assigned_to", filters.employeeIds)
    }

    if (filters.statuses?.length) {
      query = query.in("status", filters.statuses)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching team performance data:", error)
    return []
  }
}

// Trend analysis report data
export async function getTrendAnalysisData(filters: ReportFilters = {}) {
  const supabase = createClient()

  try {
    // For trend analysis, we need to group by date
    const query = supabase.rpc("get_lead_trends_by_date", {
      start_date: filters.dateRange?.from ? format(filters.dateRange.from, "yyyy-MM-dd") : undefined,
      end_date: filters.dateRange?.to ? format(filters.dateRange.to, "yyyy-MM-dd") : undefined,
      source_ids: filters.leadSourceIds || [],
      employee_ids: filters.employeeIds || [],
      status_list: filters.statuses || [],
    })

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching trend analysis data:", error)
    return []
  }
}

// Get filter options (lead sources, employees, etc.)
export async function getReportFilterOptions() {
  const supabase = createClient()

  try {
    // Fetch lead sources
    const { data: leadSources, error: leadSourcesError } = await supabase
      .from("lead_sources")
      .select("id, name")
      .order("name")

    if (leadSourcesError) throw leadSourcesError

    // Fetch employees
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .order("first_name")

    if (employeesError) throw employeesError

    // Fetch companies
    const { data: companies, error: companiesError } = await supabase.from("companies").select("id, name").order("name")

    if (companiesError) throw companiesError

    // Fetch branches
    const { data: branches, error: branchesError } = await supabase.from("branches").select("id, name").order("name")

    if (branchesError) throw branchesError

    return {
      leadSources: leadSources || [],
      employees: employees || [],
      companies: companies || [],
      branches: branches || [],
      statuses: [
        "NEW",
        "ASSIGNED",
        "CONTACTED",
        "QUALIFIED",
        "PROPOSAL",
        "NEGOTIATION",
        "WON",
        "LOST",
        "REJECTED",
        "UNASSIGNED",
      ],
    }
  } catch (error) {
    console.error("Error fetching report filter options:", error)
    return {
      leadSources: [],
      employees: [],
      companies: [],
      branches: [],
      statuses: [],
    }
  }
}
