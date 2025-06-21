import type React from "react"

interface EventsHeaderProps {
  title: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function EventsHeader({ title, icon, children }: EventsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center">
        {icon && <div className="mr-3 text-muted-foreground">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
