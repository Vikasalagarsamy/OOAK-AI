'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Play,
  Clock,
  Target,
  Phone,
  MessageCircle,
  Users,
  DollarSign,
  ClipboardCheck,
  ArrowRight,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Save,
  Eye,
  Zap,
  Brain,
  Workflow
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { TaskSequenceFlow } from '@/components/task-sequence-flow'

interface SequenceStep {
  id?: number
  step_number: number
  title: string
  description: string
  icon: string
  due_after_hours: number
  priority: 'low' | 'medium' | 'high'
  is_conditional: boolean
  condition_type?: string
  condition_value?: string
  estimated_duration?: string
}

interface SequenceRule {
  id?: number
  rule_type: string
  condition_field: string
  condition_operator: string
  condition_value: string
  action_type: string
  action_data: any
  is_active: boolean
}

interface SequenceTemplate {
  id?: number
  name: string
  description: string
  category: string
  is_active: boolean
  steps: SequenceStep[]
  rules: SequenceRule[]
  metadata?: any
}

export default function AdminTaskSequencesPage() {
  const [sequences, setSequences] = useState<SequenceTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSequence, setEditingSequence] = useState<SequenceTemplate | null>(null)
  const [previewSequence, setPreviewSequence] = useState<SequenceTemplate | null>(null)

  // Form state for creating/editing sequences
  const [sequenceForm, setSequenceForm] = useState<SequenceTemplate>({
    name: '',
    description: '',
    category: 'sales_followup',
    is_active: true,
    steps: [],
    rules: []
  })

  useEffect(() => {
    loadSequences()
  }, [])

  const loadSequences = async () => {
    try {
      setLoading(true)
      // Using real database API
      const response = await fetch('/api/admin/task-sequences')
      if (response.ok) {
        const data = await response.json()
        setSequences(data.sequences || [])
      }
    } catch (error) {
      console.error('Error loading sequences:', error)
      toast({
        title: "Error",
        description: "Failed to load task sequences",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSequence = async () => {
    try {
      setLoading(true)
      
      // Use real database API
      const url = editingSequence ? '/api/admin/task-sequences' : '/api/admin/task-sequences'
      const method = editingSequence ? 'PUT' : 'POST'
      const payload = editingSequence 
        ? { ...sequenceForm, id: editingSequence.id }
        : sequenceForm

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await loadSequences()
        setShowCreateDialog(false)
        setEditingSequence(null)
        setSequenceForm({
          name: '',
          description: '',
          category: 'sales_followup',
          is_active: true,
          steps: [],
          rules: []
        })
        
        toast({
          title: "Success",
          description: `Sequence ${editingSequence ? 'updated' : 'created'} successfully!`
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.details || "Failed to save sequence",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving sequence:', error)
      toast({
        title: "Error",
        description: "Failed to save sequence",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    const newStep: SequenceStep = {
      step_number: sequenceForm.steps.length + 1,
      title: '',
      description: '',
      icon: 'target',
      due_after_hours: 24,
      priority: 'medium',
      is_conditional: false,
      estimated_duration: '30 minutes'
    }
    setSequenceForm({
      ...sequenceForm,
      steps: [...sequenceForm.steps, newStep]
    })
  }

  const updateStep = (index: number, step: Partial<SequenceStep>) => {
    const updatedSteps = sequenceForm.steps.map((s, i) => 
      i === index ? { ...s, ...step } : s
    )
    setSequenceForm({ ...sequenceForm, steps: updatedSteps })
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const steps = [...sequenceForm.steps]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < steps.length) {
      const temp = steps[index]
      steps[index] = steps[newIndex]
      steps[newIndex] = temp
      
      // Update step numbers
      steps.forEach((step, i) => {
        step.step_number = i + 1
      })
      
      setSequenceForm({ ...sequenceForm, steps })
    }
  }

  const removeStep = (index: number) => {
    const steps = sequenceForm.steps.filter((_, i) => i !== index)
    // Update step numbers
    steps.forEach((step, i) => {
      step.step_number = i + 1
    })
    setSequenceForm({ ...sequenceForm, steps })
  }

  const duplicateSequence = (sequence: SequenceTemplate) => {
    const duplicated = {
      ...sequence,
      id: undefined,
      name: `${sequence.name} (Copy)`,
      steps: sequence.steps?.map(step => ({ ...step, id: undefined })) || [],
      rules: sequence.rules?.map(rule => ({ ...rule, id: undefined })) || []
    }
    setSequenceForm(duplicated)
    setEditingSequence(null)
    setShowCreateDialog(true)
  }

  const editSequence = (sequence: SequenceTemplate) => {
    setSequenceForm(sequence)
    setEditingSequence(sequence)
    setShowCreateDialog(true)
  }

  const getIconComponent = (iconName: string) => {
    const icons: any = {
      phone: Phone,
      message: MessageCircle,
      users: Users,
      target: Target,
      dollar: DollarSign,
      clipboard: ClipboardCheck,
      clock: Clock
    }
    const IconComponent = icons[iconName] || Target
    return <IconComponent className="w-4 h-4" />
  }

  const PRESET_TEMPLATES = [
    {
      name: "Photography Quotation Follow-up",
      description: "Standard follow-up sequence for photography quotations",
      category: "sales_followup",
      steps: [
        {
          title: "Initial Follow-up Call",
          description: "Call client to confirm quotation receipt and answer questions",
          icon: "phone",
          due_after_hours: 2,
          priority: "high"
        },
        {
          title: "WhatsApp Check-in",
          description: "Send WhatsApp message for quotation review status",
          icon: "message",
          due_after_hours: 24,
          priority: "medium"
        },
        {
          title: "Detailed Discussion",
          description: "Schedule detailed discussion about services and deliverables",
          icon: "target",
          due_after_hours: 72,
          priority: "medium"
        },
        {
          title: "Payment Discussion",
          description: "Discuss payment terms and advance payment",
          icon: "dollar",
          due_after_hours: 120,
          priority: "high"
        },
        {
          title: "Final Follow-up",
          description: "Final follow-up to close deal or understand rejection",
          icon: "clipboard",
          due_after_hours: 168,
          priority: "medium"
        }
      ]
    },
    {
      name: "High-Value Client Sequence",
      description: "Premium follow-up sequence for high-value quotations (₹1,00,000+)",
      category: "premium_followup",
      steps: [
        {
          title: "Immediate Priority Call",
          description: "Priority call within 1 hour for high-value client",
          icon: "phone",
          due_after_hours: 1,
          priority: "high"
        },
        {
          title: "Team Strategy Discussion",
          description: "Internal team discussion for high-value deal strategy",
          icon: "users",
          due_after_hours: 12,
          priority: "high"
        },
        {
          title: "Personalized Proposal",
          description: "Create personalized proposal presentation",
          icon: "target",
          due_after_hours: 24,
          priority: "high"
        },
        {
          title: "Executive Meeting",
          description: "Schedule meeting with decision makers",
          icon: "users",
          due_after_hours: 48,
          priority: "high"
        },
        {
          title: "Contract Finalization",
          description: "Finalize contract terms and payment",
          icon: "dollar",
          due_after_hours: 96,
          priority: "high"
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🎛️ Task Sequence Admin
            </h1>
            <p className="text-gray-600 mt-2">Master control for automated task sequences</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadSequences} variant="outline" disabled={loading}>
              <Brain className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setSequenceForm({
                      name: '',
                      description: '',
                      category: 'sales_followup',
                      is_active: true,
                      steps: [],
                      rules: []
                    })
                    setEditingSequence(null)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sequence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSequence ? 'Edit' : 'Create'} Task Sequence
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Sequence Name *</Label>
                      <Input
                        id="name"
                        value={sequenceForm.name}
                        onChange={(e) => setSequenceForm({ ...sequenceForm, name: e.target.value })}
                        placeholder="e.g., Photography Quotation Follow-up"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={sequenceForm.category} 
                        onValueChange={(value) => setSequenceForm({ ...sequenceForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales_followup">Sales Follow-up</SelectItem>
                          <SelectItem value="premium_followup">Premium Follow-up</SelectItem>
                          <SelectItem value="customer_service">Customer Service</SelectItem>
                          <SelectItem value="project_management">Project Management</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={sequenceForm.description}
                      onChange={(e) => setSequenceForm({ ...sequenceForm, description: e.target.value })}
                      placeholder="Describe when and how this sequence should be used"
                      rows={2}
                    />
                  </div>

                  {/* Preset Templates */}
                  {!editingSequence && sequenceForm.steps.length === 0 && (
                    <div>
                      <Label>Quick Start Templates</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {PRESET_TEMPLATES.map((template, index) => (
                          <Card key={index} className="cursor-pointer hover:bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {template.steps.length} steps
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => {
                                  setSequenceForm({
                                    ...sequenceForm,
                                    name: template.name,
                                    description: template.description,
                                    category: template.category,
                                    steps: template.steps.map((step, i) => ({
                                      ...step,
                                      step_number: i + 1,
                                      is_conditional: false
                                    }))
                                  })
                                }}
                              >
                                Use Template
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Sequence Steps ({sequenceForm.steps.length})</Label>
                      <Button size="sm" onClick={addStep} variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Step
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {sequenceForm.steps.map((step, index) => (
                        <Card key={index} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <Badge className="bg-blue-100 text-blue-800 mb-2">
                                  {step.step_number}
                                </Badge>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveStep(index, 'up')}
                                    disabled={index === 0}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveStep(index, 'down')}
                                    disabled={index === sequenceForm.steps.length - 1}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                  <Label className="text-xs">Title *</Label>
                                  <Input
                                    value={step.title}
                                    onChange={(e) => updateStep(index, { title: e.target.value })}
                                    placeholder="Step title"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Icon</Label>
                                  <Select 
                                    value={step.icon} 
                                    onValueChange={(value) => updateStep(index, { icon: value })}
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="phone">📞 Phone</SelectItem>
                                      <SelectItem value="message">💬 Message</SelectItem>
                                      <SelectItem value="users">👥 Users</SelectItem>
                                      <SelectItem value="target">🎯 Target</SelectItem>
                                      <SelectItem value="dollar">💰 Dollar</SelectItem>
                                      <SelectItem value="clipboard">📋 Clipboard</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-xs">Due After (Hours)</Label>
                                  <Input
                                    type="number"
                                    value={step.due_after_hours}
                                    onChange={(e) => updateStep(index, { due_after_hours: parseInt(e.target.value) || 24 })}
                                    className="text-sm"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">Priority</Label>
                                  <Select 
                                    value={step.priority} 
                                    onValueChange={(value: any) => updateStep(index, { priority: value })}
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeStep(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="mt-3">
                              <Label className="text-xs">Description</Label>
                              <Textarea
                                value={step.description}
                                onChange={(e) => updateStep(index, { description: e.target.value })}
                                placeholder="Describe what should be done in this step"
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4">
                    <div className="flex gap-2">
                      {sequenceForm.steps.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setPreviewSequence(sequenceForm)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={saveSequence}
                        disabled={!sequenceForm.name || sequenceForm.steps.length === 0 || loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {editingSequence ? 'Update' : 'Create'} Sequence
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Sequences Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sequences</CardTitle>
              <Workflow className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{sequences.length}</div>
              <p className="text-xs text-blue-600">
                {sequences.filter(s => s.is_active).length} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {sequences.filter(s => s.is_active).length}
              </div>
              <p className="text-xs text-green-600">Ready for automation</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Steps</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {sequences.reduce((sum, seq) => sum + (seq.steps?.length || 0), 0)}
              </div>
              <p className="text-xs text-purple-600">Across all sequences</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Ready</CardTitle>
              <Brain className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {sequences.filter(s => s.is_active && (s.steps?.length || 0) >= 3).length}
              </div>
              <p className="text-xs text-orange-600">Ready for AI automation</p>
            </CardContent>
          </Card>
        </div>

        {/* Sequences Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Task Sequences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sequences.map((sequence) => (
                    <TableRow key={sequence.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sequence.name}</p>
                          <p className="text-sm text-gray-500">{sequence.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sequence.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {sequence.steps?.length || 0} steps
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sequence.metadata?.estimated_duration_days 
                          ? `${Math.ceil(sequence.metadata.estimated_duration_days)} days`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={sequence.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {sequence.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewSequence(sequence)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editSequence(sequence)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicateSequence(sequence)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        {previewSequence && (
          <Dialog open={!!previewSequence} onOpenChange={() => setPreviewSequence(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Preview: {previewSequence.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <TaskSequenceFlow
                  currentStep={1}
                  quotationValue={150000}
                  quotationNumber="QT-PREVIEW"
                  clientName="Sample Client"
                />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Step Details:</h4>
                  {previewSequence.steps?.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <Badge className="bg-blue-100 text-blue-800">
                        {step.step_number}
                      </Badge>
                      {getIconComponent(step.icon)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs text-gray-600">{step.description}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.due_after_hours}h • {step.priority}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
} 