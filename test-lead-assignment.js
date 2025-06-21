// Test Lead Assignment Task Generation
// This script tests if the lead-to-task automation is working properly

const testLeadAssignment = async () => {
  try {
    console.log('🧪 Testing lead assignment task generation...')
    
    const testData = {
      leadId: 57,  // Using the actual lead ID from your screenshot (L0057)
      leadData: {
        id: 57,
        lead_number: 'L0057',
        client_name: 'Ramya Krishnan',
        status: 'ASSIGNED',
        estimated_value: 50000,
        assigned_to: 1,
        company_id: 1,
        branch_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      triggeredBy: 'Test Assignment'
    }

    const response = await fetch('http://localhost:3001/api/test-lead-assignment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    console.log('✅ Test Result:', JSON.stringify(result, null, 2))
    
    if (result.success && result.tasksGenerated > 0) {
      console.log(`🎯 SUCCESS: Generated ${result.tasksGenerated} task(s) for ${testData.leadData.client_name}`)
    } else {
      console.log(`⚠️ No tasks generated: ${result.message}`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testLeadAssignment() 