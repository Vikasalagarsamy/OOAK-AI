import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Building,
  MapPin,
  User,
  Calendar,
  Clock,
  Tag,
  FileText,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { getLeadWithDetails } from "@/utils/lead-utils"
import { Separator } from "@/components/ui/separator"

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
    const lead = await getLeadWithDetails(params.id)

    if (!lead) {
      return (
        <div className="container mx-auto p-4 max-w-6xl">
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
          return <Badge variant="outline">Unknown</Badge>
      }
    }

    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/sales/manage-lead">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Leads
            </Button>
          </Link>
          <div className="flex gap-2">{getStatusBadge(lead.status)}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Lead Information Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{lead.client_name}</CardTitle>
                </div>
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {lead.lead_number}
                </p>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                      <User className="h-4 w-4" />
                      Contact Information
                    </h3>
                    <div className="space-y-3 pl-1">
                      {lead.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {lead.country_code} {lead.phone}
                          </span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.email}</span>
                        </div>
                      )}
                      {lead.is_whatsapp && (
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {lead.has_separate_whatsapp
                              ? `${lead.whatsapp_country_code} ${lead.whatsapp_number}`
                              : "Same as phone"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                      <Building className="h-4 w-4" />
                      Company Information
                    </h3>
                    <div className="space-y-3 pl-1">
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lead.company_name || "Not specified"}</span>
                      </div>
                      {lead.branch_name && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.branch_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lead Details */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                      <User className="h-4 w-4" />
                      Assigned To
                    </h3>
                    <div className="bg-slate-50 rounded-md border border-slate-100 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{lead.assigned_to_name || "Not assigned"}</div>
                          {lead.assigned_to_role && (
                            <div className="text-xs text-slate-500">{lead.assigned_to_role}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                      <FileText className="h-4 w-4" />
                      Lead Details
                    </h3>
                    <div className="space-y-2 pl-1">
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Tag className="h-3 w-3" />
                          Source:
                        </span>
                        <span className="text-sm">{lead.lead_source_name || "Not specified"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          Created:
                        </span>
                        <span className="text-sm">{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Last Updated:
                        </span>
                        <span className="text-sm">{new Date(lead.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {lead.notes && (
                <div className="mt-8">
                  <Separator className="mb-6" />
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-100">
                    <p className="whitespace-pre-line text-sm">{lead.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity History Card */}
          <Card className="h-fit">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground text-sm mb-2">No activities recorded yet</p>
                  <p className="text-xs text-slate-400">Activities will appear here as they occur</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className={index !== activities.length - 1 ? "border-b pb-5" : ""}>
                      <p className="font-medium text-sm">{activity.description}</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{activity.userName}</span>
                        <span>{activity.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4 pb-4">
              <p className="text-xs text-muted-foreground">
                Showing {activities.length} recent {activities.length === 1 ? "activity" : "activities"}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in LeadDetailPage:", error)
    return (
      <div className="container mx-auto p-4 max-w-6xl">
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
