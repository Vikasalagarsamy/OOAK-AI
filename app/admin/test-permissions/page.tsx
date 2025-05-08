import { PermissionTester } from "@/components/admin/permission-tester"

export default function TestPermissionsPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Permission Testing Tool</h1>
      <PermissionTester />
    </div>
  )
}
