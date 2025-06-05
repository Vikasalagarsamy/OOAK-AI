"use client"

import { useState } from 'react'

export function TestRealtimeButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isBusinessTesting, setIsBusinessTesting] = useState(false)

  const handleRealtimeTest = async () => {
    console.log('⚡ Testing REAL-TIME notifications...')
    setIsLoading(true)
    
    try {
      console.log('📡 Calling real-time test endpoint...')
      const response = await fetch('/api/test/trigger-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('📡 Response:', response.status, response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Real-time test SUCCESS:', result)
        
        // Trigger immediate refresh of notifications
        console.log('🔄 Triggering notification refresh...')
        window.dispatchEvent(new Event('notificationTest'))
        
        // Also store timestamp to trigger refresh
        localStorage.setItem('lastNotificationTest', Date.now().toString())
        
        alert('⚡ Real-time test triggered! Watch the notification bell - it should update within 5 seconds!')
      } else {
        const error = await response.text()
        console.error('❌ Error:', error)
        alert('❌ Test failed: ' + error)
      }
    } catch (error) {
      console.error('❌ Exception:', error)
      alert('❌ Network error: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBusinessTest = async () => {
    console.log('🏢 Testing BUSINESS notifications...')
    setIsBusinessTesting(true)
    
    try {
      const response = await fetch('/api/test/business-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Test all types
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Business notification test SUCCESS:', result)
        
        // Trigger immediate refresh of notifications
        window.dispatchEvent(new Event('notificationTest'))
        localStorage.setItem('lastNotificationTest', Date.now().toString())
        
        alert(`🏢 Business notification test completed! ${result.total_notifications} business notifications created. Check the notification bell!`)
      } else {
        const error = await response.text()
        console.error('❌ Business test error:', error)
        alert('❌ Business test failed: ' + error)
      }
    } catch (error) {
      console.error('❌ Business test exception:', error)
      alert('❌ Business test network error: ' + error)
    } finally {
      setIsBusinessTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Test Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">⚡ Real-Time System Test</h3>
        <button 
          onClick={handleRealtimeTest}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {isLoading ? 'Testing Real-Time...' : '⚡ Test Real-Time Notifications'}
        </button>
        
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f0f8ff', 
          border: '1px solid #007bff', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>🎯 Real-Time Test:</strong>
          <br />
          • Tests basic notification delivery system
          <br />
          • 🟢 <strong>If real-time works:</strong> Badge updates instantly
          <br />
          • 🔴 <strong>If real-time fails:</strong> Badge updates within 5 seconds (polling mode)
        </div>
      </div>

      {/* Business Notifications Test Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🏢 Business Integration Test</h3>
        <button 
          onClick={handleBusinessTest}
          disabled={isBusinessTesting}
          style={{
            padding: '12px 24px',
            backgroundColor: isBusinessTesting ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isBusinessTesting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {isBusinessTesting ? 'Testing Business Logic...' : '🏢 Test Business Notifications'}
        </button>
        
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f0fff0', 
          border: '1px solid #28a745', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>🎯 Business Notification Test:</strong>
          <br />
          • 📝 Quotation created/approved notifications
          <br />
          • 💰 Payment received alerts
          <br />
          • 🤖 AI-powered low success probability warnings
          <br />
          • 👤 Team performance anomaly alerts
          <br />
          • ⏰ Event deadline approaching notifications
          <br />
          <br />
          <strong>This simulates real business events!</strong>
        </div>
      </div>

      {/* Usage Instructions */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fffbf0', 
        border: '1px solid #ffa500', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <strong>📋 Instructions:</strong>
        <br />
        1. Click either test button above
        <br />
        2. Check the browser console for detailed logs
        <br />
        3. Watch the notification bell for badge updates
        <br />
        4. Click the bell to see the different notification types
        <br />
        5. Test "mark as read" functionality
        <br />
        <br />
        <strong>🎛️ Production Ready:</strong> Remove this testing section when deploying!
      </div>
    </div>
  )
} 