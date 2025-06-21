// Template registry for quotation pages
import { SavedQuotation } from "@/lib/client-safe-actions"
import React from "react"

export interface QuotationTemplateProps {
  quotation: SavedQuotation
  showEventTracking?: boolean
  showDeliverableTracking?: boolean
  companySettings?: {
    brandColor?: string
    logoUrl?: string
    companyName?: string
    contactInfo?: {
      email?: string
      phone?: string
      address?: string
      website?: string
    }
  }
}

export interface QuotationTemplate {
  id: string
  name: string
  description: string
  preview: string // URL to preview image
  features: string[]
  component: React.ComponentType<QuotationTemplateProps>
  category: 'modern' | 'classic' | 'minimal' | 'luxury' | 'creative'
  isDefault?: boolean
}

// Template imports - these will be dynamically imported to avoid circular dependencies
const OriginalTemplate = React.lazy(() => import('./original-template'))
const ModernGradientTemplate = React.lazy(() => import('./modern-gradient-template'))
const MinimalCleanTemplate = React.lazy(() => import('./minimal-clean-template'))
const LuxuryElegantTemplate = React.lazy(() => import('./luxury-elegant-template'))
const CreativeColorfulTemplate = React.lazy(() => import('./creative-colorful-template'))
const ClassicProfessionalTemplate = React.lazy(() => import('./classic-professional-template'))
const InternationalModernTemplate = React.lazy(() => import('./international-modern-template'))
const ModernEleganceTemplate = React.lazy(() => import('./modern-elegance-template'))
const EditorialChicTemplate = React.lazy(() => import('./editorial-chic-template'))

export const QUOTATION_TEMPLATES: QuotationTemplate[] = [
  {
    id: 'international-modern',
    name: 'International Modern',
    description: 'Sleek, international-standard design with sophisticated typography and clean layout',
    preview: '/templates/international-modern-preview.jpg',
    features: ['International Standards', 'Clean Typography', 'Professional Layout', 'Sophisticated Design'],
    component: InternationalModernTemplate,
    category: 'modern',
    isDefault: true
  },
  {
    id: 'modern-elegance',
    name: 'Modern Elegance',
    description: 'Sophisticated design with curvy fonts, black and red accents, and romantic aesthetics',
    preview: '/templates/modern-elegance-preview.jpg',
    features: ['Script Typography', 'Black & Red Palette', 'Romantic Design', 'Elegant Layout'],
    component: ModernEleganceTemplate,
    category: 'luxury',
    isDefault: false
  },
  {
    id: 'editorial-chic',
    name: 'Editorial Chic',
    description: 'Magazine-style template with bold typography, editorial layout, and striking visuals',
    preview: '/templates/editorial-chic-preview.jpg',
    features: ['Editorial Layout', 'Bold Typography', 'Magazine Style', 'High Impact Design'],
    component: EditorialChicTemplate,
    category: 'modern',
    isDefault: false
  },
  {
    id: 'original',
    name: 'Original Template',
    description: 'The original quotation template with clean design and professional layout',
    preview: '/templates/original-preview.jpg',
    features: ['Responsive Design', 'Professional Layout', 'Print Friendly'],
    component: OriginalTemplate,
    category: 'classic',
    isDefault: false
  },
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    description: 'Modern design with beautiful gradients and card-based layout',
    preview: '/templates/modern-gradient-preview.jpg',
    features: ['Gradient Backgrounds', 'Card Layout', 'Modern Typography', 'Mobile Optimized'],
    component: ModernGradientTemplate,
    category: 'modern'
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Ultra-clean minimal design focusing on content and readability',
    preview: '/templates/minimal-clean-preview.jpg',
    features: ['Minimal Design', 'Typography Focus', 'Clean Layout', 'Fast Loading'],
    component: MinimalCleanTemplate,
    category: 'minimal'
  },
  {
    id: 'luxury-elegant',
    name: 'Luxury Elegant',
    description: 'Sophisticated design for high-end wedding photography services',
    preview: '/templates/luxury-elegant-preview.jpg',
    features: ['Elegant Typography', 'Premium Feel', 'Sophisticated Colors', 'Luxury Branding'],
    component: LuxuryElegantTemplate,
    category: 'luxury'
  },
  {
    id: 'creative-colorful',
    name: 'Creative Colorful',
    description: 'Vibrant and creative design with playful elements',
    preview: '/templates/creative-colorful-preview.jpg',
    features: ['Vibrant Colors', 'Creative Layout', 'Playful Elements', 'Artistic Design'],
    component: CreativeColorfulTemplate,
    category: 'creative'
  },
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    description: 'Traditional business-style template with formal presentation',
    preview: '/templates/classic-professional-preview.jpg',
    features: ['Business Style', 'Formal Layout', 'Corporate Design', 'Traditional Feel'],
    component: ClassicProfessionalTemplate,
    category: 'classic'
  }
]

export function getTemplate(templateId: string): QuotationTemplate | undefined {
  return QUOTATION_TEMPLATES.find(template => template.id === templateId)
}

export function getDefaultTemplate(): QuotationTemplate {
  return QUOTATION_TEMPLATES.find(template => template.isDefault) || QUOTATION_TEMPLATES[0]
}

export function getTemplatesByCategory(category: QuotationTemplate['category']): QuotationTemplate[] {
  return QUOTATION_TEMPLATES.filter(template => template.category === category)
}

// Template renderer component
interface TemplateRendererProps {
  templateId?: string
  quotation: SavedQuotation
  showEventTracking?: boolean
  showDeliverableTracking?: boolean
  companySettings?: QuotationTemplateProps['companySettings']
}

export function TemplateRenderer({ 
  templateId, 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: TemplateRendererProps) {
  const template = templateId ? getTemplate(templateId) : getDefaultTemplate()
  
  if (!template) {
    return <div className="p-8 text-center text-red-600">Template not found</div>
  }

  const TemplateComponent = template.component

  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading template...</p>
        </div>
      </div>
    }>
      <TemplateComponent
        quotation={quotation}
        showEventTracking={showEventTracking}
        showDeliverableTracking={showDeliverableTracking}
        companySettings={companySettings}
      />
    </React.Suspense>
  )
} 