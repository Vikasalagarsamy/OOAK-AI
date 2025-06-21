import { BarChart } from "lucide-react"

interface ReportsHeaderProps {
  title: string
}

export function ReportsHeader({ title }: ReportsHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <BarChart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    </div>
  )
}
