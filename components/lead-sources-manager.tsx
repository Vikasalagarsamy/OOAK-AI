"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase"
import type { LeadSource } from "@/types/lead-source"
import { getLeadSources, createLeadSource } from "@/services/lead-source-service"
import { Loader2, Plus, Edit, Check, X } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name is required and must be at least 2 characters"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function LeadSourcesManager() {
  const { toast } = useToast()
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const { register, handleSubmit, reset, formState } = form
  const { errors } = formState

  useEffect(() => {
    fetchLeadSources()
  }, [])

  const fetchLeadSources = async () => {
    setLoading(true)
    try {
      const sources = await getLeadSources()
      setLeadSources(sources)
    } catch (error) {
      console.error("Error fetching lead sources:", error)
      toast({
        title: "Error",
        description: "Failed to fetch lead sources. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      await createLeadSource(data.name, data.description)

      toast({
        title: "Success",
        description: "Lead source created successfully!",
      })

      reset()
      fetchLeadSources()
    } catch (error) {
      console.error("Error creating lead source:", error)
      toast({
        title: "Error",
        description: `Failed to create lead source: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const startEditing = (source: LeadSource) => {
    setEditingId(source.id)
    setEditName(source.name)
    setEditDescription(source.description || "")
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName("")
    setEditDescription("")
  }

  const saveEdit = async () => {
    if (!editingId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("lead_sources")
        .update({
          name: editName,
          description: editDescription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Lead source updated successfully!",
      })

      setEditingId(null)
      fetchLeadSources()
    } catch (error) {
      console.error("Error updating lead source:", error)
      toast({
        title: "Error",
        description: `Failed to update lead source: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const toggleSourceStatus = async (id: number, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("lead_sources")
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Lead source ${currentStatus ? "deactivated" : "activated"} successfully!`,
      })

      fetchLeadSources()
    } catch (error) {
      console.error("Error toggling lead source status:", error)
      toast({
        title: "Error",
        description: `Failed to update lead source: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Lead Source</CardTitle>
          <CardDescription>Create a new lead source for tracking lead origins</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
                Source Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Trade Show, Partner Referral"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
                disabled={submitting}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this lead source"
                {...register("description")}
                disabled={submitting}
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead Source
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Lead Sources</CardTitle>
          <CardDescription>View and manage existing lead sources</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leadSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lead sources found. Add your first lead source above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>
                        {editingId === source.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="max-w-[200px]"
                          />
                        ) : (
                          source.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === source.id ? (
                          <Input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="max-w-[300px]"
                          />
                        ) : (
                          source.description || <span className="text-muted-foreground italic">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={source.is_active ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => toggleSourceStatus(source.id, source.is_active)}
                        >
                          {source.is_active ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === source.id ? (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" onClick={saveEdit}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" onClick={cancelEditing}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" onClick={() => startEditing(source)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
