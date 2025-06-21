import { query } from "@/lib/postgresql-client"
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
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"

async function getLeadWithDetails(leadId: string) {
  try {
    console.log(`🔍 [LEAD_DETAILS] Fetching lead ${leadId} via PostgreSQL...`)
    
    const result = await query(`
      SELECT 
        l.*,
        c.name as company_name,
        b.name as branch_name,
        b.address as branch_address
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      WHERE l.id = $1
    `, [leadId])

    if (result.rows.length === 0) {
      console.log(`❌ [LEAD_DETAILS] Lead ${leadId} not found`)
      return null
    }

    const lead = result.rows[0]
    console.log(`✅ [LEAD_DETAILS] Lead ${leadId} fetched successfully`)
    return lead
  } catch (error) {
    console.error('❌ [LEAD_DETAILS] Error fetching lead:', error)
    return null
  }
}

async function getLeadActivities(leadId: string) {
  try {
    console.log(`📊 [LEAD_DETAILS] Fetching activities for lead ${leadId}...`)
    
    const result = await query(`
      SELECT 
        id,
        action_type,
        description,
        user_name,
        created_at
      FROM activities
      WHERE entity_type = 'lead' AND entity_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [leadId])

    console.log(`✅ [LEAD_DETAILS] Found ${result.rows.length} activities`)
    
    return result.rows.map((activity) => ({
      id: activity.id,
      actionType: activity.action_type,
      description: activity.description,
      userName: activity.user_name,
      createdAt: new Date(activity.created_at).toLocaleString(),
    }))
  } catch (error) {
    console.error("❌ [LEAD_DETAILS] Error fetching lead activities:", error)
    return []
  }
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    console.log(`🏠 [LEAD_DETAILS] Loading lead details page for ID: ${resolvedParams.id}`)
    
    const lead = await getLeadWithDetails(resolvedParams.id)
    
    if (!lead) {
      console.log(`❌ [LEAD_DETAILS] Lead ${resolvedParams.id} not found, showing 404`)
      return (
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="mb-6">
            <Link href="/sales/my-leads">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back to My Leads
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <h2 className="text-xl font-semibold mb-2">Lead Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The lead you're looking for doesn't exist or has been deleted.
              </p>
              <Link href="/sales/my-leads">
                <Button>Return to My Leads</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )
    }

    const activities = await getLeadActivities(resolvedParams.id)

    const getStatusBadge = (status: string) => {
      switch (status?.toUpperCase()) {
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
        case "NEW":
          return <Badge className="bg-green-100 text-green-800 border-green-300">New</Badge>
        default:
          return <Badge variant="outline">{status || 'Unknown'}</Badge>
      }
    }

    console.log(`✅ [LEAD_DETAILS] Rendering page for lead: ${lead.lead_number}`)

    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/sales/my-leads">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to My Leads
            </Button>
          </Link>
          <div className="flex gap-2 items-center">
            {getStatusBadge(lead.status)}
            <Button variant="outline" size="sm" className="gap-1 ml-2">
              <FileText className="h-4 w-4" />
              Create Quote
            </Button>
          </div>
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
                      <Tag className="h-4 w-4" />
                      Lead Details
                    </h3>
                    <div className="space-y-3 pl-1">
                      {lead.lead_source && (
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Source: {lead.lead_source}</span>
                        </div>
                      )}
                      {lead.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Location: {lead.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Created: {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {lead.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                        <FileText className="h-4 w-4" />
                        Notes
                      </h3>
                      <div className="pl-1">
                        <p className="text-sm bg-muted p-3 rounded-md">{lead.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        {index < activities.length - 1 && (
                          <div className="w-px h-8 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {activity.userName}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {activity.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No activities yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error('❌ [LEAD_DETAILS] Error rendering page:', error)
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h2 className="text-xl font-semibold mb-2">Error Loading Lead</h2>
            <p className="text-muted-foreground mb-4">
              There was an error loading the lead details. Please try again.
            </p>
            <Link href="/sales/my-leads">
              <Button>Return to My Leads</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
}
