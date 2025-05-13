import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsSubmenu } from "@/components/reports/reports-submenu"

export const metadata: Metadata = {
  title: "Conversion Funnel Analysis",
  description: "Track lead progression through sales stages",
}

export default function ConversionFunnelPage() {
  return (
    <div className="space-y-6">
      <ReportsHeader title="Conversion Funnel" description="Track how leads progress through your sales pipeline" />

      <ReportsSubmenu />

      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline Funnel</CardTitle>
          <CardDescription>Visualize conversion rates between sales stages</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="funnel">
            <TabsList className="mb-4">
              <TabsTrigger value="funnel">Funnel View</TabsTrigger>
              <TabsTrigger value="stages">By Stage</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="funnel">
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Funnel visualization will be implemented in the next phase</p>
              </div>
            </TabsContent>

            <TabsContent value="stages">
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Stage breakdown will be implemented in the next phase</p>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Timeline view will be implemented in the next phase</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
