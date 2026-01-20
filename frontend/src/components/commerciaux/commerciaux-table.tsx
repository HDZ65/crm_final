"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table-basic"
import { createColumns } from "@/app/(main)/commerciaux/columns"
import type { Commercial } from "@/types/commercial"

interface CommercialsTableProps {
  commerciaux: Commercial[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function CommercialsTable({ commerciaux, isLoading, onRefresh }: CommercialsTableProps) {
  const columns = React.useMemo(() => createColumns(onRefresh ?? (() => {})), [onRefresh])

  return <DataTable columns={columns} data={commerciaux} />
}
