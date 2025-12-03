"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table-basic"
import { columns } from "@/app/(main)/commerciaux/columns"
import type { Commercial } from "@/types/commercial"

interface CommercialsTableProps {
  commerciaux: Commercial[]
  isLoading?: boolean
}

export function CommercialsTable({ commerciaux, isLoading }: CommercialsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <DataTable columns={columns} data={commerciaux} />
}
