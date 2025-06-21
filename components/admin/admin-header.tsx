import type React from "react"
import type { FC } from "react"
import { Settings } from "lucide-react"

interface AdminHeaderProps {
  title: string
  icon?: React.ReactNode
}

export const AdminHeader: FC<AdminHeaderProps> = ({ title, icon = <Settings className="h-6 w-6" /> }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
    </div>
  )
}
