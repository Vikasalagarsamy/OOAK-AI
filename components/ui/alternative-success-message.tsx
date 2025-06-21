"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ThumbsUp, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

type AnimationStyle = "fade" | "slide" | "scale" | "bounce"
type IconType = "check" | "thumbs-up" | "award"

interface AlternativeSuccessMessageProps {
  message: string
  subMessage?: string
  duration?: number
  visible?: boolean
  onClose?: () => void
  className?: string
  animationStyle?: AnimationStyle
  icon?: IconType
}

const animationVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 },
  },
  slide: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  bounce: {
    initial: { opacity: 0, scale: 0.5, y: -100 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.5, y: -100 },
    transition: { type: "spring", stiffness: 300, damping: 15 },
  },
}

const iconComponents = {
  check: CheckCircle,
  "thumbs-up": ThumbsUp,
  award: Award,
}

export function AlternativeSuccessMessage({
  message,
  subMessage,
  duration = 3000,
  visible,
  onClose,
  className,
  animationStyle = "fade",
  icon = "check",
}: AlternativeSuccessMessageProps) {
  const [isVisible, setIsVisible] = useState(visible)
  const IconComponent = iconComponents[icon]
  const animation = animationVariants[animationStyle]

  useEffect(() => {
    setIsVisible(visible)

    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  return (
    <Alert className="bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700">{message}</AlertDescription>
    </Alert>
  )
}
