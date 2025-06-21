import React from 'react'
import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'

export function getIcon(iconName: string, className: string = 'h-5 w-5'): React.ReactNode {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[iconName] || Icons.Settings
  return React.createElement(Icon, { className })
} 