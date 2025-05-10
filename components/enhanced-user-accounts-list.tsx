"use client"

import { useState } from "react"
import { type UserAccount, toggleAccountStatus } from "@/actions/user-accounts-actions"
import { deleteUserAccount } from "@/actions/user-accounts-actions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { FixUserAccountsSchemaButton } from "./fix-user-accounts-schema-button"
import { UserAccountActionsButton } from "./user-account-actions-button"

interface UserAccountsListProps {
  initialAccounts: UserAccount[]
  error: string | null
}

export function EnhancedUserAccountsList({ initialAccounts, error }: UserAccountsListProps) {
  const [accounts, setAccounts] = useState<UserAccount[]>(initialAccounts || [])
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter((account) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      account.username?.toLowerCase().includes(searchLower) ||
      account.email?.toLowerCase().includes(searchLower) ||
      account.employee_name?.toLowerCase().includes(searchLower) ||
      account.role_title?.toLowerCase().includes(searchLower)
    )
  })

  const handleToggleStatus = async (accountId: number, currentStatus: boolean) => {
    try {
      const result = await toggleAccountStatus(accountId.toString(), !currentStatus)

      if (result.success) {
        setAccounts(
          accounts.map((account) => (account.id === accountId ? { ...account, is_active: !currentStatus } : account)),
        )

        toast({
          title: "Account status updated",
          description: `Account has been ${!currentStatus ? "activated" : "deactivated"}.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Error updating account status",
          description: result.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error toggling status:", error)
      toast({
        title: "Error updating account status",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (accountId: number) => {
    setAccountToDelete(accountId)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (accountToDelete) {
      setIsDeleting(true)
      setDeleteError(null)

      try {
        const result = await deleteUserAccount(accountToDelete.toString())

        if (result.success) {
          setAccounts(accounts.filter((account) => account.id !== accountToDelete))
          toast({
            title: "Account deleted",
            description: "The user account has been permanently deleted.",
            variant: "default",
          })
          setDeleteDialogOpen(false)
          setAccountToDelete(null)
        } else {
          console.error("Delete error:", result.error)
          setDeleteError(result.error || "An error occurred while deleting the account")

          toast({
            title: "Error deleting account",
            description: result.error || "An error occurred",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Unexpected error in confirmDelete:", error)
        setDeleteError("An unexpected error occurred")

        toast({
          title: "Error deleting account",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (error) {
    const isRelationshipError = error.includes("relationship") || error.includes("foreign key")

    return (
      <div className="rounded-md bg-amber-50 p-4 my-4 border border-amber-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Information</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>{error}</p>

              {isRelationshipError ? (
                <div className="mt-4">
                  <p className="mb-2">
                    This appears to be a database schema issue. You can try to fix it automatically:
                  </p>
                  <FixUserAccountsSchemaButton />
                  <p className="mt-2 text-xs">Or you can create user accounts first using the account creation page:</p>
                </div>
              ) : (
                <p className="mt-2">Please create user accounts first using the account creation page.</p>
              )}

              <Button
                variant="outline"
                className="mt-3"
                onClick={() => (window.location.href = "/organization/account-creation")}
              >
                Go to Account Creation
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No user accounts found</h3>
        <p className="text-gray-500 mb-4">
          There are no user accounts created yet. Create your first account to get started.
        </p>
        <Button onClick={() => (window.location.href = "/organization/account-creation")}>Create Account</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search accounts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => (window.location.href = "/organization/account-creation")}>Create Account</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.username}</TableCell>
                <TableCell>{account.email}</TableCell>
                <TableCell>{account.employee_name}</TableCell>
                <TableCell>{account.role_title}</TableCell>
                <TableCell>
                  {account.is_active ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 w-fit"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 w-fit"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {account.created_at ? format(new Date(account.created_at), "MMM d, yyyy") : "N/A"}
                </TableCell>
                <TableCell>
                  {account.last_login ? format(new Date(account.last_login), "MMM d, yyyy h:mm a") : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  {/* Use our new custom actions button component */}
                  <UserAccountActionsButton
                    accountId={account.id}
                    isActive={account.is_active}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteClick}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove it from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error deleting account</p>
                <p className="text-sm text-red-700 mt-1">{deleteError}</p>

                <div className="mt-3">
                  <p className="text-sm text-red-700">
                    This error might be due to database constraints. You can try to fix these constraints:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      window.location.href = "/admin/fix-user-accounts-table"
                    }}
                  >
                    Fix Database Constraints
                  </Button>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
