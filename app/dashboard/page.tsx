import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Welcome, {user.firstName} {user.lastName}
            </CardTitle>
            <CardDescription>You are logged in as {user.username}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Role:</strong> {user.roleName}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Account ID:</strong> {user.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
