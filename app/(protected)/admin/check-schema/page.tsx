import { DatabaseSchemaChecker } from "@/components/database-schema-checker"

export default function CheckSchemaPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Database Schema Checker</h1>
      <DatabaseSchemaChecker />
    </div>
  )
}
