"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Phone, Upload, CheckCircle, AlertCircle, FileText, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { SavedQuotation } from "@/lib/client-safe-actions"

interface PostSaleConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: SavedQuotation | null
  onConfirm: (confirmationData: PostSaleConfirmationData) => void
  loading?: boolean
}

export interface PostSaleConfirmationData {
  // Call Details
  call_date: string
  call_time: string
  call_duration: number
  client_contact_person: string
  confirmation_method: 'phone' | 'video_call' | 'in_person' | 'email'
  
  // Service Confirmations
  services_confirmed: Array<{
    service_id: number
    service_name: string
    confirmed: boolean
    client_notes?: string
    modifications?: string
  }>
  
  // Deliverable Confirmations
  deliverables_confirmed: Array<{
    deliverable_id: number
    deliverable_name: string
    confirmed: boolean
    client_notes?: string
    modifications?: string
  }>
  
  // Event Details Confirmation
  event_details_confirmed: {
    date_confirmed: boolean
    venue_confirmed: boolean
    timing_confirmed: boolean
    guest_count_confirmed: boolean
    special_requirements_confirmed: boolean
    client_notes?: string
  }
  
  // Client Feedback
  client_satisfaction_rating: number
  client_expectations: string
  client_concerns?: string
  additional_requests?: string
  
  // Documentation
  call_summary: string
  action_items?: string
  follow_up_required: boolean
  follow_up_date?: string
  
  // File Attachments
  attachments?: Array<{
    file_name: string
    file_type: string
    file_url: string
    description: string
  }>
}

export function PostSaleConfirmationDialog({
  open,
  onOpenChange,
  quotation,
  onConfirm,
  loading = false
}: PostSaleConfirmationDialogProps) {
  const [formData, setFormData] = useState<PostSaleConfirmationData>({
    call_date: new Date().toISOString().split('T')[0],
    call_time: new Date().toTimeString().slice(0, 5),
    call_duration: 30,
    client_contact_person: quotation?.client_name || '',
    confirmation_method: 'phone',
    services_confirmed: [],
    deliverables_confirmed: [],
    event_details_confirmed: {
      date_confirmed: true,
      venue_confirmed: true,
      timing_confirmed: true,
      guest_count_confirmed: true,
      special_requirements_confirmed: true
    },
    client_satisfaction_rating: 5,
    client_expectations: '',
    call_summary: '',
    follow_up_required: false
  })

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Initialize services and deliverables from quotation
  React.useEffect(() => {
    if (quotation?.quotation_data) {
      const firstEvent = quotation.quotation_data.events[0]
      if (firstEvent) {
        setFormData(prev => ({
          ...prev,
          services_confirmed: firstEvent.selected_services.map(service => ({
            service_id: service.id,
            service_name: `Service ${service.id}`,
            confirmed: true
          })),
          deliverables_confirmed: firstEvent.selected_deliverables.map(deliverable => ({
            deliverable_id: deliverable.id,
            deliverable_name: `Deliverable ${deliverable.id}`,
            confirmed: true
          }))
        }))
      }
    }
  }, [quotation])

  const handleSubmit = () => {
    // Validation
    if (!formData.call_summary.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a call summary",
        variant: "destructive"
      })
      return
    }

    if (!formData.client_expectations.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please document client expectations",
        variant: "destructive"
      })
      return
    }

    // Include uploaded files in the confirmation data
    const confirmationData = {
      ...formData,
      attachments: uploadedFiles.map(file => ({
        file_name: file.name,
        file_type: file.type,
        file_url: '', // Would be populated after upload
        description: `Post-sale call documentation - ${file.name}`
      }))
    }

    onConfirm(confirmationData)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (!quotation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Post-Sale Confirmation - {quotation.quotation_number}
          </DialogTitle>
          <DialogDescription>
            Document the post-sale confirmation call with {quotation.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Call Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="call_date">Call Date</Label>
                  <Input
                    id="call_date"
                    type="date"
                    value={formData.call_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, call_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="call_time">Call Time</Label>
                  <Input
                    id="call_time"
                    type="time"
                    value={formData.call_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, call_time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="call_duration">Duration (minutes)</Label>
                  <Input
                    id="call_duration"
                    type="number"
                    value={formData.call_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, call_duration: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmation_method">Method</Label>
                  <Select
                    value={formData.confirmation_method}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, confirmation_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="video_call">Video Call</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="client_contact_person">Client Contact Person</Label>
                <Input
                  id="client_contact_person"
                  value={formData.client_contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_contact_person: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Details Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Details Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'date_confirmed', label: 'Event Date' },
                  { key: 'venue_confirmed', label: 'Venue' },
                  { key: 'timing_confirmed', label: 'Event Timing' },
                  { key: 'guest_count_confirmed', label: 'Guest Count' },
                  { key: 'special_requirements_confirmed', label: 'Special Requirements' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={formData.event_details_confirmed[key as keyof typeof formData.event_details_confirmed] as boolean}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          event_details_confirmed: {
                            ...prev.event_details_confirmed,
                            [key]: checked
                          }
                        }))
                      }
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services Confirmation */}
          {formData.services_confirmed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Services Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.services_confirmed.map((service, index) => (
                  <div key={service.service_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={service.confirmed}
                        onCheckedChange={(checked) => {
                          const updated = [...formData.services_confirmed]
                          updated[index].confirmed = checked as boolean
                          setFormData(prev => ({ ...prev, services_confirmed: updated }))
                        }}
                      />
                      <span className="font-medium">{service.service_name}</span>
                    </div>
                    <Badge variant={service.confirmed ? "default" : "secondary"}>
                      {service.confirmed ? "Confirmed" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Client Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Client Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client_satisfaction_rating">Satisfaction Rating (1-5)</Label>
                <Select
                  value={formData.client_satisfaction_rating.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_satisfaction_rating: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Unsatisfied</SelectItem>
                    <SelectItem value="2">2 - Unsatisfied</SelectItem>
                    <SelectItem value="3">3 - Neutral</SelectItem>
                    <SelectItem value="4">4 - Satisfied</SelectItem>
                    <SelectItem value="5">5 - Very Satisfied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client_expectations">Client Expectations *</Label>
                <Textarea
                  id="client_expectations"
                  placeholder="Document what the client expects from our services..."
                  value={formData.client_expectations}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_expectations: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="client_concerns">Client Concerns (if any)</Label>
                <Textarea
                  id="client_concerns"
                  placeholder="Any concerns or issues raised by the client..."
                  value={formData.client_concerns || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_concerns: e.target.value }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Call Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Call Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="call_summary">Call Summary *</Label>
                <Textarea
                  id="call_summary"
                  placeholder="Provide a comprehensive summary of the post-sale call..."
                  value={formData.call_summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, call_summary: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="action_items">Action Items</Label>
                <Textarea
                  id="action_items"
                  placeholder="Any follow-up actions required..."
                  value={formData.action_items || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, action_items: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow_up_required"
                  checked={formData.follow_up_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, follow_up_required: checked as boolean }))}
                />
                <Label htmlFor="follow_up_required">Follow-up required</Label>
              </div>

              {formData.follow_up_required && (
                <div>
                  <Label htmlFor="follow_up_date">Follow-up Date</Label>
                  <Input
                    id="follow_up_date"
                    type="date"
                    value={formData.follow_up_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Attachments
              </CardTitle>
              <CardDescription>
                Upload call recordings, screenshots, or other documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file_upload">Upload Files</Label>
                <Input
                  id="file_upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files:</Label>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Confirming..." : "Confirm Post-Sale"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 