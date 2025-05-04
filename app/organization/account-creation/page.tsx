import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AccountCreationForm } from "@/components/account-creation-form"

export const metadata: Metadata = {
  title: "Account Creation",
  description: "Create user accounts for employees",
}

export default function AccountCreationPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Creation</h1>
        <p className="text-muted-foreground mt-2">Create user accounts for employees and assign roles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Account</CardTitle>
          <CardDescription>
            Select an employee, assign a role, and set up a password to create a new user account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountCreationForm />
        </CardContent>
      </Card>
    </div>
  )
}
