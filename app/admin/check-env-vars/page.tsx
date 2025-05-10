import EnvVarChecker from "@/components/admin/env-var-checker"

export default function CheckEnvVarsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Checker</h1>
      <EnvVarChecker />
    </div>
  )
}
