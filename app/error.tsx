'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Não foi possível carregar esta página</h2>
        <p className="text-sm text-slate-600 mb-6">{error.message || 'Erro inesperado.'}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
