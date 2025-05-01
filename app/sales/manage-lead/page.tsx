import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AssignedLeadsList } from "@/components/assigned-leads-list"
import { DollarSign } from "lucide-react"

export default function ManageLeadPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Leads</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Lead Management</CardTitle>
          </div>
          <CardDescription>Track and manage your sales leads</CardDescription>
        </CardHeader>
        <CardContent>
          <AssignedLeadsList />
        </CardContent>
      </Card>
    </div>
  )
}
