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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createPieceJointeAction } from "@/actions/documents";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadSchema = z.object({
  typeDocument: z.string().min(1, "Le type de document est requis"),
  entiteType: z.string().optional(),
  entiteId: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const TYPE_DOCUMENT_OPTIONS = [
  { value: "CNI", label: "Carte Nationale d'Identité" },
  { value: "RIB", label: "RIB" },
  { value: "MANDAT_SEPA", label: "Mandat SEPA" },
  { value: "JUSTIFICATIF_DOMICILE", label: "Justificatif de domicile" },
  { value: "KBIS", label: "Kbis" },
  { value: "ATTESTATION_ASSURANCE", label: "Attestation d'assurance" },
  { value: "CONTRAT_SIGNE", label: "Contrat signé" },
  { value: "AUTRE", label: "Autre" },
];

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadDocumentDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { typeDocument: "", entiteType: "", entiteId: "" },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFileError(null);
    if (selected && selected.size > MAX_FILE_SIZE) {
      setFileError("Le fichier ne doit pas dépasser 10 Mo");
      setFile(null);
    } else {
      setFile(selected);
    }
  }

  async function onSubmit(values: UploadFormValues) {
    if (!file) {
      setFileError("Veuillez sélectionner un fichier");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createPieceJointeAction({
        nomFichier: file.name,
        url: URL.createObjectURL(file),
        typeMime: file.type,
        taille: file.size,
        entiteType: values.entiteType ?? "",
        entiteId: values.entiteId ?? "",
        uploadedBy: "current-user",
        typeDocument: values.typeDocument as unknown as import("@proto/documents/documents").TypeDocument,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document uploadé avec succès");
        form.reset();
        setFile(null);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="typeDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de document *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TYPE_DOCUMENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1">
              <label className="text-sm font-medium">Fichier *</label>
              <Input type="file" onChange={handleFileChange} />
              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="entiteType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'entité (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: contrat" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entiteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID entité (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="UUID de l'entité" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Upload en cours..." : "Uploader"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
