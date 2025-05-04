import { ExecuteSqlScript } from "@/components/execute-sql-script"

export default function UpdateConstraintsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Update Database Constraints</h1>
      <ExecuteSqlScript />
    </div>
  )
}
