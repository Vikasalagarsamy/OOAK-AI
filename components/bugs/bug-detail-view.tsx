"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Bug, BugComment, BugAttachment, BugStatus } from "@/types/bug"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Paperclip,
  Edit,
  ChevronLeft,
  Loader2,
  User,
  Download,
} from "lucide-react"
import { updateBugStatus, addBugComment, assignBug, handleAttachmentUpload } from "@/actions/bug-actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface BugDetailViewProps {
  bug: Bug
  comments: BugComment[]
  attachments: BugAttachment[]
}

export function BugDetailView({ bug, comments: initialComments, attachments: initialAttachments }: BugDetailViewProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [status, setStatus] = useState<BugStatus>(bug.status)
  const [assigneeId, setAssigneeId] = useState<string | null>(bug.assignee_id)
  const [comments, setComments] = useState<BugComment[]>(initialComments)
  const [attachments, setAttachments] = useState<BugAttachment[]>(initialAttachments)
  const [commentContent, setCommentContent] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Handle status change
  const handleStatusChange = async (newStatus: BugStatus) => {
    setIsChangingStatus(true)

    try {
      const result = await updateBugStatus(bug.id, newStatus)

      if (result.success) {
        setStatus(newStatus)
        toast({
          title: "Status updated",
          description: `Bug status changed to ${newStatus.replace("_", " ")}.`,
        })
      } else {
        toast({
          title: "Failed to update status",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update bug status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingStatus(false)
    }
  }

  // Handle assignee change
  const handleAssigneeChange = async (newAssigneeId: string) => {
    const effectiveAssigneeId = newAssigneeId === "" ? null : newAssigneeId
    setIsAssigning(true)

    try {
      const result = await assignBug(bug.id, effectiveAssigneeId)

      if (result.success) {
        setAssigneeId(effectiveAssigneeId)
        toast({
          title: "Assignee updated",
          description: effectiveAssigneeId ? "Bug has been assigned successfully." : "Bug has been unassigned.",
        })
      } else {
        toast({
          title: "Failed to update assignee",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating assignee:", error)
      toast({
        title: "Error",
        description: "Failed to update bug assignee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentContent.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingComment(true)

    try {
      const formData = new FormData()
      formData.append("bug_id", bug.id.toString())
      formData.append("content", commentContent)

      const result = await addBugComment(formData)

      if (result.success && result.data) {
        setComments((prev) => [...prev, result.data])
        setCommentContent("")
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully.",
        })
      } else {
        toast({
          title: "Failed to add comment",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("bug_id", bug.id.toString())
      formData.append("file", selectedFile)

      const result = await handleAttachmentUpload(formData)

      if (result.success && result.data) {
        setAttachments((prev) => [...prev, result.data])
        setSelectedFile(null)
        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully.",
        })
      } else {
        toast({
          title: "Failed to upload file",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: Bug["status"]) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="h-3 w-3 mr-1" /> Open
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Resolved
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" /> Closed
          </Badge>
        )
    }
  }

  // Get severity badge
  const getSeverityBadge = (severity: Bug["severity"]) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Critical
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Low
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button and edit link */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/admin/bugs")}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Back to Bugs
        </Button>
        <Button asChild>
          <Link href={`/admin/bugs/${bug.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" /> Edit Bug
          </Link>
        </Button>
      </div>

      {/* Bug details card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{bug.title}</CardTitle>
              <CardDescription className="mt-2 flex items-center space-x-2">
                <span>Bug #{bug.id}</span>
                <span>•</span>
                {getStatusBadge(status)}
                <span>•</span>
                {getSeverityBadge(bug.severity)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bug description */}
          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">{bug.description}</div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Bug Details</h3>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="font-medium w-24">Reported By:</dt>
                  <dd>
                    {bug.reporter ? (
                      <span className="flex items-center">
                        <Avatar className="h-5 w-5 mr-1">
                          <AvatarFallback>{`${bug.reporter.first_name.charAt(0)}${bug.reporter.last_name.charAt(0)}`}</AvatarFallback>
                        </Avatar>
                        {bug.reporter.first_name} {bug.reporter.last_name}
                      </span>
                    ) : (
                      "Unknown"
                    )}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="font-medium w-24">Created:</dt>
                  <dd>
                    <time dateTime={bug.created_at} className="text-muted-foreground">
                      {format(new Date(bug.created_at), "PPP")} (
                      {formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })})
                    </time>
                  </dd>
                </div>
                <div className="flex">
                  <dt className="font-medium w-24">Updated:</dt>
                  <dd>
                    <time dateTime={bug.updated_at} className="text-muted-foreground">
                      {format(new Date(bug.updated_at), "PPP")} (
                      {formatDistanceToNow(new Date(bug.updated_at), { addSuffix: true })})
                    </time>
                  </dd>
                </div>
                {bug.due_date && (
                  <div className="flex">
                    <dt className="font-medium w-24">Due Date:</dt>
                    <dd>
                      <time dateTime={bug.due_date} className="text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(bug.due_date), "PPP")}
                      </time>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Actions</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Status</label>
                  <Select value={status} onValueChange={handleStatusChange} disabled={isChangingStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  {isChangingStatus && (
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Updating status...
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Assignee</label>
                  <Select value={assigneeId || ""} onValueChange={handleAssigneeChange} disabled={isAssigning}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_assigned">Unassigned</SelectItem>
                      {/* This would typically be populated with user data from the database */}
                      <SelectItem value="user_id_1">John Doe</SelectItem>
                      <SelectItem value="user_id_2">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                  {isAssigning && (
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Updating assignee...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments and Attachments Tabs */}
      <Tabs defaultValue="comments">
        <TabsList>
          <TabsTrigger value="comments" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" /> Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center">
            <Paperclip className="h-4 w-4 mr-2" /> Attachments ({attachments.length})
          </TabsTrigger>
        </TabsList>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>View and add comments related to this bug.</CardDescription>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No comments yet. Be the first to add a comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-4 p-4 rounded-md border">
                      <Avatar>
                        <AvatarFallback>
                          {comment.user ? (
                            `${comment.user.first_name.charAt(0)}${comment.user.last_name.charAt(0)}`
                          ) : (
                            <User />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {comment.user ? `${comment.user.first_name} ${comment.user.last_name}` : "Unknown User"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSubmitComment} className="w-full space-y-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingComment}>
                    {isSubmittingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmittingComment ? "Adding Comment..." : "Add Comment"}
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>View and upload files related to this bug.</CardDescription>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="text-center py-10">
                  <Paperclip className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    No attachments yet. Upload files to help illustrate the bug.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <Paperclip className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{attachment.file_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {(attachment.file_size / 1024).toFixed(2)} KB • Uploaded{" "}
                            {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                            {attachment.uploader &&
                              ` by ${attachment.uploader.first_name} ${attachment.uploader.last_name}`}
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={attachment.file_path} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1" /> Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload New Attachment</label>
                  <input
                    type="file"
                    className="w-full"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleFileUpload} disabled={isUploading || !selectedFile}>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
