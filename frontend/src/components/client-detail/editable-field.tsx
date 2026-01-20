"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditableFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  label: string
  icon?: React.ReactNode
  className?: string
  inputType?: "text" | "email" | "tel" | "date"
}

export function EditableField({
  value,
  onSave,
  label,
  icon,
  className,
  inputType = "text",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(value)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setEditValue(value)
  }, [value])

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch {
      setEditValue(value)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        {icon && <div className="size-4 text-slate-500 mt-2">{icon}</div>}
        <div className="flex-1 ">
          <div className="text-slate-600 text-xs">{label}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Input
              ref={inputRef}
              type={inputType}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm"
              disabled={isLoading}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              disabled={isLoading}
              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
            >
              <Check className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
              className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-100"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn("flex items-start gap-2 group cursor-pointer rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-amber-200/50", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsEditing(true)}
    >
      {icon && <div className="size-4 text-slate-500 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-slate-600 text-xs">{label}</div>
        <div className="font-medium truncate">{value || "—"}</div>
      </div>
      <Pencil
        className={cn(
          "size-3.5 text-slate-400 mt-1 transition-opacity",
          isHovered ? "opacity-100 " : "opacity-0"
        )}
      />
    </div>
  )
}
