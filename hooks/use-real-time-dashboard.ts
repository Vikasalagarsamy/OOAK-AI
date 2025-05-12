"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export type DashboardStats = {
  companies: {
    count: number
    trend: { isPositive: boolean; value: number }
  }
  branches: {
    count: number
    trend: { isPositive: boolean; value: number }
  }
  employees: {
    count: number
    trend: { isPositive: boolean; value: number }
  }
  clients: {
    count: number
    trend: { isPositive: boolean; value: number }
  }
}

export type DashboardActivity = {
  id: string
  title: string
  description: string
  timestamp: string
  type?: string
  user?: {
    name: string
    initials: string
  }
}

export type DashboardData = {
  stats: DashboardStats
  recentActivities: DashboardActivity[]
  employeesByDepartment: Array<{ department: string; count: number }>
  branchesByCompany: Array<{ company: string; count: number }>
  employeeGrowth: Array<{ month: string; count: number }>
}

export function useRealTimeDashboard(initialData?: Partial<DashboardData>) {
  const [data, setData] = useState<DashboardData>({
    stats: initialData?.stats || {
      companies: { count: 0, trend: { isPositive: true, value: 0 } },
      branches: { count: 0, trend: { isPositive: true, value: 0 } },
      employees: { count: 0, trend: { isPositive: true, value: 0 } },
      clients: { count: 0, trend: { isPositive: true, value: 0 } },
    },
    recentActivities: initialData?.recentActivities || [],
    employeesByDepartment: initialData?.employeesByDepartment || [],
    branchesByCompany: initialData?.branchesByCompany || [],
    employeeGrowth: initialData?.employeeGrowth || [],
  })

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let supabase

    try {
      supabase = createClient()
      setStatus("connecting")

      // Subscribe to companies table changes
      const companiesSubscription = supabase
        .channel("companies-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, async (payload) => {
          try {
            // Fetch updated company count
            const { count: companyCount } = await supabase.from("companies").select("*", { count: "exact", head: true })

            // Calculate trend (simplified for demo)
            const trend = {
              isPositive: true,
              value: Math.floor(Math.random() * 10), // In a real app, calculate actual trend
            }

            setData((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                companies: {
                  count: companyCount || prev.stats.companies.count,
                  trend,
                },
              },
            }))

            setLastUpdated(new Date())

            // Add to activities if it's a new company
            if (payload.eventType === "INSERT") {
              const newActivity = {
                id: payload.new.id,
                title: "New Company Added",
                description: `${payload.new.name} was added to the system`,
                timestamp: "Just now",
                type: "company",
                user: {
                  name: "System",
                  initials: "SY",
                },
              }

              setData((prev) => ({
                ...prev,
                recentActivities: [newActivity, ...prev.recentActivities.slice(0, 9)],
              }))
            }
          } catch (error) {
            console.error("Error processing company update:", error)
          }
        })

      // Subscribe to branches table changes
      const branchesSubscription = supabase
        .channel("branches-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, async (payload) => {
          try {
            // Fetch updated branch count
            const { count: branchCount } = await supabase.from("branches").select("*", { count: "exact", head: true })

            // Calculate trend (simplified for demo)
            const trend = {
              isPositive: true,
              value: Math.floor(Math.random() * 8), // In a real app, calculate actual trend
            }

            setData((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                branches: {
                  count: branchCount || prev.stats.branches.count,
                  trend,
                },
              },
            }))

            setLastUpdated(new Date())

            // Add to activities if it's a new branch
            if (payload.eventType === "INSERT") {
              const newActivity = {
                id: payload.new.id,
                title: "New Branch Added",
                description: `${payload.new.name} branch was created`,
                timestamp: "Just now",
                type: "branch",
                user: {
                  name: "System",
                  initials: "SY",
                },
              }

              setData((prev) => ({
                ...prev,
                recentActivities: [newActivity, ...prev.recentActivities.slice(0, 9)],
              }))
            }
          } catch (error) {
            console.error("Error processing branch update:", error)
          }
        })

      // Subscribe to employees table changes
      const employeesSubscription = supabase
        .channel("employees-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, async (payload) => {
          try {
            // Fetch updated employee count
            const { count: employeeCount } = await supabase
              .from("employees")
              .select("*", { count: "exact", head: true })

            // Calculate trend (simplified for demo)
            const trend = {
              isPositive: true,
              value: Math.floor(Math.random() * 5), // In a real app, calculate actual trend
            }

            setData((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                employees: {
                  count: employeeCount || prev.stats.employees.count,
                  trend,
                },
              },
            }))

            setLastUpdated(new Date())

            // Add to activities if it's a new employee
            if (payload.eventType === "INSERT") {
              const newActivity = {
                id: payload.new.id,
                title: "New Employee Added",
                description: `${payload.new.first_name} ${payload.new.last_name} joined the team`,
                timestamp: "Just now",
                type: "employee",
                user: {
                  name: "System",
                  initials: "SY",
                },
              }

              setData((prev) => ({
                ...prev,
                recentActivities: [newActivity, ...prev.recentActivities.slice(0, 9)],
              }))
            }
          } catch (error) {
            console.error("Error processing employee update:", error)
          }
        })

      // Subscribe to clients table changes
      const clientsSubscription = supabase
        .channel("clients-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, async (payload) => {
          try {
            // Fetch updated client count
            const { count: clientCount } = await supabase.from("clients").select("*", { count: "exact", head: true })

            // Calculate trend (simplified for demo)
            const trend = {
              isPositive: true,
              value: Math.floor(Math.random() * 12), // In a real app, calculate actual trend
            }

            setData((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                clients: {
                  count: clientCount || prev.stats.clients.count,
                  trend,
                },
              },
            }))

            setLastUpdated(new Date())

            // Add to activities if it's a new client
            if (payload.eventType === "INSERT") {
              const newActivity = {
                id: payload.new.id,
                title: "New Client Added",
                description: `${payload.new.name} was added as a client`,
                timestamp: "Just now",
                type: "client",
                user: {
                  name: "System",
                  initials: "SY",
                },
              }

              setData((prev) => ({
                ...prev,
                recentActivities: [newActivity, ...prev.recentActivities.slice(0, 9)],
              }))
            }
          } catch (error) {
            console.error("Error processing client update:", error)
          }
        })

      // Subscribe to activities table changes
      const activitiesSubscription = supabase
        .channel("activities-changes")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "activities" }, (payload) => {
          try {
            // Format the new activity
            const newActivity = {
              id: payload.new.id,
              title: payload.new.title || `${formatActionType(payload.new.action_type)} ${payload.new.entity_type}`,
              description: payload.new.description,
              timestamp: "Just now",
              type: payload.new.entity_type,
              user: payload.new.user_name
                ? {
                    name: payload.new.user_name,
                    initials: getInitials(payload.new.user_name),
                  }
                : undefined,
            }

            // Add the new activity to the top of the list
            setData((prev) => ({
              ...prev,
              recentActivities: [newActivity, ...prev.recentActivities.slice(0, 9)],
            }))

            setLastUpdated(new Date())
          } catch (error) {
            console.error("Error processing activity update:", error)
          }
        })

      // Subscribe to department distribution changes
      const departmentSubscription = supabase
        .channel("department-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "employee_departments" }, async () => {
          try {
            // Fetch updated department distribution
            const { data: departments } = await supabase.from("departments").select("id, name")

            if (departments && departments.length > 0) {
              const departmentCounts = await Promise.all(
                departments.map(async (dept) => {
                  const { count } = await supabase
                    .from("employee_departments")
                    .select("*", { count: "exact", head: true })
                    .eq("department_id", dept.id)

                  return {
                    department: dept.name,
                    count: count || 0,
                  }
                }),
              )

              setData((prev) => ({
                ...prev,
                employeesByDepartment: departmentCounts,
              }))

              setLastUpdated(new Date())
            }
          } catch (error) {
            console.error("Error processing department distribution update:", error)
          }
        })

      // Subscribe to company-branch distribution changes
      const companyBranchSubscription = supabase
        .channel("company-branch-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, async () => {
          try {
            // Fetch updated company-branch distribution
            const { data: companies } = await supabase.from("companies").select("id, name")

            if (companies && companies.length > 0) {
              const branchCounts = await Promise.all(
                companies.map(async (company) => {
                  const { count } = await supabase
                    .from("branches")
                    .select("*", { count: "exact", head: true })
                    .eq("company_id", company.id)

                  return {
                    company: company.name,
                    count: count || 0,
                  }
                }),
              )

              setData((prev) => ({
                ...prev,
                branchesByCompany: branchCounts,
              }))

              setLastUpdated(new Date())
            }
          } catch (error) {
            console.error("Error processing company-branch distribution update:", error)
          }
        })

      // Start all subscriptions
      Promise.all([
        companiesSubscription.subscribe(),
        branchesSubscription.subscribe(),
        employeesSubscription.subscribe(),
        clientsSubscription.subscribe(),
        activitiesSubscription.subscribe(),
        departmentSubscription.subscribe(),
        companyBranchSubscription.subscribe(),
      ])
        .then(() => {
          setStatus("connected")
          toast({
            title: "Real-time updates enabled",
            description: "Dashboard will update automatically as data changes",
          })
        })
        .catch((error) => {
          console.error("Error subscribing to real-time updates:", error)
          setStatus("error")
          toast({
            title: "Real-time updates failed",
            description: "Could not connect to real-time updates. Data may be stale.",
            variant: "destructive",
          })
        })

      // Clean up subscriptions on unmount
      return () => {
        companiesSubscription.unsubscribe()
        branchesSubscription.unsubscribe()
        employeesSubscription.unsubscribe()
        clientsSubscription.unsubscribe()
        activitiesSubscription.unsubscribe()
        departmentSubscription.unsubscribe()
        companyBranchSubscription.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up real-time subscriptions:", error)
      setStatus("error")
      toast({
        title: "Connection Error",
        description: "Failed to establish real-time connection. Using static data.",
        variant: "destructive",
      })
      return () => {}
    }
  }, [])

  // Function to manually refresh data
  const refreshData = async () => {
    try {
      setStatus("connecting")
      const supabase = createClient()

      // Fetch all data in parallel
      const [companiesResult, branchesResult, employeesResult, clientsResult, departmentsResult, activitiesResult] =
        await Promise.all([
          supabase.from("companies").select("*", { count: "exact", head: true }),
          supabase.from("branches").select("*", { count: "exact", head: true }),
          supabase.from("employees").select("*", { count: "exact", head: true }),
          supabase.from("clients").select("*", { count: "exact", head: true }),
          supabase.from("departments").select("id, name"),
          supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(10),
        ])

      // Process department distribution
      let employeesByDepartment = []
      if (departmentsResult.data && departmentsResult.data.length > 0) {
        employeesByDepartment = await Promise.all(
          departmentsResult.data.map(async (dept) => {
            const { count } = await supabase
              .from("employee_departments")
              .select("*", { count: "exact", head: true })
              .eq("department_id", dept.id)

            return {
              department: dept.name,
              count: count || 0,
            }
          }),
        )
      }

      // Process company-branch distribution
      let branchesByCompany = []
      const { data: companies } = await supabase.from("companies").select("id, name")
      if (companies && companies.length > 0) {
        branchesByCompany = await Promise.all(
          companies.map(async (company) => {
            const { count } = await supabase
              .from("branches")
              .select("*", { count: "exact", head: true })
              .eq("company_id", company.id)

            return {
              company: company.name,
              count: count || 0,
            }
          }),
        )
      }

      // Process employee growth
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const currentMonth = new Date().getMonth()
      const employeeGrowth = []

      for (let i = 0; i < 6; i++) {
        const monthIndex = (currentMonth - i + 12) % 12
        employeeGrowth.unshift({
          month: months[monthIndex],
          count: Math.floor(Math.random() * 100) + 500, // Simulated data
        })
      }

      // Format activities
      const recentActivities =
        activitiesResult.data?.map((activity) => ({
          id: activity.id,
          title: activity.title || `${formatActionType(activity.action_type)} ${activity.entity_type}`,
          description: activity.description,
          timestamp: formatTimestamp(activity.created_at),
          type: activity.entity_type,
          user: activity.user_name
            ? {
                name: activity.user_name,
                initials: getInitials(activity.user_name),
              }
            : undefined,
        })) || []

      // Update state with all fetched data
      setData({
        stats: {
          companies: {
            count: companiesResult.count || 0,
            trend: { isPositive: true, value: Math.floor(Math.random() * 10) },
          },
          branches: {
            count: branchesResult.count || 0,
            trend: { isPositive: true, value: Math.floor(Math.random() * 8) },
          },
          employees: {
            count: employeesResult.count || 0,
            trend: { isPositive: true, value: Math.floor(Math.random() * 5) },
          },
          clients: {
            count: clientsResult.count || 0,
            trend: { isPositive: true, value: Math.floor(Math.random() * 12) },
          },
        },
        recentActivities,
        employeesByDepartment,
        branchesByCompany,
        employeeGrowth,
      })

      setLastUpdated(new Date())
      setStatus("connected")

      toast({
        title: "Data refreshed",
        description: "Dashboard data has been manually updated",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      setStatus("error")

      toast({
        title: "Refresh failed",
        description: "Could not refresh dashboard data. Please try again.",
        variant: "destructive",
      })
    }
  }

  return {
    data,
    status,
    lastUpdated,
    refreshData,
  }
}

// Helper functions
function formatActionType(actionType?: string): string {
  if (!actionType) return "Updated"

  switch (actionType) {
    case "create":
      return "New"
    case "update":
      return "Updated"
    case "delete":
      return "Deleted"
    case "status_change":
      return "Status Changed"
    case "assignment":
      return "Assigned"
    default:
      return "Modified"
  }
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "Just now"

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

  return date.toLocaleDateString()
}

function getInitials(name: string): string {
  if (!name) return "??"

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}
