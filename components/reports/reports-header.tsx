import { BarChart } from "lucide-react"

interface ReportsHeaderProps {
  title: string
  description?: string
}

export function ReportsHeader({ title, description }: ReportsHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <BarChart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {description && <p className="text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}
