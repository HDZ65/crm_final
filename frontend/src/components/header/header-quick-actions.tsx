"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  UserPlus,
  FileText,
  Briefcase,
  Mail,
  CalendarPlus,
} from "lucide-react";
import { CreateContratDialog } from "@/components/create-contrat-dialog";
import { CreateClientDialog } from "@/components/create-client-dialog";
import { CreateCommercialDialog } from "@/components/commerciaux/create-commercial-dialog";

export function HeaderQuickActions() {
  const [createContratOpen, setCreateContratOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [createCommercialOpen, setCreateCommercialOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="icon">
            <Plus className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setCreateClientOpen(true)}>
              <UserPlus className="mr-2 size-4" />
              <span>Nouveau client</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setCreateCommercialOpen(true)}>
              <Briefcase className="mr-2 size-4" />
              <span>Nouveau commercial</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setCreateContratOpen(true)}>
              <FileText className="mr-2 size-4" />
              <span>Nouveau contrat</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Mail className="mr-2 size-4" />
              <span>Envoyer un email</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CalendarPlus className="mr-2 size-4" />
              <span>Créer un événement</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog création de contrat */}
      <CreateContratDialog
        open={createContratOpen}
        onOpenChange={setCreateContratOpen}
      />

      {/* Dialog création de client */}
      <CreateClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
      />

      {/* Dialog création de commercial */}
      <CreateCommercialDialog
        open={createCommercialOpen}
        onOpenChange={setCreateCommercialOpen}
      />
    </>
  );
}
