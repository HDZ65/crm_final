import { Suspense } from 'react';
import { PortalPageClient } from './portal-page-client';
import { PortalLoadingSkeleton } from './components/portal-loading';

interface PortalPageProps {
  params: { token: string };
}

export default function PortalPage({ params }: PortalPageProps) {
  return (
    <Suspense fallback={<PortalLoadingSkeleton />}>
      <PortalPageClient token={params.token} />
    </Suspense>
  );
}

export const metadata = {
  title: 'Portail de Paiement',
  description: 'Effectuez votre paiement en toute sécurité',
};
