import { EnhancedAccountCreationForm } from "@/components/enhanced-account-creation-form"

export default function AccountCreationPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Creation</h1>
        <p className="text-muted-foreground mt-2">Create user accounts for employees and assign roles.</p>
      </div>

      <EnhancedAccountCreationForm />
    </div>
  )
}
