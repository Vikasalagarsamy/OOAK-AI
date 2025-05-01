"use client"

import { useState, useEffect, type RefObject } from "react"

interface DialogPosition {
  top: string
  left: string
  transform: string
  maxHeight: string
}

/**
 * Hook to calculate optimal dialog position based on trigger element and viewport
 * @param triggerRef Reference to the triggering element
 * @param dialogRef Reference to the dialog element
 * @param isOpen Whether the dialog is open
 * @param offset Optional offset from the trigger element (default: 8px)
 * @returns Calculated position styles for the dialog
 */
export function useDialogPosition(
  triggerRef: RefObject<HTMLElement | null>,
  dialogRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  offset = 8,
): DialogPosition {
  const [position, setPosition] = useState<DialogPosition>({
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    maxHeight: "calc(90vh - 20px)",
  })

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return

    const calculatePosition = () => {
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      // Always center the dialog for a consistent experience
      setPosition({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxHeight: `${viewportHeight - 100}px`,
      })
    }

    // Calculate position initially and on resize
    calculatePosition()
    window.addEventListener("resize", calculatePosition)

    return () => {
      window.removeEventListener("resize", calculatePosition)
    }
  }, [isOpen, dialogRef, offset])

  return position
}
