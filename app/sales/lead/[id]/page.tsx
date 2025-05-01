import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, Mail, MessageSquare, Building, MapPin, User } from "lucide-react"
import Link from "next/link"

async function getLead(id: string) {
  const supabase = createClient()

  // First check if the lead exists
  const { data: leadExists, error: checkError } = await supabase.from("leads").select("id").eq("id", id).single()

  if (checkError) {
    console.error("Error checking if lead exists:", checkError)
    return null
  }

  if (!leadExists) {
    console.error(`Lead with ID ${id} not found`)
    return null
  }

  // Then fetch the lead with all related data
  try {
    const { data, error } = await supabase
      .from("leads")
      .select(`
        *,
        companies:company_id(name),
        branches:branch_id(name),
        employees:assigned_to(id, first_name, last_name, role, job_title)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching lead:", error)
      return null
    }

    // Fetch lead source separately to avoid join issues
    let leadSourceName = null
    if (data.lead_source_id) {
      const { data: sourceData, error: sourceError } = await supabase
        .from("lead_sources")
        .select("name")
        .eq("id", data.lead_source_id)
        .single()

      if (!sourceError && sourceData) {
        leadSourceName = sourceData.name
      } else {
        console.error("Error fetching lead source:", sourceError)
      }
    }

    return {
      ...data,
      company_name: data.companies?.name,
      branch_name: data.branches?.name,
      assigned_to_name: data.employees ? `${data.employees.first_name} ${data.employees.last_name}` : undefined,
      assigned_to_role: data.employees?.role || data.employees?.job_title,
      lead_source_name: leadSourceName,
    }
  } catch (err) {
    console.error("Unexpected error fetching lead:", err)
    return null
  }
}

async function getLeadActivities(leadId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("entity_type", "lead")
    .eq("entity_id", leadId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching lead activities:", error)
    return []
  }

  return data.map((activity) => ({
    id: activity.id,
    actionType: activity.action_type,
    description: activity.description,
    userName: activity.user_name,
    createdAt: new Date(activity.created_at).toLocaleString(),
  }))
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  try {
    const lead = await getLead(params.id)

    if (!lead) {
      return (
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <Link href="/sales/manage-lead">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back to Leads
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h2 className="text-xl font-semibold mb-2">Lead Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The lead you're looking for doesn't exist or has been deleted.
              </p>
              <Link href="/sales/manage-lead">
                <Button>Return to Lead Management</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )
    }

    const activities = await getLeadActivities(params.id)

    const getStatusBadge = (status: string) => {
      switch (status) {
        case "ASSIGNED":
          return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Assigned</Badge>
        case "FOLLOW_UP":
          return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Follow-up</Badge>
        case "QUOTED":
          return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Quoted</Badge>
        case "CONVERTED":
          return <Badge className="bg-green-100 text-green-800 border-green-300">Converted</Badge>
        case "REJECTED":
          return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>
        default:
          return <Badge>Unknown</Badge>
      }
    }

    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link href="/sales/manage-lead">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Leads
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{lead.client_name}</CardTitle>
                    <p className="text-muted-foreground">{lead.lead_number}</p>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Information</h3>
                      <div className="space-y-2">
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {lead.country_code} {lead.phone}
                            </span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        {lead.is_whatsapp && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {lead.has_separate_whatsapp
                                ? `${lead.whatsapp_country_code} ${lead.whatsapp_number}`
                                : "Same as phone"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Company Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.company_name || "Not specified"}</span>
                        </div>
                        {lead.branch_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.branch_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h3>
                      <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-slate-700" />
                          <div>
                            <div className="font-medium">{lead.assigned_to_name || "Not assigned"}</div>
                            {lead.assigned_to_role && (
                              <div className="text-sm text-slate-500">{lead.assigned_to_role}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Lead Details</h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-1">
                          <span className="text-sm text-muted-foreground">Source:</span>
                          <span>{lead.lead_source_name || "Not specified"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <span className="text-sm text-muted-foreground">Created:</span>
                          <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <span className="text-sm text-muted-foreground">Last Updated:</span>
                          <span>{new Date(lead.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {lead.notes && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                      <p className="whitespace-pre-line">{lead.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No activities recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="border-b pb-3 last:border-0">
                        <p className="font-medium">{activity.description}</p>
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>{activity.userName}</span>
                          <span>{activity.createdAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in LeadDetailPage:", error)
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link href="/sales/manage-lead">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Leads
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h2 className="text-xl font-semibold mb-2">Error Loading Lead</h2>
            <p className="text-muted-foreground mb-4">There was an unexpected error loading the lead data.</p>
            <Link href="/sales/manage-lead">
              <Button>Return to Lead Management</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
}
