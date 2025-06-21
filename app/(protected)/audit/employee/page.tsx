import { AuditHeader } from "@/components/audit/audit-header"
import { AuditSubmenu } from "@/components/audit/audit-submenu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeAuditList } from "@/components/audit/employee-audit-list"

export default function EmployeeAuditPage() {
  return (
    <>
      <AuditHeader title="Employee Audit"  />

      <AuditSubmenu />

      <Card>
        <CardHeader>
          <CardTitle>Employee Activity</CardTitle>
          <CardDescription>View audit logs for specific employees and their actions</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeAuditList />
        </CardContent>
      </Card>
    </>
  )
}
