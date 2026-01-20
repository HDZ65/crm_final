"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@radix-ui/react-button";
import { Input } from "@radix-ui/react-input";
import { Label } from "@radix-ui/react-label";

// ⚠️ IMPORTANT: Importer UNIQUEMENT depuis proto, PAS de Zod manuel
// ✅ CORRECT: Schéma généré automatiquement depuis Protobuf
// ❌ INTERDIT: const formSchema = z.object({ ... }) (Zod manuel)

import { CreateClientBaseRequestSchema } from "@proto/gen/zod/clients/client-base";
import { createClientBasePromiseClient } from "@proto/gen/ts-frontend/clients/service-client-base";

/**
 * Dialogue de création de client - Architecture Strictement Contract-Driven
 *
 * Schéma de validation : Importé depuis proto/gen/zod (généré par buf)
 * Pas de DTO manuel, pas de Zod manuel, pas de mapping.
 *
 * Workflow :
 * 1. Proto définit la structure (snake_case)
 * 2. buf generate → TS camelCase + Zod validation
 * 3. Frontend utilise directement le type généré
 * 4. Validation stricte aux frontières (rejet immédiat si invalide)
 */
export default function CreateClientDialog() {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: CreateClientBaseRequest) => {
      // Validation stricte via Zod généré depuis proto
      const validated = CreateClientBaseRequestSchema.parse(data);

      // Envoi direct du type validé (camelCase)
      return createClientBasePromiseClient(validated);
    },
    onSuccess: () => {
      setOpen(false);
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Créer un client
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Nouveau Client
          </h2>

          <form onSubmit={mutation.mutate} className="space-y-4">
            <div className="space-y-2">
              <div>
                <Label htmlFor="organisation_id">Organisation</Label>
                <Input
                  id="organisation_id"
                  name="organisation_id"
                  type="text"
                  placeholder="ID de l'organisation"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  name="nom"
                  type="text"
                  placeholder="Nom du client"
                  required
                />
              </div>

              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  type="text"
                  placeholder="Prénom du client"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <Label htmlFor="statut">Statut</Label>
                <Input
                  id="statut"
                  name="statut"
                  type="text"
                  placeholder="ACTIF"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Création..." : "Créer"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
            </div>

            {mutation.error && (
              <div className="p-4 bg-red-50 text-red-600 rounded border border-red-300">
                <p className="font-semibold">Erreur de validation</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(mutation.error, null, 2)}
                </pre>
              </div>
            )}
          </form>
        </div>
      </Dialog>
    </>
  );
}
