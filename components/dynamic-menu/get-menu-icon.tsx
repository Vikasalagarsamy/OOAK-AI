import {
  LayoutDashboard,
  Building2,
  Building,
  Truck,
  Package,
  Users,
  Shield,
  UserCog,
  UserPlus,
  Briefcase,
  Settings,
  TrendingUp,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  BarChart2,
  PieChart,
  ClipboardList,
  List,
  UserCheck,
  Lock,
  PenToolIcon as Tool,
  CheckSquare,
  PlusCircle,
  Database,
  Link,
  Edit,
  MapPin,
  GitBranch,
  type LucideIcon,
  type LightbulbIcon as LucideProps,
} from "lucide-react"

type IconName =
  | "layout-dashboard"
  | "building-2"
  | "building"
  | "truck"
  | "package"
  | "users"
  | "shield"
  | "user-cog"
  | "user-plus"
  | "briefcase"
  | "settings"
  | "trending-up"
  | "calendar"
  | "file-text"
  | "check-circle"
  | "x-circle"
  | "bar-chart-2"
  | "pie-chart"
  | "clipboard-list"
  | "list"
  | "user-check"
  | "lock"
  | "tool"
  | "check-square"
  | "plus-circle"
  | "database"
  | "link"
  | "edit"
  | "map-pin"
  | "git-branch"

const iconMap: Record<IconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  building: Building,
  truck: Truck,
  package: Package,
  users: Users,
  shield: Shield,
  "user-cog": UserCog,
  "user-plus": UserPlus,
  briefcase: Briefcase,
  settings: Settings,
  "trending-up": TrendingUp,
  calendar: Calendar,
  "file-text": FileText,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  "bar-chart-2": BarChart2,
  "pie-chart": PieChart,
  "clipboard-list": ClipboardList,
  list: List,
  "user-check": UserCheck,
  lock: Lock,
  tool: Tool,
  "check-square": CheckSquare,
  "plus-circle": PlusCircle,
  database: Database,
  link: Link,
  edit: Edit,
  "map-pin": MapPin,
  "git-branch": GitBranch,
}

export function getMenuIcon(iconName: string, props: LucideProps = {}) {
  const defaultProps = { className: "h-4 w-4 mr-2", ...props }

  // Type assertion to handle the icon name
  const icon = iconMap[iconName as IconName]

  if (!icon) {
    console.warn(`Icon "${iconName}" not found in icon map`)
    return <LayoutDashboard {...defaultProps} />
  }

  const IconComponent = icon
  return <IconComponent {...defaultProps} />
}
