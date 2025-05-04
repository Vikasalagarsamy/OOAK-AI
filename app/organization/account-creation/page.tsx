import type { Metadata } from "next"
import { AccountCreationForm } from "@/components/account-creation-form"

export const metadata: Metadata = {
  title: "Account Creation",
  description: "Create user accounts for employees",
}

export default function AccountCreationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Creation</h1>
        <p className="text-muted-foreground mt-2">
          Create user accounts for employees by assigning roles and setting up passwords.
        </p>
      </div>
      <AccountCreationForm />
    </div>
  )
}
