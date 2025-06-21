import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { ListItem } from "@/components/ui/list-item"
import { BarChart, Briefcase, LayoutDashboard } from "lucide-react"

        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <BarChart className="mr-2 h-4 w-4" /> Sales
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <ListItem href="/sales" title="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} />
              <ListItem href="/sales/create-lead" title="Create Lead" icon={<Briefcase className="h-4 w-4" />} />
              <ListItem href="/sales/my-leads" title="My Leads" icon={<Briefcase className="h-4 w-4" />} />
              <ListItem href="/sales/unassigned-lead" title="Unassigned Leads" icon={<Briefcase className="h-4 w-4" />} />
              <ListItem href="/sales/lead-sources" title="Lead Sources" icon={<Briefcase className="h-4 w-4" />} />
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem> 