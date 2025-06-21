export function EditEmployeeForm({ employee }: { employee: any }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Edit Employee: {employee.name}</h3>
      <p>Employee edit form for ID: {employee.id}</p>
    </div>
  )
}
