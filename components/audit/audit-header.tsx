import { FileSearch } from "lucide-react"

interface AuditHeaderProps {
  title: string
}

export function AuditHeader({ title }: AuditHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileSearch className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </div>
    </div>
  )
}
