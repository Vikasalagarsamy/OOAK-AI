"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

interface UserAccountActionsButtonProps {
  accountId: number
  isActive: boolean
  onToggleStatus: (accountId: number, currentStatus: boolean) => void
  onDelete: (accountId: number) => void
}

export function UserAccountActionsButton({
  accountId,
  isActive,
  onToggleStatus,
  onDelete,
}: UserAccountActionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative inline-block text-right">
      <Button ref={buttonRef} variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(!isOpen)}>
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            <button
              className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                onToggleStatus(accountId, isActive)
                setIsOpen(false)
              }}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              className="text-red-600 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                onDelete(accountId)
                setIsOpen(false)
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
