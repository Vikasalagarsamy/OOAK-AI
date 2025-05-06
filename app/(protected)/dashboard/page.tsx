import { getCurrentUser } from "@/actions/auth-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  // Get current user - this is already checked in the layout
  const user = await getCurrentUser()

  if (!user) {
    // This should never happen due to the layout check, but just in case
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.firstName || user.username}</CardTitle>
            <CardDescription>You are logged in as {user.roleName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Role:</strong> {user.roleName}
              </p>
              <p>
                <strong>Email:</strong> {user.email || "Not provided"}
              </p>
              <p>
                <strong>Account ID:</strong> {user.id}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
