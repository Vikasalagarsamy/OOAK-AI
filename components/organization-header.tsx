import { Building2 } from "lucide-react"

interface OrganizationHeaderProps {
  title: string
  description?: string
}

export function OrganizationHeader({ title, description }: OrganizationHeaderProps) {
  return (
    <div className="mb-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
