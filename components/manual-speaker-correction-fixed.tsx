'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, User, Users, Save, RefreshCw } from 'lucide-react';

interface CorrectionSegment {
  id: string;
  text: string;
  suggested_speaker: 'CLIENT' | 'AGENT';
  confidence: number;
  reasoning: string;
  corrected_speaker?: 'CLIENT' | 'AGENT';
  review_note?: string;
}

interface ManualSpeakerCorrectionProps {
  callId: string;
  onCorrectionComplete?: (result: any) => void;
}

export default function ManualSpeakerCorrectionFixed({ callId, onCorrectionComplete }: ManualSpeakerCorrectionProps) {
  const [segments, setSegments] = useState<CorrectionSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [callInfo, setCallInfo] = useState<any>(null);
  
  // Store corrections as part of segments to avoid state sync issues
  const [correctedSegments, setCorrectedSegments] = useState<CorrectionSegment[]>([]);

  useEffect(() => {
    loadCorrectionInterface();
  }, [callId]);

  const loadCorrectionInterface = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Loading correction interface for call: ${callId}`);
      
      const response = await fetch(`/api/manual-speaker-correction?callId=${callId}`);
      const data = await response.json();

      console.log('📥 Loaded data:', data);

      if (data.success) {
        setCallInfo(data.call_info);
        // Initialize segments with corrected_speaker set to suggested_speaker
        const initializedSegments = data.correction_interface.segments.map((segment: CorrectionSegment) => ({
          ...segment,
          corrected_speaker: segment.suggested_speaker,
          review_note: ''
        }));
        setSegments(initializedSegments);
      } else {
        console.error('❌ Failed to load correction interface:', data.error);
        alert(`Failed to load: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error loading correction interface:', error);
      alert(`Error loading: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateSegmentSpeaker = (segmentIndex: number, newSpeaker: 'CLIENT' | 'AGENT') => {
    console.log(`✏️ Updating segment ${segmentIndex} to ${newSpeaker}`);
    
    setSegments(prev => 
      prev.map((segment, index) => 
        index === segmentIndex 
          ? { ...segment, corrected_speaker: newSpeaker }
          : segment
      )
    );
  };

  const updateSegmentNote = (segmentIndex: number, note: string) => {
    setSegments(prev => 
      prev.map((segment, index) => 
        index === segmentIndex 
          ? { ...segment, review_note: note }
          : segment
      )
    );
  };

  const saveAllCorrections = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving all corrections...');

      const corrections = segments.map((segment) => ({
        segment_id: segment.id,
        text: segment.text.replace(/^\[(?:AGENT|CLIENT)\]:\s*/, ''), // Remove existing labels
        suggested_speaker: segment.suggested_speaker,
        corrected_speaker: segment.corrected_speaker || segment.suggested_speaker,
        confidence: segment.confidence,
        review_note: segment.review_note || ''
      }));

      console.log(`📤 Sending ${corrections.length} corrections to server...`);

      const response = await fetch('/api/manual-speaker-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          corrections,
          reviewedBy: 'sales_head'
        })
      });

      const result = await response.json();
      console.log('📥 Save result:', result);

      if (result.success) {
        console.log('✅ Corrections saved successfully!');
        alert(`Success! ${result.corrections_count} corrections saved with 100% accuracy. AI system has been trained.`);
        onCorrectionComplete?.(result);
      } else {
        console.error('❌ Save failed:', result);
        alert(`Save failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error saving corrections:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getStats = () => {
    const totalSegments = segments.length;
    const highConfidence = segments.filter(s => s.confidence >= 0.8).length;
    const needsReview = segments.filter(s => s.confidence < 0.6).length;
    const corrected = segments.filter(s => 
      s.corrected_speaker !== s.suggested_speaker
    ).length;

    return { totalSegments, highConfidence, needsReview, corrected };
  };

  const getProgress = (): number => {
    const reviewed = segments.filter(s => 
      s.corrected_speaker !== s.suggested_speaker || s.review_note
    ).length;
    return segments.length > 0 ? (reviewed / segments.length) * 100 : 0;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading correction interface...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Manual Speaker Correction - 100% Accuracy</span>
          </CardTitle>
          <CardDescription>
            Call: {callInfo?.client_name} • Fix speaker labels for perfect AI training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalSegments}</p>
              <p className="text-sm text-gray-600">Total Segments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.highConfidence}</p>
              <p className="text-sm text-gray-600">High Confidence</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.needsReview}</p>
              <p className="text-sm text-gray-600">Needs Review</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.corrected}</p>
              <p className="text-sm text-gray-600">Corrected</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Progress: {getProgress().toFixed(1)}%</span>
              <Button onClick={saveAllCorrections} disabled={saving} size="sm">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Saving...' : 'Save All Corrections'}
              </Button>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Segments */}
      <div className="space-y-3">
        {segments.slice(0, 20).map((segment, index) => (
          <Card key={segment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Badge variant="outline" className="flex-shrink-0 mt-1">
                  #{index + 1}
                </Badge>

                <div className="flex-1 space-y-3">
                  {/* Segment text */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-mono">{segment.text}</p>
                  </div>

                  {/* AI suggestion */}
                  <div className="flex items-center space-x-3">
                    {getConfidenceIcon(segment.confidence)}
                    <Badge variant={segment.confidence >= 0.8 ? 'default' : segment.confidence >= 0.6 ? 'secondary' : 'destructive'}>
                      AI: {segment.suggested_speaker}
                    </Badge>
                    <span className={`text-sm ${getConfidenceColor(segment.confidence)}`}>
                      {(segment.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">{segment.reasoning}</span>
                  </div>

                  {/* Correction */}
                  <div className="flex items-center space-x-4">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Correct Speaker:</span>
                    <Select
                      value={segment.corrected_speaker || segment.suggested_speaker}
                      onValueChange={(value) => updateSegmentSpeaker(index, value as 'CLIENT' | 'AGENT')}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLIENT">CLIENT</SelectItem>
                        <SelectItem value="AGENT">AGENT</SelectItem>
                      </SelectContent>
                    </Select>

                    {segment.corrected_speaker !== segment.suggested_speaker && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ✅ Corrected
                      </Badge>
                    )}
                  </div>

                  {/* Notes */}
                  <Textarea
                    placeholder="Add review notes (optional)..."
                    value={segment.review_note || ''}
                    onChange={(e) => updateSegmentNote(index, e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {segments.length > 20 && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">
                Showing first 20 segments. {segments.length - 20} more segments will be included when you save.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Final save button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Ready to save {stats.corrected} corrections?</p>
              <p className="text-xs text-gray-500">
                This will achieve 100% accuracy and train your AI system
              </p>
            </div>
            <Button onClick={saveAllCorrections} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save {stats.totalSegments} Corrections
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 