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

interface CallInfo {
  id: string;
  client_name: string;
  date: string;
  duration: number;
  confidence_score: number;
}

interface ManualSpeakerCorrectionProps {
  callId: string;
  onCorrectionComplete?: (result: any) => void;
}

export default function ManualSpeakerCorrection({ callId, onCorrectionComplete }: ManualSpeakerCorrectionProps) {
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [segments, setSegments] = useState<CorrectionSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [corrections, setCorrections] = useState<Record<string, 'CLIENT' | 'AGENT'>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCorrectionInterface();
  }, [callId]);

  const loadCorrectionInterface = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manual-speaker-correction?callId=${callId}`);
      const data = await response.json();

      if (data.success) {
        setCallInfo(data.call_info);
        setSegments(data.correction_interface.segments);
        
        // Initialize corrections with AI suggestions
        const initialCorrections: Record<string, 'CLIENT' | 'AGENT'> = {};
        data.correction_interface.segments.forEach((segment: CorrectionSegment) => {
          initialCorrections[segment.id] = segment.suggested_speaker;
        });
        setCorrections(initialCorrections);
      }
    } catch (error) {
      console.error('Error loading correction interface:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const handleSpeakerChange = (segmentId: string, newSpeaker: 'CLIENT' | 'AGENT') => {
    setCorrections(prev => ({
      ...prev,
      [segmentId]: newSpeaker
    }));
    console.log(`✏️ Speaker changed for ${segmentId}: ${newSpeaker}`);
  };

  const handleNoteChange = (segmentId: string, note: string) => {
    setReviewNotes(prev => ({
      ...prev,
      [segmentId]: note
    }));
  };

  const saveCorrections = async () => {
    try {
      setSaving(true);
      
      console.log('💾 Starting to save corrections...');
      console.log('📋 Current corrections state:', corrections);
      console.log('📝 Current notes state:', reviewNotes);
      
      const correctionData = segments.map(segment => ({
        segment_id: segment.id,
        text: segment.text,
        suggested_speaker: segment.suggested_speaker,
        corrected_speaker: corrections[segment.id],
        confidence: segment.confidence,
        review_note: reviewNotes[segment.id] || ''
      }));

      console.log('📤 Sending correction data:', correctionData.slice(0, 3)); // Log first 3 for debugging

      const response = await fetch('/api/manual-speaker-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          corrections: correctionData,
          reviewedBy: 'sales_head'
        })
      });

      const result = await response.json();
      console.log('📥 Save response:', result);
      
      if (result.success) {
        console.log('✅ Corrections saved successfully!');
        onCorrectionComplete?.(result);
      } else {
        console.error('❌ Save failed:', result);
        alert(`Save failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error saving corrections:', error);
      alert(`Error saving corrections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getProgress = (): number => {
    const reviewedSegments = segments.filter(segment => 
      corrections[segment.id] !== segment.suggested_speaker || reviewNotes[segment.id]
    ).length;
    const progress = segments.length > 0 ? (reviewedSegments / segments.length) * 100 : 0;
    console.log(`📊 Progress: ${reviewedSegments}/${segments.length} segments reviewed (${progress.toFixed(1)}%)`);
    return progress;
  };

  const getCorrectionStats = () => {
    const totalSegments = segments.length;
    const highConfidence = segments.filter(s => s.confidence >= 0.8).length;
    const needsReview = segments.filter(s => s.confidence < 0.6).length;
    const corrected = Object.keys(corrections).filter(id => 
      corrections[id] !== segments.find(s => s.id === id)?.suggested_speaker
    ).length;

    return { totalSegments, highConfidence, needsReview, corrected };
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

  const stats = getCorrectionStats();

  return (
    <div className="space-y-6">
      {/* Header with call info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Manual Speaker Correction</span>
          </CardTitle>
          <CardDescription>
            Correct speaker identification for 100% accuracy • Call: {callInfo?.client_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Segments</p>
              <p className="text-2xl font-bold">{stats.totalSegments}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">High Confidence</p>
              <p className="text-2xl font-bold text-green-600">{stats.highConfidence}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Needs Review</p>
              <p className="text-2xl font-bold text-red-600">{stats.needsReview}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Corrected</p>
              <p className="text-2xl font-bold text-blue-600">{stats.corrected}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Review Progress</span>
              <span className="text-sm font-medium">{getProgress().toFixed(1)}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Segments for correction */}
      <div className="space-y-4">
        {segments.map((segment, index) => (
          <Card key={segment.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Segment text */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                  </div>

                  {/* AI suggestion and confidence */}
                  <div className="flex items-center space-x-3">
                    {getConfidenceIcon(segment.confidence)}
                    <Badge variant={segment.confidence >= 0.8 ? 'default' : segment.confidence >= 0.6 ? 'secondary' : 'destructive'}>
                      AI suggests: {segment.suggested_speaker}
                    </Badge>
                    <span className={`text-sm font-medium ${getConfidenceColor(segment.confidence)}`}>
                      {(segment.confidence * 100).toFixed(1)}% confidence
                    </span>
                    <span className="text-xs text-gray-500">
                      {segment.reasoning}
                    </span>
                  </div>

                  {/* Speaker correction */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <label className="text-sm font-medium">Correct Speaker:</label>
                    </div>
                    <Select
                      value={corrections[segment.id] || segment.suggested_speaker}
                      onValueChange={(value) => handleSpeakerChange(segment.id, value as 'CLIENT' | 'AGENT')}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLIENT">CLIENT</SelectItem>
                        <SelectItem value="AGENT">AGENT</SelectItem>
                      </SelectContent>
                    </Select>

                    {corrections[segment.id] !== segment.suggested_speaker && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Corrected
                      </Badge>
                    )}
                  </div>

                  {/* Review note */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Review Note (optional):
                    </label>
                    <Textarea
                      placeholder="Add any notes about this correction..."
                      value={reviewNotes[segment.id] || ''}
                      onChange={(e) => handleNoteChange(segment.id, e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Your corrections will achieve 100% accuracy and train the AI system
              </p>
              <p className="text-xs text-gray-500">
                {stats.corrected} segments corrected • {stats.needsReview} segments need attention
              </p>
            </div>
            <Button 
              onClick={saveCorrections} 
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Corrections</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 