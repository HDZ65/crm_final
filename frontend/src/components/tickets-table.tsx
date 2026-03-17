"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown } from "lucide-react"
import { ticketsColumns } from "@/components/tickets-columns"
import type { Ticket } from "@/types/tickets"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function TicketsTable({
  data,
  search,
  onBulkDelete,
}: {
  data: Ticket[]
  search?: string
  onBulkDelete?: (ids: string[]) => void
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false })
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalSearch, setGlobalSearch] = React.useState<string>("")

  const table = useReactTable({
    data,
    columns: ticketsColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    if (typeof search === "string") setGlobalSearch(search)
  }, [search])

  React.useEffect(() => {
    table.getColumn("search")?.setFilterValue(globalSearch?.toLowerCase?.() ?? "")
  }, [globalSearch, table])

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="flex items-center gap-3 py-3">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} ticket(s)
        </div>
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-sm">
              {table.getFilteredSelectedRowModel().rows.length} sélectionné(s)
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer les tickets sélectionnés ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible et supprime définitivement les tickets choisis.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const ids = table
                        .getFilteredSelectedRowModel()
                        .rows.map((r) => r.original.id)
                      onBulkDelete?.(ids)
                      table.resetRowSelection()
                    }}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Colonnes <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={ticketsColumns.length} className="h-24 text-center">
                    Aucun résultat.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} sur {table.getFilteredRowModel().rows.length} sélectionné(s).
        </div>
        <div className="flex items-center gap-3 mr-auto">
          <div className="text-sm text-muted-foreground">
            Affiche {table.getFilteredRowModel().rows.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            -
            {Math.min(
              table.getFilteredRowModel().rows.length,
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize
            )}
            {" "}sur {table.getFilteredRowModel().rows.length}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Lignes / page</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-lg">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}
