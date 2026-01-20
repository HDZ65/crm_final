"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSociete } from "@/actions/societes";

const createSocieteSchema = z.object({
  raisonSociale: z.string().min(1, "La raison sociale est requise"),
  siren: z.string().length(9, "Le SIREN doit contenir 9 chiffres").regex(/^\d+$/, "Le SIREN ne doit contenir que des chiffres"),
  numeroTva: z.string().optional(),
});

type CreateSocieteFormData = z.infer<typeof createSocieteSchema>;

interface CreateSocieteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  onSuccess?: () => void;
}

export function CreateSocieteDialog({
  open,
  onOpenChange,
  organisationId,
  onSuccess,
}: CreateSocieteDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateSocieteFormData>({
    resolver: zodResolver(createSocieteSchema),
    defaultValues: {
      raisonSociale: "",
      siren: "",
      numeroTva: "",
    },
  });

  const onSubmit = (data: CreateSocieteFormData) => {
    console.log("[CreateSocieteDialog] organisationId:", organisationId);

    if (!organisationId) {
      toast.error("Erreur", {
        description: "Aucune organisation sélectionnée",
      });
      return;
    }

    startTransition(async () => {
      const result = await createSociete({
        organisationId,
        raisonSociale: data.raisonSociale,
        siren: data.siren,
        numeroTva: data.numeroTva || "",
      });

      if (result.error) {
        toast.error("Erreur", {
          description: result.error,
        });
        return;
      }

      toast.success("Succès", {
        description: `La société "${data.raisonSociale}" a été créée`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Nouvelle société
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle société pour votre organisation. Elle sera disponible pour filtrer vos données.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="raisonSociale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raison sociale *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ma Société SAS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siren"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SIREN *</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" maxLength={9} {...field} />
                  </FormControl>
                  <FormDescription>
                    Numéro SIREN à 9 chiffres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroTva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de TVA</FormLabel>
                  <FormControl>
                    <Input placeholder="FR12345678901" {...field} />
                  </FormControl>
                  <FormDescription>
                    Numéro de TVA intracommunautaire (optionnel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                Créer la société
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
