import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building, GitBranch, UserPlus, FileText, ShoppingBag } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "Add Company",
      description: "Create a new company record",
      icon: <Building className="h-4 w-4 mr-2" />,
      href: "/organization/companies",
    },
    {
      title: "Add Branch",
      description: "Create a new branch location",
      icon: <GitBranch className="h-4 w-4 mr-2" />,
      href: "/organization/branches",
    },
    {
      title: "Add Employee",
      description: "Add a new employee record",
      icon: <UserPlus className="h-4 w-4 mr-2" />,
      href: "/people/employees",
    },
    {
      title: "Add Client",
      description: "Register a new client",
      icon: <Users className="h-4 w-4 mr-2" />,
      href: "/organization/clients",
    },
    {
      title: "Add Vendor",
      description: "Register a new vendor",
      icon: <ShoppingBag className="h-4 w-4 mr-2" />,
      href: "/organization/vendors",
    },
    {
      title: "Reports",
      description: "View organization reports",
      icon: <FileText className="h-4 w-4 mr-2" />,
      href: "#",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <div className="flex items-center">
                  {action.icon}
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
