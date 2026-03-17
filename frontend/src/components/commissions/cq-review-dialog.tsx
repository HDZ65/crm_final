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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CQCritereChecklist } from "./cq-critere-checklist";
import { validerControle, rejeterControle, validerCritere } from "@/actions/qualite";

const rejectSchema = z.object({
  motif: z.string().min(10, "Le motif doit contenir au moins 10 caractères"),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

interface Critere {
  id: string;
  libelle: string;
  description?: string;
  obligatoire?: boolean;
}

interface ResultatCritere {
  critereId: string;
  conforme: boolean;
  commentaire?: string;
}

interface CQReviewDialogProps {
  controleId: string;
  contratRef?: string;
  criteres?: Critere[];
  resultats?: ResultatCritere[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CQReviewDialog({
  controleId,
  contratRef,
  criteres = [],
  resultats: initialResultats = [],
  open,
  onOpenChange,
  onSuccess,
}: CQReviewDialogProps) {
  const [resultats, setResultats] = React.useState<ResultatCritere[]>(initialResultats);
  const [action, setAction] = React.useState<"valider" | "rejeter" | "retourner" | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const score = criteres.length > 0
    ? Math.round((resultats.filter((r) => r.conforme).length / criteres.length) * 100)
    : 0;

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { motif: "" },
  });

  function handleCritereChange(critereId: string, conforme: boolean, commentaire: string) {
    setResultats((prev) => {
      const existing = prev.findIndex((r) => r.critereId === critereId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { critereId, conforme, commentaire };
        return updated;
      }
      return [...prev, { critereId, conforme, commentaire }];
    });
  }

  async function handleValider() {
    setIsSubmitting(true);
    try {
      const result = await validerControle(controleId, "current-user");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Contrôle validé");
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Erreur lors de la validation");
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  }

  async function handleReject(values: RejectFormValues) {
    setIsSubmitting(true);
    try {
      const result = await rejeterControle(controleId, values.motif, "current-user");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(action === "rejeter" ? "Contrôle rejeté" : "Contrôle retourné");
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Révision CQ — {contratRef ?? controleId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Score :</span>
            <Badge variant={score >= 80 ? "default" : score >= 50 ? "secondary" : "destructive"}>
              {score}%
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({resultats.filter((r) => r.conforme).length}/{criteres.length} critères conformes)
            </span>
          </div>

          <CQCritereChecklist
            criteres={criteres}
            resultats={resultats}
            onChange={handleCritereChange}
          />

          {(action === "rejeter" || action === "retourner") && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleReject)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="motif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Motif de {action === "rejeter" ? "rejet" : "retour"} *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Expliquez la raison..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant={action === "rejeter" ? "destructive" : "default"}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "En cours..." : action === "rejeter" ? "Confirmer le rejet" : "Confirmer le retour"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAction(null)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>

        {!action && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={() => setAction("retourner")}
              disabled={isSubmitting}
            >
              Retourner
            </Button>
            <Button
              variant="destructive"
              onClick={() => setAction("rejeter")}
              disabled={isSubmitting}
            >
              Rejeter
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleValider}
              disabled={isSubmitting}
            >
              {isSubmitting ? "En cours..." : "Valider"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
