import { DollarSign } from "lucide-react"

interface SalesHeaderProps {
  title: string
  description?: string
}

export function SalesHeader({ title, description }: SalesHeaderProps) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="p-2 bg-primary/10 rounded-full">
        <DollarSign className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}
