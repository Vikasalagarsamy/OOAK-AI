import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function BranchDistributionFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branches by Company</CardTitle>
        <CardDescription>Distribution of branches across companies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
          <div className="text-center p-6">
            <p className="text-muted-foreground">Branch distribution data could not be loaded</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
