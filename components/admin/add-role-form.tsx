"use client"

import type React from "react"

import { useState } from "react"
import { createRole } from "@/actions/role-actions"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddRoleFormProps {
  onRoleAdded?: () => void
}

export function AddRoleForm({ onRoleAdded }: AddRoleFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const { user } = useCurrentUser()

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Validate title
    if (!title.trim()) {
      errors.title = "Role title is required"
    } else if (title.trim().length < 2) {
      errors.title = "Role title must be at least 2 characters"
    } else if (title.trim().length > 100) {
      errors.title = "Role title must be less than 100 characters"
    }

    // Validate description (optional)
    if (description.trim() && description.trim().length > 500) {
      errors.description = "Description must be less than 500 characters"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check authentication
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create roles.",
        variant: "destructive",
      })
      return
    }

    // Validate form
    if (!validateForm()) {
      setError("Please fix the validation errors below")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log(`👤 Creating role: ${title.trim()}`)

      const result = await createRole({
        title: title.trim(),
        description: description.trim() || undefined,
        is_active: true
      }, user)

      if (result.success && result.data) {
        console.log(`✅ Successfully created role: ${result.data.title}`)
        
        toast({
          title: "✅ Role Created",
          description: `The role "${result.data.title}" has been created successfully.`,
        })

        // Reset form
        setTitle("")
        setDescription("")
        setValidationErrors({})
        setError(null)

        // Notify parent component
        if (onRoleAdded) {
          onRoleAdded()
        }

      } else {
        const errorMessage = result.error || 'Failed to create role'
        console.error(`❌ Failed to create role: ${errorMessage}`)
        setError(errorMessage)
        
        toast({
          title: "Creation Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred while creating the role'
      console.error("❌ Unexpected error creating role:", error)
      setError(errorMessage)
      
      toast({
        title: "Unexpected Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    
    // Clear validation error when user starts typing
    if (validationErrors.title) {
      setValidationErrors(prev => ({ ...prev, title: '' }))
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    
    // Clear validation error when user starts typing
    if (validationErrors.description) {
      setValidationErrors(prev => ({ ...prev, description: '' }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👤 Create New Role
        </CardTitle>
        <CardDescription>
          Add a new role to the system with default permissions. You can configure detailed permissions after creation.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Role Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g., Sales Manager, HR Assistant, System Admin"
              required
              disabled={isSubmitting}
              className={validationErrors.title ? "border-destructive" : ""}
            />
            {validationErrors.title && (
              <p className="text-sm text-destructive">{validationErrors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Choose a clear, descriptive name for this role
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Describe the role's responsibilities, access level, and purpose within the organization"
              rows={3}
              disabled={isSubmitting}
              className={validationErrors.description ? "border-destructive" : ""}
            />
            {validationErrors.description && (
              <p className="text-sm text-destructive">{validationErrors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional: Provide additional context about this role
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !user}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Role...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Create Role
              </>
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="text-sm text-muted-foreground space-y-2">
        <div>
          <strong>Next steps:</strong> After creating a role, you can:
        </div>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Configure detailed permissions in Role Permissions</li>
          <li>Assign users to this role in User Management</li>
          <li>Modify role settings at any time</li>
        </ul>
      </CardFooter>
    </Card>
  )
}
