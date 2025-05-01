import Link from "next/link"
import { Building2, GitBranch, Users, Truck, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OrganizationPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Organization Management</h1>
        <p className="text-muted-foreground">
          Manage your organization structure including companies, branches, vendors, suppliers, and clients.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mt-8">
        <Link href="/organization/companies">
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
            <Building2 className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Companies</h2>
            <p className="text-center text-muted-foreground">Manage your companies and their details</p>
          </div>
        </Link>

        <Link href="/organization/branches">
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
            <GitBranch className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Branches</h2>
            <p className="text-center text-muted-foreground">Manage branches across all companies</p>
          </div>
        </Link>

        <Link href="/organization/roles">
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
            <Users className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">User Roles</h2>
            <p className="text-center text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </Link>

        <Link href="/organization/vendors">
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
            <ShoppingBag className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vendors</h2>
            <p className="text-center text-muted-foreground">Manage vendors and their information</p>
          </div>
        </Link>

        <Link href="/organization/suppliers">
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
            <Truck className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Suppliers</h2>
            <p className="text-center text-muted-foreground">Manage suppliers and their information</p>
          </div>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage Clients</div>
            <p className="text-xs text-muted-foreground">Manage client information and categorization</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/organization/clients">View Clients</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
