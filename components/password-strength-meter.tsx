import { cn } from "@/lib/utils"

interface PasswordStrengthMeterProps {
  strength: number
}

export function PasswordStrengthMeter({ strength }: PasswordStrengthMeterProps) {
  const getStrengthText = () => {
    switch (strength) {
      case 0:
        return "Very Weak"
      case 1:
        return "Weak"
      case 2:
        return "Fair"
      case 3:
        return "Good"
      case 4:
        return "Strong"
      case 5:
        return "Very Strong"
      default:
        return "Very Weak"
    }
  }

  const getStrengthColor = () => {
    switch (strength) {
      case 0:
        return "bg-red-500"
      case 1:
        return "bg-red-400"
      case 2:
        return "bg-yellow-500"
      case 3:
        return "bg-yellow-400"
      case 4:
        return "bg-green-400"
      case 5:
        return "bg-green-500"
      default:
        return "bg-red-500"
    }
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs">Password Strength:</span>
        <span className="text-xs font-medium">{getStrengthText()}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", getStrengthColor())}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
    </div>
  )
}
