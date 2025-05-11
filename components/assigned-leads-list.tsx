"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getAssignedLeads } from "@/actions/manage-lead-actions"
import { formatDistanceToNow } from "date-fns"
import type { Lead } from "@/types/lead"
import { Phone, Mail, Tag, MapPin, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

export function AssignedLeadsList() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignedLeads()
  }, [])

  const fetchAssignedLeads = async () => {
    setLoading(true)
    try {
      const leadsData = await getAssignedLeads()
      setLeads(leadsData)
    } catch (error) {
      console.error("Error fetching assigned leads:", error)
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "NEW":
        return "default"
      case "CONTACTED":
        return "secondary"
      case "QUALIFIED":
        return "info"
      case "PROPOSAL":
        return "warning"
      case "NEGOTIATION":
        return "warning"
      case "WON":
        return "success"
      case "LOST":
        return "destructive"
      case "REJECTED":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Leads</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No assigned leads found.</p>
            <Button className="mt-4" onClick={() => router.push("/sales/create-lead")}>
              Create New Lead
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.lead_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{lead.client_name}</span>
                        <div className="flex flex-col text-xs text-muted-foreground mt-1">
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.country_code} {lead.phone}
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                          )}
                          {lead.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{lead.company_name}</span>
                        {lead.branch_name && <span className="text-xs text-muted-foreground">{lead.branch_name}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.lead_source || lead.lead_source_name ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {lead.lead_source_name || lead.lead_source}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell>{lead.assigned_to_name || "Not assigned"}</TableCell>
                    <TableCell>{formatDate(lead.updated_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/sales/lead/${lead.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Update Status",
                                description: "This feature will be available soon.",
                              })
                            }}
                          >
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Send Message",
                                description: "This feature will be available soon.",
                              })
                            }}
                          >
                            Send Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
