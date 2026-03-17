"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createSignatureRequest } from "@/actions/yousign";

const schema = z.object({
  signerName: z.string().min(1, "Le nom est requis"),
  signerEmail: z.string().email("Email invalide"),
  documentId: z.string().min(1, "L'ID du document est requis"),
});

type FormValues = z.infer<typeof schema>;

interface InitiateSignatureDialogProps {
  contratId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (signerUrl: string) => void;
}

export function InitiateSignatureDialog({
  contratId,
  open,
  onOpenChange,
  onSuccess,
}: InitiateSignatureDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { signerName: "", signerEmail: "", documentId: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await createSignatureRequest({
        contratId,
        signerName: values.signerName,
        signerEmail: values.signerEmail,
        documentId: values.documentId,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Demande de signature envoyée");
        form.reset();
        onOpenChange(false);
        if (result.data?.signerUrl) onSuccess?.(result.data.signerUrl);
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Initier une signature électronique</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="signerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du signataire *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="signerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email du signataire *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jean@exemple.fr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID du document *</FormLabel>
                  <FormControl>
                    <Input placeholder="UUID du document" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Envoi..." : "Envoyer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
