"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Play, CheckCircle, AlertCircle, Search } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { migrateQuotationsAddSlug, checkQuotationsTableStructure } from "@/actions/quotations-actions"

export default function MigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [migrationMessage, setMigrationMessage] = useState<string>('')
  const [diagnosticStatus, setDiagnosticStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [diagnosticResult, setDiagnosticResult] = useState<string[]>([])

  const runDiagnostic = async () => {
    try {
      setDiagnosticStatus('running')
      setDiagnosticResult([])
      
      const result = await checkQuotationsTableStructure()
      
      if (result.success) {
        setDiagnosticStatus('success')
        setDiagnosticResult(result.columns || [])
        toast({
          title: "Diagnostic Complete",
          description: `Found ${result.columns?.length || 0} columns in quotations table`,
        })
      } else {
        setDiagnosticStatus('error')
        toast({
          title: "Diagnostic Failed",
          description: result.error || 'Failed to check table structure',
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Diagnostic error:', error)
      setDiagnosticStatus('error')
      toast({
        title: "Diagnostic Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const runSlugMigration = async () => {
    try {
      setMigrationStatus('running')
      setMigrationMessage('Starting migration...')
      
      const result = await migrateQuotationsAddSlug()
      
      if (result.success) {
        setMigrationStatus('success')
        setMigrationMessage(result.message || 'Migration completed successfully')
        toast({
          title: "Migration Successful",
          description: result.message || 'Quotation slugs have been migrated successfully',
        })
      } else {
        setMigrationStatus('error')
        setMigrationMessage(result.error || 'Migration failed')
        toast({
          title: "Migration Failed",
          description: result.error || 'Failed to migrate quotation slugs',
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Migration error:', error)
      setMigrationStatus('error')
      setMigrationMessage(`Migration error: ${error.message}`)
      toast({
        title: "Migration Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Database Migration</h1>
        <p className="text-muted-foreground">Run database migrations and schema updates</p>
      </div>

      {/* Table Structure Diagnostic */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Table Structure Diagnostic</CardTitle>
              <CardDescription>
                Check the current structure of the quotations table to verify column existence
              </CardDescription>
            </div>
            <div className="ml-auto">
              {diagnosticStatus === 'idle' && (
                <Badge variant="outline">Not Run</Badge>
              )}
              {diagnosticStatus === 'running' && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Running...
                </Badge>
              )}
              {diagnosticStatus === 'success' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
              {diagnosticStatus === 'error' && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2"><strong>What this diagnostic does:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Checks if quotations table exists and is accessible</li>
                <li>Lists all available columns in the table</li>
                <li>Verifies if the 'slug' column has been created</li>
              </ul>
            </div>

            {diagnosticResult.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">
                <p className="font-medium mb-2">Available Columns ({diagnosticResult.length}):</p>
                <div className="grid grid-cols-3 gap-2">
                  {diagnosticResult.map((column) => (
                    <Badge 
                      key={column} 
                      variant="outline" 
                      className={column === 'slug' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                    >
                      {column}
                      {column === 'slug' && ' ✓'}
                    </Badge>
                  ))}
                </div>
                {diagnosticResult.includes('slug') ? (
                  <p className="mt-2 text-green-700 font-medium">✓ Slug column found - ready for migration</p>
                ) : (
                  <p className="mt-2 text-red-700 font-medium">⚠ Slug column missing - please create it manually first</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={runDiagnostic}
                disabled={diagnosticStatus === 'running'}
                className="flex items-center gap-2"
                variant="outline"
              >
                {diagnosticStatus === 'running' ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Check Table Structure
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Slug Migration */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Quotation Slug Migration</CardTitle>
              <CardDescription>
                Add slug column to quotations table and populate existing records with URL-safe slugs
              </CardDescription>
            </div>
            <div className="ml-auto">
              {migrationStatus === 'idle' && (
                <Badge variant="outline">Not Run</Badge>
              )}
              {migrationStatus === 'running' && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Running...
                </Badge>
              )}
              {migrationStatus === 'success' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {migrationStatus === 'error' && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2"><strong>What this migration does:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Checks if the 'slug' column exists in quotations table</li>
                <li>Generates unique URL-safe slugs for existing quotations</li>
                <li>Creates a unique index on the slug column for performance</li>
                <li>Enables shareable URLs like: <code>/quotation/qt-2024-0001-abc123</code></li>
              </ul>
            </div>

            {migrationMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                migrationStatus === 'success' ? 'bg-green-50 text-green-800' :
                migrationStatus === 'error' ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                <pre className="whitespace-pre-wrap">{migrationMessage}</pre>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={runSlugMigration}
                disabled={migrationStatus === 'running' || !diagnosticResult.includes('slug')}
                className="flex items-center gap-2"
              >
                {migrationStatus === 'running' ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Running Migration...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Migration
                  </>
                )}
              </Button>
              
              {migrationStatus === 'success' && (
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              )}
            </div>
            
            {!diagnosticResult.includes('slug') && diagnosticResult.length > 0 && (
              <div className="p-3 rounded-lg bg-orange-50 text-orange-800 text-sm">
                <p className="font-medium">⚠ Slug column not found</p>
                <p>Please run the table diagnostic first, then manually add the slug column in Supabase:</p>
                <pre className="mt-2 p-2 bg-orange-100 rounded text-xs">
ALTER TABLE quotations ADD COLUMN slug VARCHAR(255);
CREATE UNIQUE INDEX quotations_slug_unique ON quotations(slug);</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Migration Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Run the table diagnostic first to verify the slug column exists</p>
            <p>• Run migrations in a staging environment first before production</p>
            <p>• Backup your database before running any migrations</p>
            <p>• Migrations are idempotent - safe to run multiple times</p>
            <p>• This page should be removed in production environments</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 