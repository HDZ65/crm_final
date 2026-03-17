"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ButtonGroup } from "@/components/ui/button-group"
import { Button } from "@/components/ui/button"

interface DateRangePickerAirbnbProps {
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePickerAirbnb({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerAirbnbProps) {
  const [open, setOpen] = React.useState(false)
  const [activeButton, setActiveButton] = React.useState<"from" | "to">("from")

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    if (activeButton === "from") {
      // Sélection de la date de début
      onDateRangeChange?.({ from: date, to: dateRange?.to })
      // Passer automatiquement à la sélection de la date de fin
      setActiveButton("to")
    } else {
      // Sélection de la date de fin
      onDateRangeChange?.({ from: dateRange?.from, to: date })
      // Fermer le calendrier
      setOpen(false)
      setActiveButton("from")
    }
  }

  const handleButtonClick = (button: "from" | "to") => {
    setActiveButton(button)
    setOpen(true)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ButtonGroup className={cn("w-full", className)}>
        <PopoverTrigger asChild>
          <Button
            variant={activeButton === "from" && open ? "default" : "outline"}
            className={cn("flex-1 justify-start")}
            onClick={() => handleButtonClick("from")}
          >
            {dateRange?.from ? (
              format(dateRange.from, "dd/MM/yyyy", { locale: fr })
            ) : (
              <span className="text-muted-foreground">Date de début</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverTrigger asChild>
          <Button
            variant={activeButton === "to" && open ? "default" : "outline"}
            className={cn("flex-1 justify-start")}
            onClick={() => handleButtonClick("to")}
          >
            {dateRange?.to ? (
              format(dateRange.to, "dd/MM/yyyy", { locale: fr })
            ) : (
              <span className="text-muted-foreground">Date de fin</span>
            )}
          </Button>
        </PopoverTrigger>
      </ButtonGroup>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={activeButton === "from" ? dateRange?.from : dateRange?.to}
          onSelect={handleDateSelect}
          locale={fr}
          disabled={(date) => {
            // Si on sélectionne la date de fin, désactiver les dates avant la date de début
            if (activeButton === "to" && dateRange?.from) {
              return date < dateRange.from
            }
            return false
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
