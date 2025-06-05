import { OrganizationHeader } from "@/components/organization-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building, Building2, Briefcase, Users, UserCog } from "lucide-react"

export default function OrganizationPage() {
  return (
    <div>
      <OrganizationHeader
        title="Organization Management"
        description="Manage your organization structure, companies, branches, and more."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/organization/companies">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Companies</CardTitle>
              <Building className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage organization companies and their details</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/organization/branches">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Branches</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage branch locations across your organization</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/organization/clients">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Clients</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage client information and relationships</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/organization/suppliers">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Suppliers</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage supplier information and relationships</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/organization/vendors">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Vendors</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage vendor information and relationships</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/organization/roles">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Roles</CardTitle>
              <UserCog className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/organization/user-accounts">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">User Accounts</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage user accounts and access</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/organization/account-creation">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Account Creation</CardTitle>
              <UserCog className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>Create user accounts for employees</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
