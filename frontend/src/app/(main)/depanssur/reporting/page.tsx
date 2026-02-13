import { DepanssurReportingClient } from './reporting-client';
import { getActiveOrgId } from '@/lib/server/data';
import { listAbonnementsAction, listDossiersAction } from '@/actions/depanssur';

export default async function DepanssurReportingPage() {
  const activeOrgId = await getActiveOrgId();

  // Fetch both data sources in parallel
  const [abonnementsResult, dossiersResult] = await Promise.all([
    activeOrgId
      ? listAbonnementsAction({
          organisationId: activeOrgId,
          pagination: { page: 1, limit: 1000, sortBy: '', sortOrder: '' },
        })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? listDossiersAction({
          organisationId: activeOrgId,
          pagination: { page: 1, limit: 1000, sortBy: '', sortOrder: '' },
        })
      : Promise.resolve({ data: null, error: null }),
  ]);

  return (
    <DepanssurReportingClient
      initialAbonnements={abonnementsResult.data}
      initialDossiers={dossiersResult.data}
      activeOrgId={activeOrgId}
    />
  );
}
