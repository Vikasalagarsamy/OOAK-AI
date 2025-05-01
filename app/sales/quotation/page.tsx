import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function QuotationPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Quotations</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Quotation Management</CardTitle>
          </div>
          <CardDescription>Create and manage quotations for clients</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Quotation creation and management will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
