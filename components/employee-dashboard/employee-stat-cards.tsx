import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserMinus, Clock, UserX, CalendarClock } from "lucide-react"

interface EmployeeStatCardsProps {
  stats: {
    totalEmployees: number
    activeEmployees: number
    inactiveEmployees: number
    onLeaveEmployees: number
    terminatedEmployees: number
    averageTenure: number
  }
}

export function EmployeeStatCards({ stats }: EmployeeStatCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          <p className="text-xs text-muted-foreground">All employees in the system</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeEmployees}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalEmployees > 0
              ? `${((stats.activeEmployees / stats.totalEmployees) * 100).toFixed(1)}% of total`
              : "No employees"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On Leave</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.onLeaveEmployees}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalEmployees > 0
              ? `${((stats.onLeaveEmployees / stats.totalEmployees) * 100).toFixed(1)}% of total`
              : "No employees"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Employees</CardTitle>
          <UserMinus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inactiveEmployees}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalEmployees > 0
              ? `${((stats.inactiveEmployees / stats.totalEmployees) * 100).toFixed(1)}% of total`
              : "No employees"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Terminated</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.terminatedEmployees}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalEmployees > 0
              ? `${((stats.terminatedEmployees / stats.totalEmployees) * 100).toFixed(1)}% of total`
              : "No employees"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Tenure</CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageTenure.toFixed(1)} months</div>
          <p className="text-xs text-muted-foreground">Average employment duration</p>
        </CardContent>
      </Card>
    </div>
  )
}
