import Link from "next/link"
import { cn } from "@/lib/utils"

interface ListItemProps {
  className?: string
  title: string
  href: string
  icon?: React.ReactNode
}

export function ListItem({ className, title, href, icon }: ListItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-sm font-medium leading-none">{title}</div>
        </div>
      </Link>
    </li>
  )
} 