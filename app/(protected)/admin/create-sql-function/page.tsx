import { CreateExecSqlWithResultFunction } from "@/components/admin/create-exec-sql-with-result-function"

export default function CreateSqlFunctionPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Create SQL Execution Function</h1>
      <CreateExecSqlWithResultFunction />
    </div>
  )
}
