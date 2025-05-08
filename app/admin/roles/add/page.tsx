import { AddRoleForm } from "@/components/admin/add-role-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AddRolePage() {
  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/role-permissions" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Role Permissions
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Add New Role</h1>

      <AddRoleForm />
    </div>
  )
}
