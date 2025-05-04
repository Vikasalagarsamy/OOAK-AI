import { cn } from "@/lib/utils"

interface PasswordStrengthMeterProps {
  strength: number
}

export function PasswordStrengthMeter({ strength }: PasswordStrengthMeterProps) {
  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return "No password"
    if (strength < 30) return "Very weak"
    if (strength < 50) return "Weak"
    if (strength < 80) return "Good"
    return "Strong"
  }

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-gray-200"
    if (strength < 30) return "bg-red-500"
    if (strength < 50) return "bg-orange-500"
    if (strength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-1">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", getStrengthColor(strength))}
          style={{ width: `${strength}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{getStrengthLabel(strength)}</span>
      </p>
    </div>
  )
}
