"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Phone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { sendLeadMessage } from "@/actions/lead-actions"

interface SendMessageDialogProps {
  lead: {
    id: number
    lead_number: string
    client_name: string
    email?: string
    phone?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendMessageDialog({ lead, open, onOpenChange }: SendMessageDialogProps) {
  const { toast } = useToast()
  const [messageType, setMessageType] = useState("email")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!message) {
      toast({
        title: "Message required",
        description: "Please enter a message to send",
        variant: "destructive",
      })
      return
    }

    if (messageType === "email" && !subject) {
      toast({
        title: "Subject required",
        description: "Please enter a subject for the email",
        variant: "destructive",
      })
      return
    }

    if (messageType === "email" && !lead.email) {
      toast({
        title: "No email address",
        description: "This lead doesn't have an email address",
        variant: "destructive",
      })
      return
    }

    if (messageType === "sms" && !lead.phone) {
      toast({
        title: "No phone number",
        description: "This lead doesn't have a phone number",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await sendLeadMessage(lead.id, messageType, subject, message)

      if (result.success) {
        toast({
          title: "Message sent",
          description: `Your message has been sent to ${lead.client_name}`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Failed to send message",
          description: result.message || "An error occurred while sending the message",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Failed to send message",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message to Lead</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Recipient</Label>
            <div className="text-sm font-medium">
              {lead.client_name} ({lead.lead_number})
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {lead.email && (
                <div className="flex items-center">
                  <Mail className="mr-1 h-3 w-3" />
                  {lead.email}
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center">
                  <Phone className="mr-1 h-3 w-3" />
                  {lead.phone}
                </div>
              )}
            </div>
          </div>

          <Tabs value={messageType} onValueChange={setMessageType}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" disabled={!lead.email}>
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" disabled={!lead.phone}>
                SMS
              </TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <div className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email-message">Message</Label>
                  <Textarea
                    id="email-message"
                    placeholder="Type your email message here"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="sms">
              <div className="grid gap-2 mt-4">
                <Label htmlFor="sms-message">Message</Label>
                <Textarea
                  id="sms-message"
                  placeholder="Type your SMS message here"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={160}
                />
                <div className="text-xs text-right text-muted-foreground">{message.length}/160 characters</div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
