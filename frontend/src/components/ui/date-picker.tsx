"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale/fr"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  name?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionnez une date",
  disabled,
  id,
  name,
  className,
}: DatePickerProps) {
  const dateValue = value ? new Date(value) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      // Convert to ISO date string (YYYY-MM-DD)
      const isoString = date.toISOString().split('T')[0]
      onChange(isoString)
    } else if (!date && onChange) {
      onChange("")
    }
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value || ""} />}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, "PPP", { locale: fr }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            captionLayout="dropdown"
            locale={fr}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
