import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Building2, Briefcase, TrendingUp } from "lucide-react"
import Link from "next/link"

interface ActionButtonProps {
  href: string
  icon: React.ReactNode
  label: string
}

function ActionButton({ href, icon, label }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-accent transition-colors"
    >
      <div className="mb-2">{icon}</div>
      <span className="text-sm text-center">{label}</span>
    </Link>
  )
}

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <ActionButton href="/people/employees/add" icon={<UserPlus className="h-4 w-4" />} label="Add Employee" />
          <ActionButton
            href="/organization/companies"
            icon={<Building2 className="h-4 w-4" />}
            label="View Companies"
          />
          <ActionButton href="/organization/clients" icon={<Briefcase className="h-4 w-4" />} label="View Clients" />
          <ActionButton href="/sales/create-lead" icon={<TrendingUp className="h-4 w-4" />} label="Create Lead" />
        </div>
      </CardContent>
    </Card>
  )
}
