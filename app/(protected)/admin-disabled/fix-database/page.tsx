import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { EnsureUserAccountsTableButton } from "@/components/ensure-user-accounts-table-button"

export default function FixDatabasePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Database Maintenance</h1>
        <p className="text-muted-foreground mt-2">Fix database issues and ensure required tables exist.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Accounts Table</CardTitle>
            <CardDescription>Ensure the user_accounts table exists with the correct structure.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This action will check if the user_accounts table exists and create it if needed. It will also ensure that
              the table has the correct structure and relationships.
            </p>
          </CardContent>
          <CardFooter>
            <EnsureUserAccountsTableButton />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
