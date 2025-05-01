import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XSquare } from "lucide-react"

export default function RejectedLeadsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Rejected Leads</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <XSquare className="h-5 w-5" />
            <CardTitle>Rejected Leads Analysis</CardTitle>
          </div>
          <CardDescription>View and analyze rejected leads for insights</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Rejected leads analysis dashboard will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
