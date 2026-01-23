"use client"

import { useEffect } from "react"
import { X, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore, type GlobalError } from "@/stores/app-store"
import { cn } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface GlobalErrorDisplayProps {
  className?: string
  position?: "top" | "bottom"
  maxErrors?: number
}

// ============================================
// Single Error Item
// ============================================

function ErrorItem({ error, onDismiss }: { error: GlobalError; onDismiss: (id: string) => void }) {
  const Icon = error.type === "error" ? AlertCircle : error.type === "warning" ? AlertTriangle : Info
  
  const bgColor = {
    error: "bg-destructive/10 border-destructive/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
  }[error.type]
  
  const iconColor = {
    error: "text-destructive",
    warning: "text-yellow-600",
    info: "text-blue-600",
  }[error.type]

  // Auto-dismiss apres 10 secondes pour les warnings et info
  useEffect(() => {
    if (error.type !== "error" && error.dismissible) {
      const timer = setTimeout(() => onDismiss(error.id), 10000)
      return () => clearTimeout(timer)
    }
  }, [error, onDismiss])

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-sm animate-in slide-in-from-top-2",
        bgColor
      )}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{error.title}</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        
        {error.fieldErrors && Object.keys(error.fieldErrors).length > 0 && (
          <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside">
            {Object.entries(error.fieldErrors).map(([field, errors]) => (
              <li key={field}>
                <strong>{field}:</strong> {errors.join(", ")}
              </li>
            ))}
          </ul>
        )}
        
        {error.action && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 mt-2"
            onClick={error.action.onClick}
          >
            {error.action.label}
          </Button>
        )}
      </div>
      
      {error.dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => onDismiss(error.id)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </Button>
      )}
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function GlobalErrorDisplay({
  className,
  position = "top",
  maxErrors = 3,
}: GlobalErrorDisplayProps) {
  const errors = useAppStore((state) => state.globalErrors)
  const removeError = useAppStore((state) => state.removeError)
  
  // Ne montrer que les dernieres erreurs
  const visibleErrors = errors.slice(-maxErrors)
  
  if (visibleErrors.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4",
        position === "top" ? "top-4" : "bottom-4",
        className
      )}
    >
      <div className="space-y-2">
        {visibleErrors.map((error) => (
          <ErrorItem key={error.id} error={error} onDismiss={removeError} />
        ))}
      </div>
      
      {errors.length > maxErrors && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          +{errors.length - maxErrors} autre(s) erreur(s)
        </p>
      )}
    </div>
  )
}

// ============================================
// Inline Error Display (for forms/sections)
// ============================================

interface InlineErrorProps {
  error: string | null
  className?: string
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  )
}

// ============================================
// Field Error Display (for form fields)
// ============================================

interface FieldErrorProps {
  errors?: string[]
  className?: string
}

export function FieldError({ errors, className }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null
  
  return (
    <div className={cn("mt-1 space-y-1", className)}>
      {errors.map((error, index) => (
        <p key={index} className="text-xs text-destructive">
          {error}
        </p>
      ))}
    </div>
  )
}
