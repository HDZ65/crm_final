"use client"

import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

const MAX_LENGTH = 500

interface ErrorPanelProps {
  error: string
  className?: string
}

export function ErrorPanel({ error, className }: ErrorPanelProps) {
  const [expanded, setExpanded] = React.useState(false)
  if (!error) return null

  const truncated = error.length > MAX_LENGTH && !expanded
  const displayText = truncated ? error.slice(0, MAX_LENGTH) + "..." : error

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Dernière erreur</AlertTitle>
      <AlertDescription>
        <div className="mt-1 max-h-40 overflow-y-auto font-mono text-xs whitespace-pre-wrap break-all">
          {displayText}
        </div>
        {error.length > MAX_LENGTH && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-auto p-0 text-xs underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Réduire" : "Voir tout"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
