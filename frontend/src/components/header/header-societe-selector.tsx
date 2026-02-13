"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Check, Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocieteStore } from "@/stores/societe-store";
import { useOrganisation } from "@/contexts/organisation-context";
import { CreateSocieteDialog } from "@/components/create-societe-dialog";
import { listSocietesByOrganisation, type SocieteDto } from "@/actions/societes";

export function HeaderSocieteSelector() {
  const { activeOrganisation } = useOrganisation();
  const [societes, setSocietes] = React.useState<SocieteDto[]>([]);
  const [societesLoading, setSocietesLoading] = React.useState(false);
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId);
  const setActiveSociete = useSocieteStore((state) => state.setActiveSociete);
  const [createSocieteOpen, setCreateSocieteOpen] = useState(false);
  const [noSocietePromptOpen, setNoSocietePromptOpen] = useState(false);
  const [fetchDone, setFetchDone] = React.useState(false);

  // Fetch societes
  React.useEffect(() => {
    if (!activeOrganisation?.organisationId) {
      setSocietes([]);
      setFetchDone(false);
      return;
    }
    setSocietesLoading(true);
    setFetchDone(false);
    listSocietesByOrganisation(activeOrganisation.organisationId).then((result) => {
      setSocietes(result.data ?? []);
      setFetchDone(true);
      setSocietesLoading(false);
    });
  }, [activeOrganisation?.organisationId]);

  const activeSociete = useMemo(() => {
    if (!activeSocieteId) return null;
    return societes.find((s) => s.id === activeSocieteId) || null;
  }, [activeSocieteId, societes]);

  // Auto-open prompt when no société exists (only once after successful fetch)
  React.useEffect(() => {
    if (fetchDone && !societesLoading && societes.length === 0 && activeOrganisation?.organisationId) {
      setNoSocietePromptOpen(true);
    }
  }, [fetchDone, societesLoading, societes.length, activeOrganisation?.organisationId]);

  if (!activeOrganisation) return null;

  return (
    <>
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      {societes.length === 0 && !societesLoading ? (
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 h-9 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-medium shadow-sm"
          onClick={() => setNoSocietePromptOpen(true)}
        >
          <Plus className="size-4" />
          Créer une société
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 h-9 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-medium shadow-sm"
            >
              <Building2 className="size-4" />
              <span className="max-w-40 truncate">
                {societesLoading ? "..." : activeSociete?.raisonSociale || "Toutes les sociétés"}
              </span>
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filtrer par société</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setActiveSociete(null)}
              className={cn(!activeSocieteId && "bg-accent")}
            >
              <Building2 className="mr-2 size-4" />
              Toutes les sociétés
              {!activeSocieteId && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {societes.map((societe) => (
              <DropdownMenuItem
                key={societe.id}
                onSelect={() => setActiveSociete(societe.id)}
                className={cn(activeSocieteId === societe.id && "bg-accent")}
              >
                <Building2 className="mr-2 size-4" />
                <span className="truncate">{societe.raisonSociale}</span>
                {activeSocieteId === societe.id && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setCreateSocieteOpen(true)}
              className="text-primary"
            >
              <Plus className="mr-2 size-4" />
              Créer une société
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Dialog proposition de créer une société */}
      <Dialog open={noSocietePromptOpen} onOpenChange={setNoSocietePromptOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="size-6 text-primary" />
            </div>
            <DialogTitle className="text-center">
              Aucune société
            </DialogTitle>
            <DialogDescription className="text-center">
              Vous n&apos;avez pas encore de société rattachée à votre organisation. Créez votre première société pour commencer à gérer vos clients et contrats.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full gap-2"
              onClick={() => {
                setNoSocietePromptOpen(false);
                setCreateSocieteOpen(true);
              }}
            >
              <Plus className="size-4" />
              Créer ma première société
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setNoSocietePromptOpen(false)}
            >
              Plus tard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog création de société */}
      <CreateSocieteDialog
        open={createSocieteOpen}
        onOpenChange={setCreateSocieteOpen}
        organisationId={activeOrganisation?.organisationId || ""}
        onSuccess={() => {
          // Refresh societes list
          if (activeOrganisation?.organisationId) {
            listSocietesByOrganisation(activeOrganisation.organisationId).then((result) => {
              if (result.data) {
                setSocietes(result.data);
              }
            });
          }
        }}
      />
    </>
  );
}
