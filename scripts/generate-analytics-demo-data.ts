/**
 * Demo Data Generator for Quotation Analytics
 * 
 * This script creates realistic sample data to showcase the analytics dashboard
 * Run: npx tsx scripts/generate-analytics-demo-data.ts
 */

import { createClient } from '@supabase/supabase-js'

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseKey)

interface SampleLead {
  lead_number: string
  client_name: string
  bride_name: string
  groom_name: string
  mobile: string
  email: string
  lead_source: string
  status: string
  created_at: string
}

interface SampleQuotation {
  lead_id: number
  quotation_number: string
  slug: string
  client_name: string
  bride_name: string
  groom_name: string
  mobile: string
  email: string
  default_package: string
  total_amount: number
  status: string
  created_by: string
  created_at: string
  quotation_data: any
  events_count: number
}

// Sample lead sources for analytics
const leadSources = [
  'Instagram',
  'Facebook',
  'Google Ads',
  'Referral',
  'Website',
  'WhatsApp',
  'Email',
  'Cold Call',
  'Exhibition',
  'Word of Mouth'
]

// Sample client names (realistic Indian names)
const clientNames = [
  'Rajesh Sharma',
  'Priya Patel',
  'Arjun Singh',
  'Sneha Gupta',
  'Vikram Reddy',
  'Kavya Nair',
  'Rohit Kumar',
  'Aisha Khan',
  'Sanjay Joshi',
  'Meera Agarwal',
  'Rahul Verma',
  'Pooja Mehta',
  'Karan Kapoor',
  'Ritu Saxena',
  'Amit Sharma'
]

const brideNames = [
  'Priya', 'Sneha', 'Kavya', 'Aisha', 'Meera', 'Pooja', 'Ritu', 'Ananya', 'Divya', 'Shreya'
]

const groomNames = [
  'Rajesh', 'Arjun', 'Vikram', 'Rohit', 'Sanjay', 'Rahul', 'Karan', 'Amit', 'Dev', 'Nikhil'
]

const packages = ['basic', 'premium', 'elite', 'custom']
const quotationStatuses = ['draft', 'sent', 'approved', 'rejected', 'expired']

// Generate random date within last 12 months
function randomDateInPast(months: number): string {
  const now = new Date()
  const past = new Date(now.getTime() - (months * 30 * 24 * 60 * 60 * 1000))
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime())
  return new Date(randomTime).toISOString()
}

// Generate realistic quotation amount based on package
function generateQuotationAmount(packageType: string): number {
  const baseAmounts = {
    basic: { min: 50000, max: 150000 },
    premium: { min: 150000, max: 300000 },
    elite: { min: 300000, max: 600000 },
    custom: { min: 100000, max: 800000 }
  }
  
  const range = baseAmounts[packageType as keyof typeof baseAmounts] || baseAmounts.basic
  return Math.floor(Math.random() * (range.max - range.min) + range.min)
}

// Generate realistic quotation data
function generateQuotationData(packageType: string, clientName: string): any {
  return {
    client_name: clientName,
    bride_name: brideNames[Math.floor(Math.random() * brideNames.length)],
    groom_name: groomNames[Math.floor(Math.random() * groomNames.length)],
    mobile: '+91 9' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
    mobile_country_code: '+91',
    email: clientName.toLowerCase().replace(' ', '.') + '@example.com',
    events: [
      {
        id: '1',
        event_name: 'Wedding Reception',
        event_date: randomDateInPast(2),
        event_location: 'Mumbai',
        venue_name: 'Grand Ballroom Hotel',
        start_time: '18:00',
        end_time: '23:00',
        expected_crowd: '200-300',
        selected_package: packageType,
        selected_services: [
          { id: 1, quantity: 1 },
          { id: 2, quantity: 2 },
          { id: 3, quantity: 1 }
        ],
        selected_deliverables: [
          { id: 1, quantity: 1 },
          { id: 2, quantity: 1 }
        ],
        service_overrides: {},
        package_overrides: {}
      }
    ],
    default_package: packageType,
    selected_services: [
      { id: 1, quantity: 1 },
      { id: 2, quantity: 2 }
    ],
    selected_deliverables: [
      { id: 1, quantity: 1 }
    ],
    service_overrides: {},
    package_overrides: {},
    custom_services: []
  }
}

async function generateSampleData() {
  console.log('🚀 Starting demo data generation for Analytics Dashboard...')

  try {
    // Step 1: Generate sample leads
    console.log('📊 Generating sample leads...')
    const sampleLeads: SampleLead[] = []
    
    for (let i = 0; i < 50; i++) {
      const clientName = clientNames[Math.floor(Math.random() * clientNames.length)]
      const leadSource = leadSources[Math.floor(Math.random() * leadSources.length)]
      const createdAt = randomDateInPast(12)
      
      sampleLeads.push({
        lead_number: `LEAD-2024-${(i + 1).toString().padStart(4, '0')}`,
        client_name: clientName,
        bride_name: brideNames[Math.floor(Math.random() * brideNames.length)],
        groom_name: groomNames[Math.floor(Math.random() * groomNames.length)],
        mobile: '+91 9' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
        email: clientName.toLowerCase().replace(' ', '.') + '@example.com',
        lead_source: leadSource,
        status: Math.random() > 0.3 ? 'CONTACTED' : Math.random() > 0.5 ? 'QUALIFIED' : 'NEW',
        created_at: createdAt
      })
    }

    // Insert leads
    const { data: insertedLeads, error: leadsError } = await supabase
      .from('leads')
      .insert(sampleLeads)
      .select()

    if (leadsError) {
      console.error('❌ Error inserting leads:', leadsError)
      return
    }

    console.log(`✅ Generated ${insertedLeads.length} sample leads`)

    // Step 2: Generate quotations for some leads (realistic conversion rate ~30%)
    console.log('📋 Generating sample quotations...')
    const sampleQuotations: SampleQuotation[] = []
    
    // Take about 30% of leads for quotations
    const leadsForQuotations = insertedLeads.slice(0, Math.floor(insertedLeads.length * 0.3))
    
    for (let i = 0; i < leadsForQuotations.length; i++) {
      const lead = leadsForQuotations[i]
      const packageType = packages[Math.floor(Math.random() * packages.length)]
      const amount = generateQuotationAmount(packageType)
      const createdAt = new Date(new Date(lead.created_at).getTime() + (1 + Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString()
      
      // Realistic status distribution
      let status = 'draft'
      const rand = Math.random()
      if (rand > 0.8) status = 'approved'
      else if (rand > 0.6) status = 'sent'
      else if (rand > 0.4) status = 'rejected'
      else if (rand > 0.2) status = 'expired'
      
      sampleQuotations.push({
        lead_id: lead.id,
        quotation_number: `QT-2024-${(i + 1).toString().padStart(4, '0')}`,
        slug: `qt-2024-${(i + 1).toString().padStart(4, '0')}-${Math.random().toString(36).substring(7)}`,
        client_name: lead.client_name,
        bride_name: lead.bride_name,
        groom_name: lead.groom_name,
        mobile: lead.mobile,
        email: lead.email,
        default_package: packageType,
        total_amount: amount,
        status: status,
        created_by: '00000000-0000-0000-0000-000000000000', // Mock user ID
        created_at: createdAt,
        quotation_data: generateQuotationData(packageType, lead.client_name),
        events_count: 1
      })
    }

    // Insert quotations
    const { data: insertedQuotations, error: quotationsError } = await supabase
      .from('quotations')
      .insert(sampleQuotations)
      .select()

    if (quotationsError) {
      console.error('❌ Error inserting quotations:', quotationsError)
      return
    }

    console.log(`✅ Generated ${insertedQuotations.length} sample quotations`)

    // Summary
    console.log('\n🎉 Demo data generation completed!')
    console.log('📈 Analytics Dashboard Data Summary:')
    console.log(`   • Total Leads: ${insertedLeads.length}`)
    console.log(`   • Total Quotations: ${insertedQuotations.length}`)
    console.log(`   • Conversion Rate: ${Math.round((insertedQuotations.length / insertedLeads.length) * 100)}%`)
    
    const approvedCount = sampleQuotations.filter(q => q.status === 'approved').length
    const totalRevenue = sampleQuotations.filter(q => q.status === 'approved').reduce((sum, q) => sum + q.total_amount, 0)
    
    console.log(`   • Approved Quotations: ${approvedCount}`)
    console.log(`   • Total Revenue: ₹${totalRevenue.toLocaleString()}`)
    console.log(`   • Average Deal Size: ₹${approvedCount > 0 ? Math.round(totalRevenue / approvedCount).toLocaleString() : 0}`)
    
    console.log('\n🎯 You can now view the analytics dashboard at: /sales/quotations/analytics')
    console.log('💡 This data will provide meaningful insights into:')
    console.log('   • Conversion funnel performance')
    console.log('   • Revenue trends by lead source')
    console.log('   • Package preferences')
    console.log('   • Sales velocity metrics')
    console.log('   • Business intelligence insights')

  } catch (error) {
    console.error('❌ Error generating demo data:', error)
  }
}

// Run the generator
if (require.main === module) {
  generateSampleData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Fatal error:', error)
      process.exit(1)
    })
}

export { generateSampleData } 