'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import PublicCatalogView from '@/components/PublicCatalogView';

export default function CatalogoUserPage() {
  const params = useParams();
  const userId = typeof params.userId === 'string' ? params.userId : undefined;

  return (
    <Suspense fallback={<PublicCatalogView userId={userId} />}>
      <PublicCatalogView userId={userId} />
    </Suspense>
  );
}
