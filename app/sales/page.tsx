import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, UserPlus, ClipboardList, PhoneCall, FileText, CheckSquare, XSquare } from "lucide-react"
import Link from "next/link"

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/sales/create-lead">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Create Lead</CardTitle>
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Create new sales leads and opportunities</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/unassigned-lead">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Unassigned Lead</CardTitle>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>View and assign unassigned leads to team members</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/my-leads">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">My Leads</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage and track your assigned leads</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/follow-up">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Follow Up</CardTitle>
              <PhoneCall className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Schedule and track follow-ups with potential clients</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/quotation">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Quotation</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Create and manage quotations for clients</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/order-confirmation">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Order Confirmation</CardTitle>
              <CheckSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage order confirmations and track sales</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/rejected-leads">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Rejected Leads</CardTitle>
              <XSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>View and analyze rejected leads for insights</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/lead-sources">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Lead Sources</CardTitle>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage and track lead sources</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
