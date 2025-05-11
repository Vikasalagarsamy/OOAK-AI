"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getAllLeadSources } from "@/utils/lead-source-utils"
import { createClient } from "@/lib/supabase"

export function LeadSourceDebugger() {
  const [leadSources, setLeadSources] = useState<any[]>([])
  const [leadSourceMappings, setLeadSourceMappings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Get all lead sources
      const sources = await getAllLeadSources()
      setLeadSources(sources)

      // Get lead source mappings from leads table
      const supabase = createClient()
      const { data, error } = await supabase
        .from("leads")
        .select("id, lead_number, lead_source, lead_source_id")
        .limit(20)

      if (error) {
        console.error("Error fetching lead mappings:", error)
      } else {
        setLeadSourceMappings(data || [])
      }
    } catch (error) {
      console.error("Error loading debug data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Source Debug Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Available Lead Sources</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>{source.id}</TableCell>
                      <TableCell>{source.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Lead Source Mappings (Sample)</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Lead Number</TableHead>
                    <TableHead>Lead Source (String)</TableHead>
                    <TableHead>Lead Source ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadSourceMappings.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.id}</TableCell>
                      <TableCell>{lead.lead_number}</TableCell>
                      <TableCell>{lead.lead_source || "Not set"}</TableCell>
                      <TableCell>{lead.lead_source_id || "Not set"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <Button onClick={loadData}>Refresh Data</Button>
        </div>
      </CardContent>
    </Card>
  )
}
