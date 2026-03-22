'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import PublicCatalogView from '@/components/PublicCatalogView';

function CatalogoContent() {
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'pending'; msg: string } | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const failure = searchParams.get('failure');
    const pending = searchParams.get('pending');
    const userParam = searchParams.get('user');
    const basePath = userParam ? `/catalogo?user=${userParam}` : '/catalogo';
    if (success === '1') {
      setToast({ type: 'success', msg: 'Pagamento aprovado! Obrigado pela compra.' });
      window.history.replaceState({}, '', basePath);
      setTimeout(() => setToast(null), 5000);
    } else if (failure === '1') {
      setToast({ type: 'error', msg: 'Pagamento não concluído. Tente novamente.' });
      window.history.replaceState({}, '', basePath);
      setTimeout(() => setToast(null), 5000);
    } else if (pending === '1') {
      setToast({ type: 'pending', msg: 'Pagamento pendente. Aguarde confirmação.' });
      window.history.replaceState({}, '', basePath);
      setTimeout(() => setToast(null), 5000);
    }
  }, [searchParams]);

  const userId = searchParams.get('user');

  return (
    <>
      <PublicCatalogView userId={userId || undefined} />
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg text-white font-semibold ${
            toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-amber-500'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<PublicCatalogView />}>
      <CatalogoContent />
    </Suspense>
  );
}
