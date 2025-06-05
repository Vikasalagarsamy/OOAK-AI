"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import { format } from "date-fns"
import { Download, Filter, RefreshCw, Search } from "lucide-react"
import { AuditHeader } from "@/components/audit/audit-header"
import { AuditSubmenu } from "@/components/audit/audit-submenu"

interface AuditLog {
  id: number
  entity_id: string
  entity_type: string
  action: string
  user_id: string
  timestamp: string
  old_values: any
  new_values: any
  ip_address: string
  user_agent: string
}

export default function AuditLogPage() {
  const searchParams = useSearchParams()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityTypes, setEntityTypes] = useState<string[]>([])
  const [actions, setActions] = useState<string[]>([])

  // Filters
  const [entityType, setEntityType] = useState<string>(searchParams.get("entityType") || "")
  const [entityId, setEntityId] = useState<string>(searchParams.get("entityId") || "")
  const [action, setAction] = useState<string>(searchParams.get("action") || "")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [userId, setUserId] = useState<string>(searchParams.get("userId") || "")

  const fetchAuditLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query
      let query = supabase
        .from("audit_security.audit_trail")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100)

      // Apply filters
      if (entityType) {
        query = query.eq("entity_type", entityType)
      }

      if (entityId) {
        query = query.eq("entity_id", entityId)
      }

      if (action) {
        query = query.eq("action", action)
      }

      if (userId) {
        query = query.eq("user_id", userId)
      }

      if (dateRange.from) {
        query = query.gte("timestamp", dateRange.from.toISOString())
      }

      if (dateRange.to) {
        // Add one day to include the end date
        const endDate = new Date(dateRange.to)
        endDate.setDate(endDate.getDate() + 1)
        query = query.lt("timestamp", endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setAuditLogs(data || [])

      // Fetch unique entity types and actions for filters
      const { data: typesData } = await supabase
        .from("audit_security.audit_trail")
        .select("entity_type")
        .order("entity_type")
        .limit(100)

      const { data: actionsData } = await supabase
        .from("audit_security.audit_trail")
        .select("action")
        .order("action")
        .limit(100)

      if (typesData) {
        const uniqueTypes = [...new Set(typesData.map((item) => item.entity_type))].filter(Boolean)
        setEntityTypes(uniqueTypes)
      }

      if (actionsData) {
        const uniqueActions = [...new Set(actionsData.map((item) => item.action))].filter(Boolean)
        setActions(uniqueActions)
      }
    } catch (err: any) {
      console.error("Error fetching audit logs:", err)
      setError(err.message || "Failed to fetch audit logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const handleExport = () => {
    if (!auditLogs.length) return

    const csvContent = [
      // CSV Header
      ["ID", "Entity Type", "Entity ID", "Action", "User ID", "Timestamp", "IP Address"].join(","),
      // CSV Rows
      ...auditLogs.map((log) =>
        [log.id, log.entity_type, log.entity_id, log.action, log.user_id, log.timestamp, log.ip_address].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy h:mm a")
    } catch (e) {
      return timestamp
    }
  }

  const renderChanges = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return "No changes recorded"

    const changes = []

    // Compare old and new values
    if (oldValues && newValues) {
      const allKeys = [...new Set([...Object.keys(oldValues), ...Object.keys(newValues)])]

      for (const key of allKeys) {
        const oldValue = oldValues[key]
        const newValue = newValues[key]

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push(
            <div key={key} className="mb-1">
              <span className="font-medium">{key}: </span>
              <span className="text-red-500 line-through">{JSON.stringify(oldValue)}</span>
              <span className="mx-1">→</span>
              <span className="text-green-500">{JSON.stringify(newValue)}</span>
            </div>,
          )
        }
      }
    } else if (newValues) {
      // Only new values (create)
      for (const [key, value] of Object.entries(newValues)) {
        changes.push(
          <div key={key} className="mb-1">
            <span className="font-medium">{key}: </span>
            <span className="text-green-500">{JSON.stringify(value)}</span>
          </div>,
        )
      }
    } else if (oldValues) {
      // Only old values (delete)
      for (const [key, value] of Object.entries(oldValues)) {
        changes.push(
          <div key={key} className="mb-1">
            <span className="font-medium">{key}: </span>
            <span className="text-red-500 line-through">{JSON.stringify(value)}</span>
          </div>,
        )
      }
    }

    return changes.length ? changes : "No changes detected"
  }

  return (
    <>
      <AuditHeader title="Audit Logs" description="Track and view system activity across the application" />

      <AuditSubmenu />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter audit logs by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Entity Type</label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All entity types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entity types</SelectItem>
                    {entityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Entity ID</label>
                <Input placeholder="Enter entity ID" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {actions.map((act) => (
                      <SelectItem key={act} value={act}>
                        {act}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <Input placeholder="Enter user ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-medium">Date Range</label>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={fetchAuditLogs} disabled={loading}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Audit Log Results</CardTitle>
              <CardDescription>
                {auditLogs.length
                  ? `Showing ${auditLogs.length} audit log entries`
                  : "No audit logs found matching your criteria"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAuditLogs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={loading || auditLogs.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No audit logs found matching your criteria</p>
                <p className="text-sm mt-2">Try adjusting your filters or refreshing the data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell className="font-medium">{log.entity_type}</TableCell>
                        <TableCell>{log.entity_id}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.action === "create"
                                ? "bg-green-100 text-green-800"
                                : log.action === "update"
                                  ? "bg-blue-100 text-blue-800"
                                  : log.action === "delete"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>{log.user_id}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-xs overflow-auto max-h-32">
                            {renderChanges(log.old_values, log.new_values)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
