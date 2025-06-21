import { RbacTester } from "@/components/admin/rbac-tester"

export default function TestRbacPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Test Role-Based Access Control</h1>
      <p className="text-muted-foreground">
        Use this page to test and verify that role-based access control is working correctly, especially for restricting
        the 'sales head' role from administrative menus.
      </p>
      <RbacTester />
    </div>
  )
}
