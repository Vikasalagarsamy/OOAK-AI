import { Building2 } from "lucide-react"

interface OrganizationHeaderProps {
  title: string
  description?: string
}

export function OrganizationHeader({ title, description }: OrganizationHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {description && <p className="text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}
