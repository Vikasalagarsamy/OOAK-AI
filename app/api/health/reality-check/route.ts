import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 REALITY CHECK: Testing what is ACTUALLY working...')
    
    const results: Record<string, boolean> = {}
    const details: Record<string, any> = {}
    
    // 1. Website - Can we reach localhost:3000?
    try {
      const response = await fetch('http://localhost:3000', { 
        signal: AbortSignal.timeout(3000) 
      })
      results.website = response.ok
      details.website = { status: response.status, ok: response.ok }
      console.log(`🌐 Website: ${response.ok ? '✅ WORKING' : '❌ FAILED'} (${response.status})`)
    } catch (error) {
      results.website = false
      details.website = { error: error instanceof Error ? error.message : 'Failed' }
      console.log(`🌐 Website: ❌ FAILED (${error instanceof Error ? error.message : 'Unknown error'})`)
    }

    // 2. Public API - Can we reach the tunnel?
    try {
      const response = await fetch('https://api.ooak.photography', { 
        signal: AbortSignal.timeout(5000) 
      })
      results.publicUrl = response.ok
      results.tunnel = response.ok
      details.publicUrl = { status: response.status, ok: response.ok }
      console.log(`🌍 Public API: ${response.ok ? '✅ WORKING' : '❌ FAILED'} (${response.status})`)
    } catch (error) {
      results.publicUrl = false
      results.tunnel = false
      details.publicUrl = { error: error instanceof Error ? error.message : 'Failed' }
      console.log(`🌍 Public API: ❌ FAILED (${error instanceof Error ? error.message : 'Unknown error'})`)
    }

    // 3. Ollama AI Brain - Is it REALLY responding?
    try {
      const response = await fetch('http://localhost:11434/api/tags', { 
        signal: AbortSignal.timeout(3000) 
      })
      results.aiBrain = response.ok
      details.aiBrain = { 
        status: response.status, 
        ok: response.ok,
        endpoint: 'http://localhost:11434/api/tags'
      }
      console.log(`🧠 AI Brain (Ollama): ${response.ok ? '✅ WORKING' : '❌ FAILED'} (${response.status})`)
    } catch (error) {
      results.aiBrain = false
      details.aiBrain = { error: error instanceof Error ? error.message : 'Failed' }
      console.log(`🧠 AI Brain (Ollama): ❌ FAILED (${error instanceof Error ? error.message : 'Connection refused'})`)
      console.log(`💡 SOLUTION: Run 'ollama serve' in terminal to start AI`)
    }

    // 4. WhatsApp - Can we reach the webhook?
    try {
      const response = await fetch('https://api.ooak.photography/api/webhooks/whatsapp', { 
        signal: AbortSignal.timeout(5000) 
      })
      results.whatsapp = response.status >= 200 && response.status < 500
      details.whatsapp = { status: response.status }
      console.log(`📱 WhatsApp: ${results.whatsapp ? '✅ WORKING' : '❌ FAILED'} (${response.status})`)
    } catch (error) {
      results.whatsapp = false
      details.whatsapp = { error: error instanceof Error ? error.message : 'Failed' }
      console.log(`📱 WhatsApp: ❌ FAILED (${error instanceof Error ? error.message : 'Unknown error'})`)
    }

    // 5. Call Analytics - Can we reach the endpoint?
    try {
      const response = await fetch('https://api.ooak.photography/api/webhooks/local-calls', { 
        signal: AbortSignal.timeout(5000) 
      })
      results.callAnalytics = response.status >= 200 && response.status < 500
      details.callAnalytics = { status: response.status }
      console.log(`📞 Call Analytics: ${results.callAnalytics ? '✅ WORKING' : '❌ FAILED'} (${response.status})`)
    } catch (error) {
      results.callAnalytics = false
      details.callAnalytics = { error: error instanceof Error ? error.message : 'Failed' }
      console.log(`📞 Call Analytics: ❌ FAILED (${error instanceof Error ? error.message : 'Unknown error'})`)
    }

    // 6. Voice AI (Whisper) - Assume working if website is up
    results.whisper = results.website
    details.whisper = { assumption: 'Working if website is up', websiteWorking: results.website }
    console.log(`🎵 Voice AI (Whisper): ${results.whisper ? '✅ READY' : '❌ NOT READY'} (depends on website)`)

    // 7. Database - Assume working if website is up (internal service)
    results.database = results.website
    details.database = { assumption: 'Working if website is up', websiteWorking: results.website }
    console.log(`💾 Database: ${results.database ? '✅ WORKING' : '❌ FAILED'} (depends on website)`)

    // Calculate business status
    const activeServices = Object.values(results).filter(Boolean).length
    const totalServices = Object.keys(results).length
    const criticalServices = ['website', 'aiBrain']
    const businessRunning = criticalServices.every(service => results[service])

    console.log(`📊 REALITY: ${activeServices}/${totalServices} services working`)
    console.log(`🏢 BUSINESS: ${businessRunning ? '✅ LIVE' : '❌ OFFLINE'}`)
    
    // Provide helpful hints
    const hints = []
    if (!results.aiBrain) {
      hints.push('🔧 Start Ollama: Run "ollama serve" in terminal')
    }
    if (!results.website) {
      hints.push('🔧 Start Website: Run "npm run dev" in terminal')
    }
    if (!results.publicUrl) {
      hints.push('🔧 Start Tunnel: Check cloudflared tunnel is running')
    }

    return NextResponse.json({
      success: true,
      systemStatus: results,
      details,
      businessMetrics: {
        activeServices,
        totalServices,
        businessRunning
      },
      hints,
      timestamp: new Date().toISOString(),
      lastCheck: new Date().toLocaleTimeString()
    })

  } catch (error) {
    console.error('❌ Reality check failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Reality check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 