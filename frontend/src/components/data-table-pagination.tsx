"use client"

import * as React from "react"
import { type Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({ table, pageSizeOptions = [10, 20, 50] }: DataTablePaginationProps<TData>) {
  const total = table.getFilteredRowModel().rows.length
  const selected = table.getFilteredSelectedRowModel().rows.length
  const { pageIndex, pageSize } = table.getState().pagination

  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <div className="flex items-center justify-end gap-3 py-3">
      <div className="text-muted-foreground flex-1 text-sm">
        {selected} sur {total} sélectionné(s).
      </div>
      <div className="text-sm text-muted-foreground hidden sm:block">
        Affiche {start}-{end} sur {total}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Lignes / page</span>
        <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
          <SelectTrigger className="h-8 w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-lg">
            {pageSizeOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Précédent
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Suivant
        </Button>
      </div>
    </div>
  )
}

