"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuccessMessageProps {
  message: string
  duration?: number
  visible: boolean
  onClose?: () => void
  className?: string
}

export function SuccessMessage({ message, duration = 3000, visible, onClose, className }: SuccessMessageProps) {
  const [isVisible, setIsVisible] = useState(visible)

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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className={cn(
              "bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-md mx-auto pointer-events-auto",
              "border border-green-200 dark:border-green-900",
              className,
            )}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 10 }}
              >
                <CheckCircle className="h-8 w-8 text-green-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex-1"
              >
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{message}</p>
              </motion.div>
            </div>
            <motion.div
              className="h-1 bg-green-500 mt-3 rounded-full"
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
