export function EmployeeDetailsCard({ employee }: { employee: any }) { 
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Employee Details</h2>
      <div className="space-y-2">
        <p><strong>Name:</strong> {employee.name}</p>
        <p><strong>Email:</strong> {employee.email}</p>
        <p><strong>Role:</strong> {employee.role}</p>
      </div>
    </div>
  )
}
