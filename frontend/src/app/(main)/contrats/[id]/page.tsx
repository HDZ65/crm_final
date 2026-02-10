import { getClient } from "@/actions/clients";
import { getApporteur } from "@/actions/commerciaux";
import { getContratWithDetails } from "@/actions/contrats";
import { ContratDetailClient } from "./contrat-detail-client";

interface ContratDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContratDetailPage({
  params,
}: ContratDetailPageProps) {
  const { id } = await params;
  const contratDetailsResult = await getContratWithDetails(id);

  if (contratDetailsResult.error || !contratDetailsResult.data?.contrat) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Contrat introuvable</p>
      </main>
    );
  }

  const contrat = contratDetailsResult.data.contrat;

  const [clientResult, commercialResult] = await Promise.all([
    contrat.clientId
      ? getClient(contrat.clientId)
      : Promise.resolve({ data: null, error: null }),
    contrat.commercialId
      ? getApporteur(contrat.commercialId)
      : Promise.resolve({ data: null, error: null }),
  ]);

  return (
    <ContratDetailClient
      contratId={id}
      initialDetails={contratDetailsResult.data}
      clientName={
        clientResult.data
          ? [clientResult.data.prenom, clientResult.data.nom]
              .filter(Boolean)
              .join(" ") || "Client"
          : null
      }
      commercialName={
        commercialResult.data
          ? [commercialResult.data.prenom, commercialResult.data.nom]
              .filter(Boolean)
              .join(" ") || "Commercial"
          : null
      }
    />
  );
}
