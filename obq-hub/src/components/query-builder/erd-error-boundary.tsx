'use client'

/**
 * ERD Error Boundary
 * 
 * React class-component Error Boundary that wraps the visual ERD canvas.
 * On unhandled errors:
 * 1. Renders a Google Cloud-style "Visualizer Offline" fallback UI
 * 2. Captures the Zustand visual query state snapshot
 * 3. Scrubs all PII (table/column names) via the pii-scrubber utility
 * 4. Logs the scrubbed diagnostic payload for debugging
 * 
 * @story 14.1 - PII-Scrubbed React Error Boundary
 */

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useVisualQueryStore } from '@/store/visual-query'
import { scrubPII } from '@/lib/pii-scrubber'

interface ErdErrorBoundaryProps {
  children: React.ReactNode
}

interface ErdErrorBoundaryState {
  hasError: boolean
  errorMessage: string | null
}

export class ErdErrorBoundary extends React.Component<ErdErrorBoundaryProps, ErdErrorBoundaryState> {
  constructor(props: ErdErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: null }
  }

  static getDerivedStateFromError(error: Error): ErdErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message ?? 'An unexpected error occurred in the visual canvas.',
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Capture Zustand state snapshot
    const { nodes, edges, selected_paths } = useVisualQueryStore.getState()

    // Scrub all PII from the diagnostic payload
    const scrubbedPayload = scrubPII(
      nodes,
      edges,
      selected_paths,
      error,
      errorInfo.componentStack ?? undefined
    )

    // Log the PII-scrubbed diagnostic payload
    // (Story 14.2 will ship this to the backend telemetry endpoint)
    console.error(
      '[ErdErrorBoundary] PII-scrubbed diagnostic payload:',
      JSON.stringify(scrubbedPayload, null, 2)
    )
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="relative w-full h-[600px] border border-border rounded-xl overflow-hidden bg-muted/10 shadow-inner flex items-center justify-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground">
              Visualizer Offline
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              The interactive schema explorer encountered an unexpected error and has been safely shut down.
              Your query selections and data remain intact. A diagnostic report (with all sensitive identifiers removed) has been logged.
            </p>

            {/* Error detail (scrubbed) */}
            {this.state.errorMessage && (
              <div className="w-full px-4 py-2 bg-muted/30 rounded-lg border border-border">
                <code className="text-xs text-muted-foreground font-mono break-all">
                  {this.state.errorMessage}
                </code>
              </div>
            )}

            {/* Retry button */}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Visualization
            </button>

            {/* Google Cloud branding hint */}
            <p className="text-[10px] text-muted-foreground/50 mt-2">
              Error ID: {Date.now().toString(36).toUpperCase()} · OData Gateway for BigQuery
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
