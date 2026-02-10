"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClientNotesSheet } from "@/components/client-notes-sheet"
import { ArrowLeft, Plus, Mail, MapPin, Calendar, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react"
import type { EventItem } from "@/lib/ui/display-types/client"

interface ClientHeaderProps {
  clientName: string
  status: string
  location: string
  memberSince: string
  allHistory: EventItem[]
  onEmailClick: () => void
  onNewContractClick: () => void
  onEditClick?: () => void
  onDeleteClick?: () => void
  onCopyClick?: () => void
}

export function ClientHeader({
  clientName,
  status,
  location,
  memberSince,
  allHistory,
  onEmailClick,
  onNewContractClick,
  onEditClick,
  onDeleteClick,
  onCopyClick,
}: ClientHeaderProps) {
  return (
    <Card className="bg-sidebar text-sidebar-foreground">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link href="/clients">
              <Button variant="outline" size="icon" aria-label="Retour">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-base md:text-2xl font-semibold tracking-tight">
                {clientName}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="secondary" className="bg-emerald-400/20 text-emerald-50">
                  {status}
                </Badge>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4" />
                  {location}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="size-4" />
                  Client depuis {memberSince}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ClientNotesSheet history={allHistory} />
            <Button variant="outline" size="sm" onClick={onEmailClick}>
              <Mail className="size-4" />
              Ecrire un email
            </Button>
            <Button size="sm" onClick={onNewContractClick}>
              <Plus className="size-4" />
              Nouveau contrat
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditClick}>
                  <Pencil className="size-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopyClick}>
                  <Copy className="size-4 mr-2" />
                  Copier les infos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDeleteClick} className="text-destructive focus:text-destructive">
                  <Trash2 className="size-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
