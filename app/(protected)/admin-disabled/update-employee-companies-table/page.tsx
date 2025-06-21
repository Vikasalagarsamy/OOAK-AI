import { UpdateEmployeeCompaniesTableButton } from "@/components/update-employee-companies-table-button"

export default function UpdateEmployeeCompaniesTablePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Update Employee Companies Table</h1>
      <p className="mb-4">
        This page allows you to update the employee_companies table structure by adding missing columns that are
        required for the enhanced company allocation functionality.
      </p>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This operation will modify your database schema. Make sure you have a backup before proceeding.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <UpdateEmployeeCompaniesTableButton />
      </div>
    </div>
  )
}
