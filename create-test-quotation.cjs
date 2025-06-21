const fetch = require('node-fetch');

async function createTestQuotation() {
  console.log('🔧 CREATING TEST QUOTATION VIA LOCAL API');
  console.log('='.repeat(50));
  
  try {
    // Test quotation data
    const quotationData = {
      client_name: 'Jothi Alagarsamy',
      bride_name: 'Jothi',
      groom_name: 'Alagarsamy',
      mobile: '+919677362525',
      mobile_country_code: '+91',
      whatsapp: '+919677362525',
      whatsapp_country_code: '+91',
      alternate_mobile: '',
      alternate_mobile_country_code: '+91',
      alternate_whatsapp: '',
      alternate_whatsapp_country_code: '+91',
      email: 'jothi.alagarsamy@example.com',
      events: [
        {
          id: 'event-1',
          event_name: 'Wedding Ceremony',
          event_date: '2024-12-15',
          event_location: 'Chennai',
          venue_name: 'Grand Palace',
          start_time: '10:00',
          end_time: '18:00',
          expected_crowd: '200-300',
          selected_package: 'premium',
          selected_services: [
            { id: 1, quantity: 1 },
            { id: 2, quantity: 2 }
          ],
          selected_deliverables: [
            { id: 1, quantity: 1 },
            { id: 2, quantity: 1 }
          ],
          service_overrides: {},
          package_overrides: {}
        }
      ],
      default_package: 'premium',
      selected_services: [
        { id: 1, quantity: 1 },
        { id: 2, quantity: 2 }
      ],
      selected_deliverables: [
        { id: 1, quantity: 1 },
        { id: 2, quantity: 1 }
      ],
      service_overrides: {},
      package_overrides: {},
      custom_services: []
    };

    console.log('\n1️⃣ Creating quotation via API...');
    
    // Create quotation using the app's API
    const response = await fetch('http://localhost:3000/api/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotationData)
    });

    const responseText = await response.text();
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Quotation created successfully!');
      console.log('Response:', result);
    } else {
      console.log('❌ Failed to create quotation');
      console.log('Status:', response.status);
      console.log('Response:', responseText);
    }

    // Check debug API to see current state
    console.log('\n2️⃣ Checking current state...');
    const debugResponse = await fetch('http://localhost:3000/api/debug-team-performance');
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Debug data:', JSON.stringify(debugData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestQuotation(); 