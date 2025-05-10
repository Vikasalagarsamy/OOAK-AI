import { getUserAccounts } from "@/actions/user-accounts-actions"
import { EnhancedUserAccountsList } from "@/components/enhanced-user-accounts-list"

export default async function UserAccountsPage() {
  const { data: accounts, error } = await getUserAccounts()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Accounts</h1>
        <p className="text-muted-foreground mt-2">Manage user accounts and their access to the system.</p>
      </div>

      {/* Use the enhanced version for better error handling */}
      <EnhancedUserAccountsList initialAccounts={accounts} error={error} />
    </div>
  )
}
