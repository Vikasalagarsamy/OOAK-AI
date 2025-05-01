import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneCall } from "lucide-react"

export default function FollowUpPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Follow Up</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            <CardTitle>Follow Up Management</CardTitle>
          </div>
          <CardDescription>Schedule and track follow-ups with potential clients</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Follow-up calendar and tracking will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
