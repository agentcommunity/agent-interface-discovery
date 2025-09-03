"use client"

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export interface DepPickerProps {
  value?: string
  onChange?: (iso: string) => void
}

export function DepPicker({ value, onChange }: DepPickerProps) {
  const [open, setOpen] = useState(false)
  const date = value ? new Date(value) : undefined

  function toIso(d: Date): string {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}T00:00:00Z`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {value || 'Pick deprecation date (UTC)'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) onChange?.(toIso(d))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}


