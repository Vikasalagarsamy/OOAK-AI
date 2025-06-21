"use client"

import { useState, useEffect } from "react"
import { getLeadSources } from "@/actions/lead-source-actions"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bug, Database, RefreshCw, AlertCircle, Search } from "lucide-react"


interface LeadSourceMapping {
  id: number
  lead_number: string
  lead_source: string | null
  lead_source_id: number | null
  contact_name: string
  created_at: string
}

export function LeadSourceDebugger() {
  const [leadSources, setLeadSources] = useState<any[]>([])
  const [leadSourceMappings, setLeadSourceMappings] = useState<LeadSourceMapping[]>([])
  const [debugStats, setDebugStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useCurrentUser()

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) {
      setError("Authentication required for debugging")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🐛 Loading lead source debug data...')

      // Get all lead sources using PostgreSQL server action
      const sourcesResult = await getLeadSources()
      
      if (sourcesResult.success && sourcesResult.data) {
        setLeadSources(sourcesResult.data)
        console.log(`✅ Retrieved ${sourcesResult.data.length} lead sources`)
      } else {
        throw new Error(sourcesResult.error || 'Failed to fetch lead sources')
      }

      // Get lead source mappings directly from PostgreSQL
      const mappingsResult = await query(`
        SELECT 
          l.id,
          l.lead_number,
          l.lead_source,
          l.lead_source_id,
          l.contact_name,
          l.created_at,
          ls.name as lead_source_name
        FROM leads l
        LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
        ORDER BY l.created_at DESC
        LIMIT 25
      `)

      setLeadSourceMappings(mappingsResult.rows)
      console.log(`✅ Retrieved ${mappingsResult.rows.length} lead mappings`)

      // Get debug statistics
      const statsResult = await query(`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(CASE WHEN lead_source IS NOT NULL THEN 1 END) as leads_with_string_source,
          COUNT(CASE WHEN lead_source_id IS NOT NULL THEN 1 END) as leads_with_id_source,
          COUNT(CASE WHEN lead_source IS NULL AND lead_source_id IS NULL THEN 1 END) as leads_without_source,
          COUNT(CASE WHEN lead_source IS NOT NULL AND lead_source_id IS NOT NULL THEN 1 END) as leads_with_both,
          COUNT(DISTINCT lead_source) as unique_string_sources,
          COUNT(DISTINCT lead_source_id) as unique_id_sources
        FROM leads
      `)

      setDebugStats(statsResult.rows[0])
      console.log('✅ Lead source debug data loaded successfully')

    } catch (error: any) {
      console.error("❌ Error loading debug data:", error)
      setError(error.message || 'Failed to load debug data')
    } finally {
      setLoading(false)
    }
  }

  const getSourceMappingStatus = (lead: LeadSourceMapping) => {
    if (lead.lead_source_id && lead.lead_source) {
      return { status: 'both', label: 'Both ID & String', variant: 'default' }
    } else if (lead.lead_source_id) {
      return { status: 'id_only', label: 'ID Only', variant: 'secondary' }
    } else if (lead.lead_source) {
      return { status: 'string_only', label: 'String Only', variant: 'outline' }
    } else {
      return { status: 'none', label: 'No Source', variant: 'destructive' }
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Lead Source Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Authentication required to access debug features.
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
            <Bug className="h-5 w-5" />
            Lead Source Debug Information
            <span className="text-sm font-normal text-muted-foreground">
              (PostgreSQL)
            </span>
          </span>
          <Button 
            onClick={loadData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Debug Statistics */}
          {debugStats && (
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Lead Source Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{debugStats.total_leads}</div>
                  <div className="text-sm text-blue-800">Total Leads</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{debugStats.leads_with_id_source}</div>
                  <div className="text-sm text-green-800">With ID Source</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{debugStats.leads_with_string_source}</div>
                  <div className="text-sm text-yellow-800">With String Source</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{debugStats.leads_without_source}</div>
                  <div className="text-sm text-red-800">No Source</div>
                </div>
              </div>
            </div>
          )}

          {/* Available Lead Sources */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Available Lead Sources ({leadSources.length})
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 p-4">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading lead sources...
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadSources.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center text-muted-foreground py-4" style={{gridColumn: "1 / -1"}}>
                          No lead sources found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leadSources.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell className="font-mono text-sm">{source.id}</TableCell>
                          <TableCell className="font-medium">{source.name}</TableCell>
                          <TableCell>
                            <Badge variant={source.is_active ? "default" : "secondary"}>
                              {source.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(source.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Lead Source Mappings */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Lead Source Mappings (Recent 25)
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 p-4">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading lead mappings...
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead ID</TableHead>
                      <TableHead>Lead Number</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source String</TableHead>
                      <TableHead>Source ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadSourceMappings.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center text-muted-foreground py-4" style={{gridColumn: "1 / -1"}}>
                          No lead mappings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leadSourceMappings.map((lead) => {
                        const mapping = getSourceMappingStatus(lead)
                        return (
                          <TableRow key={lead.id}>
                            <TableCell className="font-mono text-sm">{lead.id}</TableCell>
                            <TableCell className="font-mono text-sm">{lead.lead_number}</TableCell>
                            <TableCell className="font-medium">{lead.contact_name}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {lead.lead_source || <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {lead.lead_source_id || <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant={mapping.variant as any}>
                                {mapping.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Debug Session Info */}
          <div className="p-4 bg-muted rounded-lg text-sm">
            <strong>Debug Session:</strong> {new Date().toISOString()} | 
            <strong> User:</strong> {user?.email || user?.id || 'Unknown'} | 
            <strong> Database:</strong> PostgreSQL |
            <strong> Version:</strong> 1.0
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
