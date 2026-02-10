"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table-basic"
import { createColumns } from "@/app/(main)/commerciaux/columns"
import type { Apporteur } from "@proto/commerciaux/commerciaux"

interface CommercialsTableProps {
  commerciaux: Apporteur[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function CommercialsTable({ commerciaux, isLoading, onRefresh }: CommercialsTableProps) {
  const columns = React.useMemo(() => createColumns(onRefresh ?? (() => {})), [onRefresh])

  return <DataTable columns={columns} data={commerciaux} />
}
