const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addSampleDeliverables() {
  try {
    console.log('Adding sample deliverables...')

    // Check current deliverables count
    const { count } = await supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true })

    console.log('Current deliverables count:', count)

    // Sample deliverables data
    const sampleDeliverables = [
      {
        deliverable_cat: 'Main',
        deliverable_type: 'Photo',
        deliverable_name: 'Conventional Album 250X40',
        process_name: 'MAGAZINE DESIGN',
        has_customer: false,
        has_employee: true,
        has_qc: true,
        has_vendor: false,
        sort_order: 1,
        timing_type: 'days',
        tat: 3,
        status: 1,
        package_included: {
          basic: true,
          premium: true,
          elite: true
        }
      },
      {
        deliverable_cat: 'Main',
        deliverable_type: 'Photo',
        deliverable_name: 'Conventional Album 250X40',
        process_name: 'ALBUM LAYOUT DESIGN',
        has_customer: false,
        has_employee: true,
        has_qc: true,
        has_vendor: false,
        sort_order: 1,
        timing_type: 'days',
        tat: 2,
        status: 1,
        package_included: {
          basic: true,
          premium: true,
          elite: true
        }
      },
      {
        deliverable_cat: 'Main',
        deliverable_type: 'Photo',
        deliverable_name: 'Premium Album 300X40',
        process_name: 'ALBUM LAYOUT',
        has_customer: false,
        has_employee: true,
        has_qc: true,
        has_vendor: false,
        sort_order: 2,
        timing_type: 'days',
        tat: 2,
        status: 1,
        package_included: {
          basic: false,
          premium: true,
          elite: true
        }
      },
      {
        deliverable_cat: 'Main',
        deliverable_type: 'Photo',
        deliverable_name: 'Premium Album 300X40',
        process_name: 'PREMIUM DESIGN PROCESS',
        has_customer: false,
        has_employee: true,
        has_qc: true,
        has_vendor: false,
        sort_order: 2,
        timing_type: 'days',
        tat: 3,
        status: 1,
        package_included: {
          basic: false,
          premium: true,
          elite: true
        }
      },
      {
        deliverable_cat: 'Main',
        deliverable_type: 'Video',
        deliverable_name: 'Highlight Video',
        process_name: 'VIDEO EDITING',
        has_customer: false,
        has_employee: true,
        has_qc: true,
        has_vendor: false,
        sort_order: 3,
        timing_type: 'days',
        tat: 5,
        status: 1,
        package_included: {
          basic: true,
          premium: true,
          elite: true
        }
      },
      {
        deliverable_cat: 'Main',
        deliverable_type: 'Video',
        deliverable_name: 'Highlight Video',
        process_name: 'COLOR GRADING',
        has_customer: false,
        has_employee: true,
        has_qc: true,
        has_vendor: false,
        sort_order: 3,
        timing_type: 'days',
        tat: 2,
        status: 1,
        package_included: {
          basic: true,
          premium: true,
          elite: true
        }
      },
      {
        deliverable_cat: 'Main',
        deliverable_type: 'Video',
        deliverable_name: 'Cinematic Video',
        process_name: 'CINEMATIC EDITING',
        has_customer: false,
        has_employee: true,
        has_qc: true,
        has_vendor: false,
        sort_order: 4,
        timing_type: 'days',
        tat: 7,
        status: 1,
        package_included: {
          basic: false,
          premium: true,
          elite: true
        }
      },
      {
        deliverable_cat: 'Optional',
        deliverable_type: 'Photo',
        deliverable_name: 'Photo Frame Design',
        process_name: 'FRAME DESIGN',
        has_customer: false,
        has_employee: true,
        has_qc: false,
        has_vendor: false,
        sort_order: 5,
        timing_type: 'days',
        tat: 1,
        status: 1,
        package_included: {
          basic: false,
          premium: false,
          elite: true
        }
      },
      {
        deliverable_cat: 'Optional',
        deliverable_type: 'Video',
        deliverable_name: 'Social Media Reel',
        process_name: 'REEL CREATION',
        has_customer: false,
        has_employee: true,
        has_qc: false,
        has_vendor: false,
        sort_order: 6,
        timing_type: 'hours',
        tat: 24,
        status: 1,
        package_included: {
          basic: false,
          premium: true,
          elite: true
        }
      },
      {
        deliverable_cat: 'Optional',
        deliverable_type: 'Video',
        deliverable_name: 'Social Media Reel',
        process_name: 'QUICK EDIT',
        has_customer: false,
        has_employee: true,
        has_qc: false,
        has_vendor: false,
        sort_order: 6,
        timing_type: 'hours',
        tat: 12,
        status: 1,
        package_included: {
          basic: false,
          premium: true,
          elite: true
        }
      }
    ]

    // Add deliverables if table is empty or has very few records
    if (!count || count < 3) {
      const { data, error } = await supabase
        .from('deliverables')
        .insert(sampleDeliverables)
        .select()

      if (error) {
        console.error('Error adding sample deliverables:', error)
        return
      }

      console.log('Added sample deliverables:', data?.length || 0)
    } else {
      console.log('Deliverables table already has data, skipping sample data insertion')
    }

    // Test the deliverable filtering queries
    console.log('\nTesting deliverable filtering queries...')
    
    // Test query 1: Get Main + Photo deliverables
    const { data: test1, error: error1 } = await supabase
      .from('deliverables')
      .select('id, deliverable_name, deliverable_cat, deliverable_type')
      .eq('deliverable_cat', 'Main')
      .eq('deliverable_type', 'Photo')
      .eq('status', 1)

    if (!error1) {
      console.log('Main + Photo deliverables:', test1?.length || 0, 'found')
      test1?.forEach(d => console.log(`  - ${d.deliverable_name}`))
    } else {
      console.log('Query 1 failed:', error1.message)
    }

    // Test query 2: Get Main + Video deliverables
    const { data: test2, error: error2 } = await supabase
      .from('deliverables')
      .select('id, deliverable_name, deliverable_cat, deliverable_type')
      .eq('deliverable_cat', 'Main')
      .eq('deliverable_type', 'Video')
      .eq('status', 1)

    if (!error2) {
      console.log('Main + Video deliverables:', test2?.length || 0, 'found')
      test2?.forEach(d => console.log(`  - ${d.deliverable_name}`))
    } else {
      console.log('Query 2 failed:', error2.message)
    }

    // Test query 3: Get Optional + Photo deliverables
    const { data: test3, error: error3 } = await supabase
      .from('deliverables')
      .select('id, deliverable_name, deliverable_cat, deliverable_type')
      .eq('deliverable_cat', 'Optional')
      .eq('deliverable_type', 'Photo')
      .eq('status', 1)

    if (!error3) {
      console.log('Optional + Photo deliverables:', test3?.length || 0, 'found')
      test3?.forEach(d => console.log(`  - ${d.deliverable_name}`))
    } else {
      console.log('Query 3 failed:', error3.message)
    }

    console.log('\nDeliverable setup complete!')

  } catch (error) {
    console.error('Error in addSampleDeliverables:', error)
  }
}

addSampleDeliverables() 