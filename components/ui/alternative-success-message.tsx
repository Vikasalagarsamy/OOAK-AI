"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ThumbsUp, Award } from "lucide-react"
import { cn } from "@/lib/utils"

type AnimationStyle = "fade" | "slide" | "scale" | "bounce"
type IconType = "check" | "thumbs-up" | "award"

interface AlternativeSuccessMessageProps {
  message: string
  subMessage?: string
  duration?: number
  visible: boolean
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
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <motion.div
            initial={animation.initial}
            animate={animation.animate}
            exit={animation.exit}
            transition={animation.transition}
            className={cn(
              "bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 max-w-md mx-auto pointer-events-auto",
              "border-l-4 border-green-500",
              className,
            )}
          >
            <div className="flex items-start space-x-4">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 10 }}
                className="bg-green-100 dark:bg-green-900 p-2 rounded-full"
              >
                <IconComponent className="h-6 w-6 text-green-600 dark:text-green-300" />
              </motion.div>
              <div className="flex-1">
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  {message}
                </motion.h3>
                {subMessage && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-sm text-gray-600 dark:text-gray-300 mt-1"
                  >
                    {subMessage}
                  </motion.p>
                )}
              </div>
            </div>
            <motion.div
              className="h-1 bg-green-500 mt-4 rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
