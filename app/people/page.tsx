import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PeopleSubmenu } from "@/components/people/people-submenu"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Building, Briefcase } from "lucide-react"

export default function PeoplePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">People Management</h1>
        <p className="text-muted-foreground">Manage your organization's employees, departments, and designations.</p>
      </div>

      <PeopleSubmenu />

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="designations">Designations</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
              <CardDescription>Manage your organization's employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Link href="/people/employees">
                  <Button>
                    <Users className="mr-2 h-4 w-4" />
                    View All Employees
                  </Button>
                </Link>
              </div>
              <p>
                Employees can be assigned to multiple companies and branches with specific work allocation percentages.
                Each employee has a primary company and home branch, but can undertake tasks from different branches and
                companies.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Manage your organization's departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Link href="/people/departments">
                  <Button>
                    <Building className="mr-2 h-4 w-4" />
                    View All Departments
                  </Button>
                </Link>
              </div>
              <p>
                Departments help organize employees by their functional areas within the organization. Each department
                can have multiple employees and can span across different companies and branches.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="designations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Designations</CardTitle>
              <CardDescription>Manage your organization's job designations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Link href="/people/designations">
                  <Button>
                    <Briefcase className="mr-2 h-4 w-4" />
                    View All Designations
                  </Button>
                </Link>
              </div>
              <p>
                Designations define the roles and responsibilities of employees within the organization. Each
                designation can be associated with specific departments and have different levels of authority.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
