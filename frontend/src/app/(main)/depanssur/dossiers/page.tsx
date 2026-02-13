import { DossiersPageClient } from './dossiers-page-client';
import { getActiveOrgId } from '@/lib/server/data';
import { listDossiersAction } from '@/actions/depanssur';

export default async function DossiersPage() {
  const activeOrgId = await getActiveOrgId();

  const dossiersResult = activeOrgId
    ? await listDossiersAction({
        organisationId: activeOrgId,
        pagination: { page: 1, limit: 50, sortBy: '', sortOrder: '' },
      })
    : { data: null, error: null };

  return (
    <DossiersPageClient
      initialDossiers={dossiersResult.data?.dossiers}
      activeOrgId={activeOrgId || undefined}
    />
  );
}
