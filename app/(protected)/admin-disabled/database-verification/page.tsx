import { CreateSqlFunctions } from "@/components/admin/create-sql-functions"
import { VerifyDatabaseTables } from "@/components/admin/verify-database-tables"

export default function DatabaseVerificationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Database Verification</h1>

      <div className="grid gap-6">
        <CreateSqlFunctions />
        <VerifyDatabaseTables />
      </div>
    </div>
  )
}
