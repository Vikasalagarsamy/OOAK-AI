import { AddRejectionColumnsButton } from "@/components/admin/add-rejection-columns-button"

export default function AddRejectionColumnsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add Rejection Columns to Leads Table</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <p className="mb-4">This utility will add the following columns to the leads table:</p>

        <ul className="list-disc pl-6 mb-6">
          <li>
            <code>rejection_reason</code> - Stores the reason why a lead was rejected
          </li>
          <li>
            <code>rejected_at</code> - Timestamp when the lead was rejected
          </li>
          <li>
            <code>rejected_by</code> - User ID of the person who rejected the lead
          </li>
        </ul>

        <p className="mb-6">These columns will enable better tracking and reporting of rejected leads.</p>

        <AddRejectionColumnsButton />
      </div>
    </div>
  )
}
