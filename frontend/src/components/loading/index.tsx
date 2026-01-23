"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// ============================================
// Spinner
// ============================================

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", spinnerSizes[size], className)} />
  )
}

// ============================================
// Full Page Loading
// ============================================

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = "Chargement...", className }: PageLoadingProps) {
  return (
    <div className={cn("flex min-h-[400px] flex-col items-center justify-center gap-4", className)}>
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ============================================
// Inline Loading
// ============================================

interface InlineLoadingProps {
  message?: string
  className?: string
}

export function InlineLoading({ message, className }: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner size="sm" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  )
}

// ============================================
// Button Loading
// ============================================

interface ButtonLoadingProps {
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
  className?: string
}

export function ButtonLoading({ children, isLoading, loadingText, className }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <span className={cn("flex items-center gap-2", className)}>
        <Spinner size="sm" />
        {loadingText || "Chargement..."}
      </span>
    )
  }
  return <>{children}</>
}

// ============================================
// Card Skeleton
// ============================================

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

// ============================================
// Table Skeleton
// ============================================

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex gap-4 border-b pb-4 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3 border-b last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "max-w-[200px]"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================
// List Skeleton
// ============================================

interface ListSkeletonProps {
  items?: number
  showAvatar?: boolean
  className?: string
}

export function ListSkeleton({ items = 5, showAvatar = false, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// Stats Skeleton
// ============================================

export function StatsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// ============================================
// Form Skeleton
// ============================================

interface FormSkeletonProps {
  fields?: number
  className?: string
}

export function FormSkeleton({ fields = 4, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// ============================================
// Dashboard Skeleton
// ============================================

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  )
}
