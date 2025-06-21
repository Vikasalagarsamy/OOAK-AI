import { MigrationExecutor } from "@/components/admin/migration-executor"

export default function ExecuteMigrationPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Database Migration for Rejection Reasons</h1>
      <MigrationExecutor />

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Migration Details</h2>
        <p className="mb-4">
          This migration adds columns to the leads table to properly store rejection reasons and related metadata.
        </p>

        <h3 className="font-medium mb-2">What This Migration Does:</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Adds the <code>rejection_reason</code> column to store detailed rejection explanations
          </li>
          <li>
            Adds the <code>rejected_at</code> timestamp to track when rejections occur
          </li>
          <li>
            Adds the <code>rejected_by</code> column to track who rejected each lead
          </li>
          <li>Creates indexes for improved query performance</li>
        </ol>

        <div className="mt-4">
          <h3 className="font-medium mb-2">After Migration:</h3>
          <p>
            Once the migration is complete, the system will automatically use these columns to store and display
            rejection reasons, providing better context for rejected leads and improving the lead management workflow.
          </p>
        </div>
      </div>
    </div>
  )
}
