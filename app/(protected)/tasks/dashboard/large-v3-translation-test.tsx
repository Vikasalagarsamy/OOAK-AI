'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Languages, Zap, CheckCircle, AlertCircle, Loader2, Mic, Brain, FileAudio } from 'lucide-react'
import { toast } from 'sonner'

interface TranslationResult {
  success: boolean
  call_id: string
  translation_result?: {
    success: boolean
    detected_language: string
    language_confidence: number
    duration: number
    english_translation: string
    model_used: string
    task: string
  } | null
  analytics?: any
  client_name?: string
  processing_time?: number
}

export default function LargeV3TranslationTest() {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'translating' | 'completed' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // File Upload State
  const [fileData, setFileData] = useState({
    audio_file: null as File | null,
    clientName: '',
    modelSize: 'large-v3'
  })

  // Manual Translation State  
  const [manualData, setManualData] = useState({
    clientName: '',
    englishTranscript: '',
    callDuration: 300
  })

  const handleFileUpload = async () => {
    if (!fileData.audio_file || !fileData.clientName) {
      toast.error('Please provide audio file and client name')
      return
    }

    setUploadState('uploading')
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', fileData.audio_file)
      formData.append('clientName', fileData.clientName)
      formData.append('modelSize', fileData.modelSize)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 30) {
            clearInterval(progressInterval)
            return 30
          }
          return prev + 10
        })
      }, 200)

      setUploadState('translating')
      console.log('🌍 Uploading to Large-v3 translation endpoint...')

      const startTime = Date.now()
      const response = await fetch('/api/webhooks/local-calls-translation', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const responseData = await response.json()
      const processingTime = (Date.now() - startTime) / 1000

      if (!response.ok) {
        throw new Error(responseData.error || 'Translation failed')
      }

      setResult({
        success: responseData.success,
        call_id: responseData.callId || responseData.call_id,
        translation_result: responseData.data?.processing_info ? {
          success: true,
          detected_language: responseData.data.detected_language,
          language_confidence: responseData.data.language_confidence,
          duration: responseData.data.call_duration,
          english_translation: responseData.data.english_transcript,
          model_used: responseData.data.processing_info.translation_model,
          task: 'translate'
        } : null,
        analytics: responseData.data?.analytics,
        client_name: responseData.data?.client_name,
        processing_time: processingTime
      })
      setUploadState('completed')
      toast.success('🎉 Large-v3 translation completed successfully!')

    } catch (error) {
      console.error('Translation error:', error)
      setError(error instanceof Error ? error.message : 'Translation failed')
      setUploadState('error')
      toast.error('Translation failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleManualTranslation = async () => {
    if (!manualData.clientName || !manualData.englishTranscript) {
      toast.error('Please provide client name and English transcript')
      return
    }

    setUploadState('translating')
    setError(null)

    try {
      const startTime = Date.now()
      const response = await fetch('/api/webhooks/local-calls-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: manualData.clientName,
          englishTranscript: manualData.englishTranscript,
          callDuration: manualData.callDuration
        })
      })

      const responseData = await response.json()
      const processingTime = (Date.now() - startTime) / 1000

      if (!response.ok) {
        throw new Error(responseData.error || 'Processing failed')
      }

      setResult({
        ...responseData,
        processing_time: processingTime
      })
      setUploadState('completed')
      toast.success('🎉 Manual translation processing completed!')

    } catch (error) {
      console.error('Processing error:', error)
      setError(error instanceof Error ? error.message : 'Processing failed')
      setUploadState('error')
      toast.error('Processing failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const resetForm = () => {
    setUploadState('idle')
    setUploadProgress(0)
    setResult(null)
    setError(null)
    setFileData({
      audio_file: null,
      clientName: '',
      modelSize: 'large-v3'
    })
    setManualData({
      clientName: '',
      englishTranscript: '',
      callDuration: 300
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-6 w-6 text-blue-600" />
            Large-v3 Translation Test for Autonomous Photography
          </CardTitle>
          <CardDescription>
            Test Whisper Large-v3 model for multilingual client conversation processing.
            Perfect for Tamil, Telugu, Kannada, Malayalam, Hindi → English translation.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Processing Status */}
      {uploadState !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadState === 'uploading' && <Upload className="h-5 w-5 animate-bounce text-blue-600" />}
              {uploadState === 'translating' && <Languages className="h-5 w-5 animate-pulse text-green-600" />}
              {uploadState === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {uploadState === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadState === 'uploading' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
            
            {uploadState === 'translating' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 animate-pulse text-green-600" />
                  <span>Processing with Large-v3 model for maximum accuracy...</span>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">AI Processing Pipeline</span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>• 🎯 <strong>Language Detection:</strong> AI analyzing audio language</p>
                    <p>• 🌍 <strong>Large-v3 Translation:</strong> Converting to English</p>
                    <p>• 🧠 <strong>Client Memory Building:</strong> Extracting relationship context</p>
                    <p>• 📊 <strong>Analytics Generation:</strong> Business intelligence processing</p>
                  </div>
                </div>
              </div>
            )}
            
            {uploadState === 'completed' && result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Large-v3 Processing Completed!</span>
                </div>
                
                {/* Translation Results */}
                {result.translation_result && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-green-800">Language Detection</Label>
                        <div className="text-lg font-bold text-green-600">
                          {result.translation_result.detected_language} 
                          <span className="text-sm ml-2">
                            ({(result.translation_result.language_confidence * 100).toFixed(1)}% confidence)
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-blue-800">Processing Speed</Label>
                        <div className="text-lg font-bold text-blue-600">
                          {result.processing_time?.toFixed(1)}s
                          <span className="text-sm ml-2">
                            ({(result.translation_result.duration / (result.processing_time || 1)).toFixed(1)}x real-time)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">English Translation (for AI Memory)</Label>
                      <div className="text-sm bg-white p-3 rounded border max-h-32 overflow-y-auto">
                        {result.translation_result.english_translation}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-600">Model Used</div>
                        <Badge variant="secondary">{result.translation_result.model_used}</Badge>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-600">Duration</div>
                        <div className="text-lg">{result.translation_result.duration?.toFixed(1)}s</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-600">Call ID</div>
                        <div className="text-xs font-mono">{result.call_id?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Analytics Preview */}
                {result.analytics && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-purple-800 mb-2 block">
                      AI Analytics for Autonomous Photography
                    </Label>
                    <div className="text-sm space-y-1">
                      <div>• Overall Sentiment: {result.analytics.overall_sentiment?.toFixed(2)}</div>
                      <div>• Client Engagement: {result.analytics.client_engagement_level}/10</div>
                      <div>• Compliance Risk: {result.analytics.compliance_risk_level}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={resetForm} variant="outline">
                    Test Another Translation
                  </Button>
                  <Button 
                    onClick={() => window.open(`/api/call-records/${result.call_id}`, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    View Full Results
                  </Button>
                </div>
              </div>
            )}
            
            {uploadState === 'error' && error && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Large-v3 processing failed</span>
                </div>
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
                <Button onClick={resetForm} variant="outline">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Options */}
      {uploadState === 'idle' && (
        <Tabs defaultValue="file-upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file-upload" className="flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              Audio File Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Manual Translation Test
            </TabsTrigger>
          </TabsList>

          {/* File Upload Tab */}
          <TabsContent value="file-upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Test Large-v3 with Audio File
                </CardTitle>
                <CardDescription>
                  Upload multilingual audio for Large-v3 translation. Perfect for Tamil, Telugu, Kannada, Malayalam clients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="audio-file">Audio File *</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept=".wav,.mp3,.m4a,.flac,.aac"
                    onChange={(e) => setFileData(prev => ({ ...prev, audio_file: e.target.files?.[0] || null }))}
                    className="mt-1"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Supported: WAV, MP3, M4A, FLAC, AAC • Test with Tamil/Telugu/Kannada/Malayalam
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client-name">Client Name *</Label>
                    <Input
                      id="client-name"
                      value={fileData.clientName}
                      onChange={(e) => setFileData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="e.g., Tamil Photography Client"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model-size">Whisper Model</Label>
                    <select
                      id="model-size"
                      value={fileData.modelSize}
                      onChange={(e) => setFileData(prev => ({ ...prev, modelSize: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="large-v3">Large-v3 (Highest Quality)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="base">Base (Fastest)</option>
                    </select>
                  </div>
                </div>

                <Button 
                  onClick={handleFileUpload} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!fileData.audio_file || !fileData.clientName}
                >
                  <Languages className="h-4 w-4 mr-2" />
                  Test Large-v3 Translation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Translation Tab */}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Test Analytics with English Text
                </CardTitle>
                <CardDescription>
                  Skip translation and test analytics directly with English transcript.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-client">Client Name *</Label>
                    <Input
                      id="manual-client"
                      value={manualData.clientName}
                      onChange={(e) => setManualData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="e.g., Photography Client"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-duration">Call Duration (seconds)</Label>
                    <Input
                      id="manual-duration"
                      type="number"
                      value={manualData.callDuration}
                      onChange={(e) => setManualData(prev => ({ ...prev, callDuration: parseInt(e.target.value) }))}
                      placeholder="300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="manual-transcript">English Transcript *</Label>
                  <Textarea
                    id="manual-transcript"
                    value={manualData.englishTranscript}
                    onChange={(e) => setManualData(prev => ({ ...prev, englishTranscript: e.target.value }))}
                    placeholder="Hello, I'm interested in wedding photography for next month. We're looking for a package that includes engagement shoot and wedding day coverage..."
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Use this to test AI analytics without translation
                  </div>
                </div>

                <Button 
                  onClick={handleManualTranslation} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!manualData.clientName || !manualData.englishTranscript}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Test Analytics Processing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 