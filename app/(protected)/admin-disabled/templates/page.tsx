"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QUOTATION_TEMPLATES, getTemplatesByCategory, QuotationTemplate } from "@/components/quotation-templates"
import { Palette, Eye, Star, Sparkles, Crown, Zap, Building, Trash2, AlertTriangle } from "lucide-react"

// Confirmation Dialog Component
function DeleteConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  templateName 
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  templateName: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Delete Template</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the <strong>"{templateName}"</strong> template? 
          This action cannot be undone.
        </p>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Template
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [deletedTemplates, setDeletedTemplates] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    templateId: string
    templateName: string
  }>({
    isOpen: false,
    templateId: "",
    templateName: ""
  })

  const categories = [
    { id: "all", name: "All Templates", count: QUOTATION_TEMPLATES.length },
    { id: "modern", name: "Modern", count: getTemplatesByCategory("modern").length },
    { id: "classic", name: "Classic", count: getTemplatesByCategory("classic").length },
    { id: "minimal", name: "Minimal", count: getTemplatesByCategory("minimal").length },
    { id: "luxury", name: "Luxury", count: getTemplatesByCategory("luxury").length },
    { id: "creative", name: "Creative", count: getTemplatesByCategory("creative").length },
  ]

  const filteredTemplates = selectedCategory === "all" 
    ? QUOTATION_TEMPLATES.filter(template => !deletedTemplates.has(template.id))
    : QUOTATION_TEMPLATES.filter(template => template.category === selectedCategory && !deletedTemplates.has(template.id))

  const getIconByCategory = (category: string) => {
    switch (category) {
      case "modern": return Sparkles
      case "classic": return Building
      case "minimal": return Star
      case "luxury": return Crown
      case "creative": return Zap
      default: return Palette
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "modern": return "from-purple-500 to-pink-500"
      case "classic": return "from-blue-600 to-indigo-700"
      case "minimal": return "from-gray-500 to-slate-600"
      case "luxury": return "from-amber-500 to-yellow-600"
      case "creative": return "from-pink-500 to-red-500"
      default: return "from-blue-500 to-purple-600"
    }
  }

  const handleDeleteClick = (template: QuotationTemplate) => {
    setDeleteDialog({
      isOpen: true,
      templateId: template.id,
      templateName: template.name
    })
  }

  const handleDeleteConfirm = () => {
    setDeletedTemplates(prev => new Set([...prev, deleteDialog.templateId]))
    setDeleteDialog({ isOpen: false, templateId: "", templateName: "" })
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, templateId: "", templateName: "" })
  }

  const handleRestoreAll = () => {
    setDeletedTemplates(new Set())
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotation Templates</h1>
        <p className="text-gray-600">
          Manage your quotation templates and preview different designs for your business.
        </p>
        {deletedTemplates.size > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-800">
                {deletedTemplates.size} template{deletedTemplates.size > 1 ? 's' : ''} deleted
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestoreAll}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Restore All
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className="flex items-center space-x-2"
              onClick={() => setSelectedCategory(category.id)}
              disabled={category.count === 0}
            >
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {deletedTemplates.size > 0 && selectedCategory === "all" 
              ? "All templates have been deleted. Use 'Restore All' to bring them back."
              : `No ${selectedCategory === "all" ? "" : selectedCategory} templates available.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getCategoryColor(template.category)} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-white text-xl font-bold">
                      {template.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">{template.name}</p>
                </div>
                {template.isDefault && (
                  <Badge className="absolute top-3 right-3 bg-green-600">
                    Default
                  </Badge>
                )}
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                  <Badge variant="secondary" className="capitalize">
                    {template.category}
                  </Badge>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {template.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {template.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center space-x-2"
                    onClick={() => {
                      window.open(`/quotation/demo-template?template=${template.id}`, '_blank')
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex items-center justify-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleDeleteClick(template)}
                    disabled={template.isDefault}
                    title={template.isDefault ? "Cannot delete default template" : "Delete template"}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </Button>
                </div>
                
                {template.isDefault && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Default template cannot be deleted
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">🎯 Event Tracking</h3>
            <p className="text-gray-600 text-sm">Real-time event coordination and status updates</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">📦 Deliverable Tracking</h3>
            <p className="text-gray-600 text-sm">Track progress of albums, prints, and digital deliveries</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">🏢 Multi-Company Support</h3>
            <p className="text-gray-600 text-sm">Different templates and branding for multiple organizations</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">🎨 Custom Template Builder</h3>
            <p className="text-gray-600 text-sm">Drag-and-drop interface to create your own templates</p>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        templateName={deleteDialog.templateName}
      />
    </div>
  )
} 