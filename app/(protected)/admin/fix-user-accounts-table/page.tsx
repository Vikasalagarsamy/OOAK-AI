import { FixUserAccountsTableButton } from "@/components/fix-user-accounts-table-button"

export default function FixUserAccountsTablePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fix User Accounts Table</h1>
        <p className="text-muted-foreground mt-2">
          This page allows you to fix issues with the user accounts table that might prevent account deletion.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Fix Foreign Key Constraints</h2>
        <p className="mb-4">
          If you're having trouble deleting user accounts, it might be due to foreign key constraints. This button will
          update the constraints to use CASCADE deletion, which will automatically delete related records when a user
          account is deleted.
        </p>

        <FixUserAccountsTableButton />

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This will modify your database schema. Make sure you have a backup before proceeding.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <a href="/organization/user-accounts" className="text-blue-600 hover:text-blue-800 hover:underline">
          Return to User Accounts
        </a>
      </div>
    </div>
  )
}
