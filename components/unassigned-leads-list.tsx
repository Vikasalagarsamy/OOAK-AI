"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCurrentUser } from "@/hooks/use-current-user"
import { query } from "@/lib/postgresql-client"
import { AssignLeadDialog } from "@/components/assign-lead-dialog"
import { formatDistanceToNow } from "date-fns"
import type { Lead } from "@/types/lead"
import { Phone, Mail, Tag, MapPin, RefreshCw, AlertCircle, Users, Database } from "lucide-react"

interface EnhancedLead extends Lead {
  company_name?: string
  branch_name?: string
  branch_location?: string
  reassigned_from_company_name?: string
  reassigned_from_branch_name?: string
  lead_source_name?: string
  contact_name: string
  lead_source?: string
  lead_source_id?: number
  status?: string
  phone?: string
  country_code?: string
  email?: string
  location?: string
  created_at: string
  reassigned_from_company_id?: number
}

export function UnassignedLeadsList() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const [leads, setLeads] = useState<EnhancedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<EnhancedLead | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (user) {
      fetchUnassignedLeads()
    }
  }, [user])

  const fetchUnassignedLeads = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    if (!user) {
      setError("Authentication required to view leads")
      setLoading(false)
      return
    }

    try {
      console.log('📋 Fetching unassigned leads from PostgreSQL...')
      
      // Single optimized PostgreSQL query with all joins
      const leadsResult = await query(`
        SELECT 
          l.*,
          c.name as company_name,
          b.name as branch_name,
          b.location as branch_location,
          rc.name as reassigned_from_company_name,
          rb.name as reassigned_from_branch_name,
          ls.name as lead_source_name
        FROM leads l
        LEFT JOIN companies c ON l.company_id = c.id
        LEFT JOIN branches b ON l.branch_id = b.id
        LEFT JOIN companies rc ON l.reassigned_from_company_id = rc.id
        LEFT JOIN branches rb ON l.reassigned_from_branch_id = rb.id
        LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
        WHERE l.assigned_to IS NULL
        ORDER BY l.created_at DESC
        LIMIT 100
      `)

      const unassignedLeads = leadsResult.rows as EnhancedLead[]
      console.log(`✅ Retrieved ${unassignedLeads.length} unassigned leads`)

      // Get statistics in a separate query
      const statsResult = await query(`
        SELECT 
          COUNT(*) as total_unassigned,
          COUNT(CASE WHEN l.created_at::date = CURRENT_DATE THEN 1 END) as created_today,
          COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as created_this_week,
          COUNT(CASE WHEN l.lead_source_id IS NOT NULL THEN 1 END) as with_source_id,
          COUNT(CASE WHEN l.lead_source IS NOT NULL THEN 1 END) as with_source_string,
          COUNT(CASE WHEN l.company_id IS NOT NULL THEN 1 END) as with_company,
          COUNT(CASE WHEN l.branch_id IS NOT NULL THEN 1 END) as with_branch,
          COUNT(CASE WHEN l.reassigned_from_company_id IS NOT NULL THEN 1 END) as reassigned_leads
        FROM leads l
        WHERE l.assigned_to IS NULL
      `)

      setStats(statsResult.rows[0])
      setLeads(unassignedLeads)
      console.log('✅ Unassigned leads loaded successfully')

    } catch (error: any) {
      console.error("❌ Error fetching unassigned leads:", error)
      setError(error.message || "Failed to fetch unassigned leads")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleAssignClick = (lead: EnhancedLead) => {
    if (!user) {
      setError("Authentication required to assign leads")
      return
    }
    setSelectedLead(lead)
    setIsAssignDialogOpen(true)
  }

  const handleAssignComplete = async () => {
    setIsAssignDialogOpen(false)
    setSelectedLead(null)
    
    // Refresh the list in background
    await fetchUnassignedLeads(false)
  }

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh requested')
    await fetchUnassignedLeads(true)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const getLeadSourceDisplay = (lead: EnhancedLead) => {
    if (lead.lead_source_name) {
      return lead.lead_source_name
    } else if (lead.lead_source) {
      return lead.lead_source
    } else {
      return "Unknown"
    }
  }

  const getPriorityColor = (lead: EnhancedLead) => {
    // Priority logic based on creation time and reassignment status
    const hoursOld = lead.created_at ? 
      (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60) : 0
    
    if (lead.reassigned_from_company_id) return "destructive" // Reassigned leads are high priority
    if (hoursOld > 48) return "destructive" // Very old leads
    if (hoursOld > 24) return "secondary" // Moderately old leads
    return "default" // New leads
  }

  // Error state
  if (error && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Unassigned Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Authentication required state
  if (!user && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Unassigned Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to view unassigned leads.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Unassigned Leads
            <span className="text-sm font-normal text-muted-foreground">
              (PostgreSQL)
            </span>
            {stats && (
              <Badge variant="outline">
                {stats.total_unassigned} total
              </Badge>
            )}
          </span>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        
        {/* Statistics Summary */}
        {stats && (
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>📅 Today: {stats.created_today}</span>
            <span>📈 This week: {stats.created_this_week}</span>
            <span>🔄 Reassigned: {stats.reassigned_leads}</span>
            <span>🏢 With company: {stats.with_company}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Unassigned Leads</h3>
            <p className="text-muted-foreground mb-4">
              All leads have been assigned to team members.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Info</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Company/Branch</TableHead>
                  <TableHead className="hidden lg:table-cell">Source</TableHead>
                  <TableHead className="hidden xl:table-cell">Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    {/* Lead Info */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{lead.contact_name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          #{lead.lead_number}
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1 text-sm">
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <a 
                              href={`tel:${lead.country_code}${lead.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {lead.country_code}{lead.phone}
                            </a>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <a 
                              href={`mailto:${lead.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {lead.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Company/Branch */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">
                          {lead.company_name || 'No company'}
                        </div>
                        {lead.branch_name && (
                          <div className="text-muted-foreground">
                            {lead.branch_name}
                          </div>
                        )}
                        {lead.reassigned_from_company_name && (
                          <Badge variant="outline" className="text-xs">
                            From: {lead.reassigned_from_company_name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Source */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Tag className="h-3 w-3" />
                        {getLeadSourceDisplay(lead)}
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell className="hidden xl:table-cell">
                      {lead.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {lead.location}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={getPriorityColor(lead)}>
                        {lead.status || 'New'}
                      </Badge>
                    </TableCell>

                    {/* Created */}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleAssignClick(lead)}
                        className="text-xs"
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        {!loading && leads.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
            <Database className="h-4 w-4" />
            Showing {leads.length} unassigned leads • PostgreSQL • 
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        )}
      </CardContent>

      {/* Assign Lead Dialog */}
      {selectedLead && (
        <AssignLeadDialog
          lead={selectedLead}
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          onAssignComplete={handleAssignComplete}
        />
      )}
    </Card>
  )
}
