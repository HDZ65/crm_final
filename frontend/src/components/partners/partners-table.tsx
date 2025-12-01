"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table-basic"
import { columns } from "@/app/(main)/partenaires/columns"
import type { Partner } from "@/types/partner"

interface PartnersTableProps {
  partners: Partner[]
}

export function PartnersTable({ partners }: PartnersTableProps) {
  return <DataTable columns={columns} data={partners} />
}
