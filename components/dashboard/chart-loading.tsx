import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartLoadingProps {
  title?: string
  subtitle?: string
}

export function ChartLoading({
  title = "Loading Chart Data...",
  subtitle = "Please wait while we load the chart data",
}: ChartLoadingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          <div className="animate-pulse rounded-md bg-muted h-[250px] w-full"></div>
        </div>
      </CardContent>
    </Card>
  )
}
