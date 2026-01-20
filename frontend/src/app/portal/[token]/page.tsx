import { Suspense } from 'react';
import { PortalPageClient } from './portal-page-client';
import { PortalLoadingSkeleton } from './components/portal-loading';

interface PortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params;
  return (
    <Suspense fallback={<PortalLoadingSkeleton />}>
      <PortalPageClient token={token} />
    </Suspense>
  );
}

export const metadata = {
  title: 'Portail de Paiement',
  description: 'Effectuez votre paiement en toute sécurité',
};
