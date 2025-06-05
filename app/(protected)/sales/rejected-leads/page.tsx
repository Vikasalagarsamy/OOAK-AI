import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XSquare, RefreshCw, Loader2 } from "lucide-react"
import { RejectedLeadsList } from "@/components/leads/rejected-leads-list"

export default function RejectedLeadsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <XSquare className="h-6 w-6 text-red-500" />
          Rejected Leads
        </h1>
        <p className="text-muted-foreground">
          View and reassign leads that have been rejected from your assigned companies
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-500" />
            <CardTitle>Lead Reassignment</CardTitle>
          </div>
          <CardDescription>Reassign rejected leads to different companies and branches</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LeadsLoadingState />}>
            <RejectedLeadsList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function LeadsLoadingState() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Loading rejected leads...</span>
    </div>
  )
}
