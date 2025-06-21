import { OrganizationHeader } from "@/components/organization-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Building, 
  Building2, 
  Briefcase, 
  Users, 
  UserCog, 
  ArrowRight, 
  TrendingUp,
  Shield,
  UserPlus,
  MapPin,
  Globe,
  Truck
} from "lucide-react"

const organizationModules = [
  {
    title: "Companies",
    description: "Manage organization companies and their details",
    href: "/organization/companies",
    icon: Building,
    color: "bg-blue-500",
    gradient: "from-blue-50 to-blue-100",
    category: "Core",
    features: ["Company Profiles", "Business Details", "Contact Info"]
  },
  {
    title: "Branches",
    description: "Manage branch locations across your organization",
    href: "/organization/branches", 
    icon: MapPin,
    color: "bg-green-500",
    gradient: "from-green-50 to-green-100",
    category: "Core",
    features: ["Location Management", "Branch Operations", "Regional Control"]
  },
  {
    title: "Clients",
    description: "Manage client information and relationships",
    href: "/organization/clients",
    icon: Briefcase,
    color: "bg-purple-500", 
    gradient: "from-purple-50 to-purple-100",
    category: "Relationships",
    features: ["Client Profiles", "Relationship Management", "Business Partnerships"]
  },
  {
    title: "Suppliers",
    description: "Manage supplier information and relationships",
    href: "/organization/suppliers",
    icon: Truck,
    color: "bg-orange-500",
    gradient: "from-orange-50 to-orange-100", 
    category: "Relationships",
    features: ["Supplier Database", "Procurement", "Supply Chain"]
  },
  {
    title: "Vendors",
    description: "Manage vendor information and relationships",
    href: "/organization/vendors",
    icon: Globe,
    color: "bg-cyan-500",
    gradient: "from-cyan-50 to-cyan-100",
    category: "Relationships", 
    features: ["Vendor Management", "Service Providers", "External Partners"]
  },
  {
    title: "Roles & Permissions",
    description: "Manage user roles and access control",
    href: "/organization/roles",
    icon: Shield,
    color: "bg-red-500",
    gradient: "from-red-50 to-red-100",
    category: "Security",
    features: ["Role Management", "Access Control", "Permission Matrix"]
  },
  {
    title: "User Accounts",
    description: "Manage user accounts and system access",
    href: "/organization/user-accounts",
    icon: Users,
    color: "bg-indigo-500", 
    gradient: "from-indigo-50 to-indigo-100",
    category: "Security",
    features: ["Account Management", "User Profiles", "Access Rights"]
  },
  {
    title: "Account Creation", 
    description: "Create new user accounts for employees",
    href: "/organization/account-creation",
    icon: UserPlus,
    color: "bg-emerald-500",
    gradient: "from-emerald-50 to-emerald-100",
    category: "Security",
    features: ["New User Setup", "Onboarding", "Role Assignment"]
  }
]

const categories = Array.from(new Set(organizationModules.map(module => module.category)))

export default function OrganizationPage() {
  return (
    <div className="space-y-8">
      <OrganizationHeader
        title="Organization Management"
        description="Streamline your organization structure with our comprehensive management suite. Control companies, branches, relationships, and security from one unified platform."
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Active Modules</p>
                <p className="text-2xl font-bold text-blue-900">{organizationModules.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Categories</p>
                <p className="text-2xl font-bold text-green-900">{categories.length}</p>
              </div>
              <Building className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Core Systems</p>
                <p className="text-2xl font-bold text-purple-900">
                  {organizationModules.filter(m => m.category === 'Core').length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Security</p>
                <p className="text-2xl font-bold text-orange-900">
                  {organizationModules.filter(m => m.category === 'Security').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules by Category */}
      {categories.map(category => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{category} Management</h2>
            <Badge variant="outline" className="text-xs">
              {organizationModules.filter(m => m.category === category).length} modules
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {organizationModules
              .filter(module => module.category === category)
              .map((module) => {
                const IconComponent = module.icon
                return (
                  <Link key={module.title} href={module.href} className="group">
                    <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] border-0 shadow-md hover:shadow-xl">
                      <CardHeader className="pb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className={`h-6 w-6 ${module.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {module.title}
                          </CardTitle>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {module.description}
                        </CardDescription>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Key Features
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {module.features.map((feature, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted transition-colors"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-4 justify-between group-hover:bg-primary/10 transition-colors"
                        >
                          <span>Manage {module.title}</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
          </div>
        </div>
      ))}

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Need Help Getting Started?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our organization management system helps you structure your business efficiently. 
                Start with setting up companies and branches, then configure user roles and permissions.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  📖 Documentation
                </Badge>
                <Badge variant="outline" className="text-xs">
                  🎥 Video Tutorials
                </Badge>
                <Badge variant="outline" className="text-xs">
                  💬 Live Support
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
