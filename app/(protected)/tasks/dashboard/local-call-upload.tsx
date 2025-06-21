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
import { Upload, Mic, FileText, Zap, CheckCircle, AlertCircle, Loader2, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import SimpleAnalyticsDemo from './simple-analytics-demo'
import RealTranscriptsViewer from './real-transcripts-viewer'

interface UploadResult {
  success: boolean
  call_id: string
  transcription_id: string
  processing_type: string
  transcript_preview?: string
  confidence_score?: number
  duration?: number
}

export default function LocalCallUpload() {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // File Upload State
  const [fileData, setFileData] = useState({
    audio_file: null as File | null,
    client_name: '',
    sales_agent: 'Vikas',
    phone_number: '',
    task_id: '',
    duration: ''
  })

  // Manual Transcript State
  const [manualData, setManualData] = useState({
    client_name: '',
    sales_agent: 'Vikas',
    phone_number: '',
    transcript: '',
    duration: '300'
  })

  // Pre-transcribed State
  const [preTranscribedData, setPreTranscribedData] = useState({
    client_name: '',
    sales_agent: 'Vikas',
    phone_number: '',
    transcript: '',
    duration: '300',
    confidence_score: '0.85'
  })

  // ==========================
  // FILE UPLOAD PROCESSING
  // ==========================

  const handleFileUpload = async () => {
    if (!fileData.audio_file || !fileData.client_name || !fileData.phone_number) {
      toast.error('Please provide audio file, client name, and phone number')
      return
    }

    setUploadState('uploading')
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio_file', fileData.audio_file)
      formData.append('client_name', fileData.client_name)
      formData.append('sales_agent', fileData.sales_agent)
      formData.append('phone_number', fileData.phone_number)
      
      if (fileData.task_id) formData.append('task_id', fileData.task_id)
      if (fileData.duration) formData.append('duration', fileData.duration)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      setUploadState('processing')

      const response = await fetch('/api/webhooks/local-calls-simple-upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Upload failed')
      }

      setResult(responseData.data)
      setUploadState('completed')
      toast.success('🎉 Audio file uploaded successfully!')

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
      setUploadState('error')
      toast.error('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // ==========================
  // MANUAL TRANSCRIPT PROCESSING
  // ==========================

  const handleManualTranscript = async () => {
    if (!manualData.client_name || !manualData.phone_number || !manualData.transcript) {
      toast.error('Please provide client name, phone number, and transcript')
      return
    }

    setUploadState('processing')
    setError(null)

    try {
      const response = await fetch('/api/webhooks/local-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'manual_transcript',
          ...manualData,
          duration: parseFloat(manualData.duration)
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Processing failed')
      }

      setResult(responseData.data)
      setUploadState('completed')
      toast.success('🎉 Manual transcript processed successfully!')

    } catch (error) {
      console.error('Processing error:', error)
      setError(error instanceof Error ? error.message : 'Processing failed')
      setUploadState('error')
      toast.error('Processing failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // ==========================
  // PRE-TRANSCRIBED PROCESSING
  // ==========================

  const handlePreTranscribed = async () => {
    if (!preTranscribedData.client_name || !preTranscribedData.phone_number || !preTranscribedData.transcript) {
      toast.error('Please provide client name, phone number, and transcript')
      return
    }

    setUploadState('processing')
    setError(null)

    try {
      const response = await fetch('/api/webhooks/local-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pre_transcribed',
          ...preTranscribedData,
          duration: parseFloat(preTranscribedData.duration),
          confidence_score: parseFloat(preTranscribedData.confidence_score)
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Processing failed')
      }

      setResult(responseData.data)
      setUploadState('completed')
      toast.success('🎉 Pre-transcribed call processed successfully!')

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
      client_name: '',
      sales_agent: 'Vikas',
      phone_number: '',
      task_id: '',
      duration: ''
    })
    setManualData({
      client_name: '',
      sales_agent: 'Vikas',
      phone_number: '',
      transcript: '',
      duration: '300'
    })
    setPreTranscribedData({
      client_name: '',
      sales_agent: 'Vikas',
      phone_number: '',
      transcript: '',
      duration: '300',
      confidence_score: '0.85'
    })
  }

  return (
    <div className="space-y-6">


      {/* Processing Status */}
      {uploadState !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadState === 'uploading' && <Upload className="h-5 w-5 animate-bounce" />}
              {uploadState === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
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
            
            {uploadState === 'processing' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating database entry and preparing for transcription...</span>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Manual Transcription Required</span>
                  </div>
                  <div className="text-sm text-yellow-700 space-y-2">
                    <p>• ✅ <strong>File uploaded successfully</strong> (saved to local storage)</p>
                    <p>• ✅ <strong>Database entry created</strong> (ready for processing)</p>
                    <p>• ⏳ <strong>Transcription pending</strong> (requires manual trigger)</p>
                    <p>• ⏳ <strong>AI Analytics pending</strong> (runs after transcription)</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-2">📋 Next Steps:</p>
                    <p>1. <strong>Check "View Transcripts" tab</strong> to see your uploaded file</p>
                    <p>2. <strong>Processing time:</strong> ~40 seconds total (30s transcription + 10s analytics)</p>
                    <p>3. <strong>File will appear with placeholder text initially</strong></p>
                    <p>4. <strong>Real transcript will show after manual processing</strong></p>
                  </div>
                </div>
              </div>
            )}
            
            {uploadState === 'completed' && result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Processing completed successfully!</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Call ID</Label>
                    <div className="font-mono text-xs bg-gray-100 p-2 rounded">{result.call_id}</div>
                  </div>
                  <div>
                    <Label>Transcription ID</Label>
                    <div className="font-mono text-xs bg-gray-100 p-2 rounded">{result.transcription_id}</div>
                  </div>
                  <div>
                    <Label>Processing Type</Label>
                    <Badge variant="outline">{result.processing_type}</Badge>
                  </div>
                  <div>
                    <Label>Confidence Score</Label>
                    <div>{result.confidence_score ? `${(result.confidence_score * 100).toFixed(1)}%` : 'N/A'}</div>
                  </div>
                </div>
                
                {result.transcript_preview && (
                  <div>
                    <Label>Transcript Preview</Label>
                    <div className="text-sm bg-gray-50 p-3 rounded-md mt-1">
                      {result.transcript_preview}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={resetForm} variant="outline">
                    Process Another Call
                  </Button>
                  <Button 
                    onClick={() => {
                      // Switch to transcripts tab in parent
                      const transcriptsTab = document.querySelector('[value="transcripts"]') as HTMLElement
                      if (transcriptsTab) transcriptsTab.click()
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    View Your Upload
                  </Button>
                </div>
              </div>
            )}
            
            {uploadState === 'error' && error && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Processing failed</span>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="file-upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manual Transcript
            </TabsTrigger>
            <TabsTrigger value="pre-transcribed" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Pre-transcribed
            </TabsTrigger>
            <TabsTrigger value="transcripts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              View Transcripts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </TabsTrigger>
          </TabsList>

          {/* File Upload Tab */}
          <TabsContent value="file-upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Audio File</CardTitle>
                <CardDescription>
                  Upload call recording for automatic transcription and analysis using local Whisper
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
                    Supported formats: WAV, MP3, M4A, FLAC, AAC
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client-name">Client Name *</Label>
                    <Input
                      id="client-name"
                      value={fileData.client_name}
                      onChange={(e) => setFileData(prev => ({ ...prev, client_name: e.target.value }))}
                      placeholder="e.g., Priya Sharma"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone-number">Phone Number *</Label>
                    <Input
                      id="phone-number"
                      value={fileData.phone_number}
                      onChange={(e) => setFileData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="e.g., +91 98765 43210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sales-agent">Sales Agent</Label>
                    <Input
                      id="sales-agent"
                      value={fileData.sales_agent}
                      onChange={(e) => setFileData(prev => ({ ...prev, sales_agent: e.target.value }))}
                      placeholder="Vikas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={fileData.duration}
                      onChange={(e) => setFileData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="Auto-detected if empty"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="task-id">Task ID (Optional)</Label>
                  <Input
                    id="task-id"
                    value={fileData.task_id}
                    onChange={(e) => setFileData(prev => ({ ...prev, task_id: e.target.value }))}
                    placeholder="Link to existing task"
                  />
                </div>

                <Button 
                  onClick={handleFileUpload} 
                  className="w-full"
                  disabled={!fileData.audio_file || !fileData.client_name || !fileData.phone_number}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Process with Local AI
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Transcript Tab */}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manual Transcript Input</CardTitle>
                <CardDescription>
                  Manually enter call transcript for analysis with local Ollama
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-client">Client Name *</Label>
                    <Input
                      id="manual-client"
                      value={manualData.client_name}
                      onChange={(e) => setManualData(prev => ({ ...prev, client_name: e.target.value }))}
                      placeholder="e.g., Priya Sharma"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-phone">Phone Number *</Label>
                    <Input
                      id="manual-phone"
                      value={manualData.phone_number}
                      onChange={(e) => setManualData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="e.g., +91 98765 43210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-agent">Sales Agent</Label>
                    <Input
                      id="manual-agent"
                      value={manualData.sales_agent}
                      onChange={(e) => setManualData(prev => ({ ...prev, sales_agent: e.target.value }))}
                      placeholder="Vikas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-duration">Duration (seconds)</Label>
                    <Input
                      id="manual-duration"
                      type="number"
                      value={manualData.duration}
                      onChange={(e) => setManualData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="manual-transcript">Call Transcript *</Label>
                  <Textarea
                    id="manual-transcript"
                    value={manualData.transcript}
                    onChange={(e) => setManualData(prev => ({ ...prev, transcript: e.target.value }))}
                    placeholder="Agent: Hello, this is Vikas from OOAK Photography...&#10;Client: Hi, I'm looking for wedding photography..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Format: "Speaker: Message" on each line
                  </div>
                </div>

                <Button 
                  onClick={handleManualTranscript} 
                  className="w-full"
                  disabled={!manualData.client_name || !manualData.phone_number || !manualData.transcript}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Process Manual Transcript
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pre-transcribed Tab */}
          <TabsContent value="pre-transcribed">
            <Card>
              <CardHeader>
                <CardTitle>Pre-transcribed Call</CardTitle>
                <CardDescription>
                  Import already transcribed call for analysis with local Ollama
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pre-client">Client Name *</Label>
                    <Input
                      id="pre-client"
                      value={preTranscribedData.client_name}
                      onChange={(e) => setPreTranscribedData(prev => ({ ...prev, client_name: e.target.value }))}
                      placeholder="e.g., Priya Sharma"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pre-phone">Phone Number *</Label>
                    <Input
                      id="pre-phone"
                      value={preTranscribedData.phone_number}
                      onChange={(e) => setPreTranscribedData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="e.g., +91 98765 43210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pre-agent">Sales Agent</Label>
                    <Input
                      id="pre-agent"
                      value={preTranscribedData.sales_agent}
                      onChange={(e) => setPreTranscribedData(prev => ({ ...prev, sales_agent: e.target.value }))}
                      placeholder="Vikas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pre-duration">Duration (seconds)</Label>
                    <Input
                      id="pre-duration"
                      type="number"
                      value={preTranscribedData.duration}
                      onChange={(e) => setPreTranscribedData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pre-confidence">Confidence Score</Label>
                    <Input
                      id="pre-confidence"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={preTranscribedData.confidence_score}
                      onChange={(e) => setPreTranscribedData(prev => ({ ...prev, confidence_score: e.target.value }))}
                      placeholder="0.85"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pre-transcript">Call Transcript *</Label>
                  <Textarea
                    id="pre-transcript"
                    value={preTranscribedData.transcript}
                    onChange={(e) => setPreTranscribedData(prev => ({ ...prev, transcript: e.target.value }))}
                    placeholder="Agent: Hello, this is Vikas from OOAK Photography...&#10;Client: Hi, I'm looking for wedding photography..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <Button 
                  onClick={handlePreTranscribed} 
                  className="w-full"
                  disabled={!preTranscribedData.client_name || !preTranscribedData.phone_number || !preTranscribedData.transcript}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Process Pre-transcribed Call
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts">
            <RealTranscriptsViewer />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <SimpleAnalyticsDemo />
          </TabsContent>
        </Tabs>
      )}


    </div>
  )
} 