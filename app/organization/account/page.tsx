import type { Metadata } from "next"
import { AccountOptions } from "@/components/account-options"

export const metadata: Metadata = {
  title: "Account Management",
  description: "Manage your account settings and preferences",
}

export default function AccountPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings, profile information, and authentication preferences.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <AccountOptions />
      </div>
    </div>
  )
}
