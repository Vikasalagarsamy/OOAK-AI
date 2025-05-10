import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartCardFallbackProps {
  title?: string
  subtitle?: string
  className?: string
}

export function ChartCardFallback({
  title = "Chart Data",
  subtitle = "Chart data is currently unavailable",
  className,
}: ChartCardFallbackProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
          <div className="text-center p-6">
            <p className="text-muted-foreground">Chart data could not be loaded</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
