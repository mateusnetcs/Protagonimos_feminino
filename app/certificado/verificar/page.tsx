import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { verifyCertificate } from '@/lib/certificate-verify';

type PageProps = {
  searchParams: Promise<{ u?: string; t?: string }>;
};

export default async function VerificarCertificadoPage({ searchParams }: PageProps) {
  const { u, t } = await searchParams;
  const result = await verifyCertificate(u, t);

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="bg-primary/10 px-6 py-5 border-b border-primary/20 flex items-center gap-4">
          <Image
            src="/images/uemasul-brasao.png"
            alt="Uemasul"
            width={56}
            height={56}
            className="object-contain"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Verificação</p>
            <h1 className="text-lg font-bold text-slate-800">Certificado Protagonismo Feminino</h1>
          </div>
        </div>

        <div className="px-6 py-8 text-center">
          {result.valid ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <ShieldCheck className="w-9 h-9 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-700 mb-2">Certificado autêntico</h2>
              <p className="text-slate-600 mb-6">
                Este certificado foi emitido pela plataforma e é <strong>válido</strong>.
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 text-left px-5 py-4 space-y-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Participante</p>
                  <p className="font-semibold text-slate-800 text-base">{result.participant.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Programa</p>
                  <p className="font-medium text-slate-700">{result.program}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Ofertado por</p>
                  <p className="font-medium text-slate-700">{result.offeredBy}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <ShieldX className="w-9 h-9 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Não autenticado</h2>
              <p className="text-slate-600">{result.message}</p>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
