import type React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label?: string
  tooltipText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showTooltip?: boolean
}

export function IconButton({
  icon: Icon,
  label,
  tooltipText,
  variant = "default",
  size = "default",
  showTooltip = true,
  className,
  ...props
}: IconButtonProps) {
  const button = (
    <Button variant={variant} size={size} className={cn("flex items-center gap-2", className)} {...props}>
      <Icon className="h-4 w-4" />
      {label && <span>{label}</span>}
    </Button>
  )

  if (showTooltip && tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}
