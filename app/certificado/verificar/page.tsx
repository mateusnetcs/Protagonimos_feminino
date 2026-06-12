import Link from 'next/link';
import { Award, ShieldCheck, ShieldX } from 'lucide-react';
import {
  CERTIFICATE_OFFERED_BY,
  CERTIFICATE_PROJECT_SHORT,
  CERTIFICATE_PROJECT_TITLE,
} from '@/lib/certificate-project';
import { verifyCertificate } from '@/lib/certificate-verify';

type PageProps = {
  searchParams: Promise<{ u?: string; t?: string }>;
};

export default async function VerificarCertificadoPage({ searchParams }: PageProps) {
  const { u, t } = await searchParams;
  const result = await verifyCertificate(u, t);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f4ef] via-[#f8f7f5] to-[#f0ebe3] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-2xl border border-[#e8c9a0]/80 bg-white shadow-[0_20px_50px_-12px_rgba(180,83,9,0.15)] overflow-hidden">
        {/* Cabeçalho */}
        <div className="relative bg-gradient-to-r from-[#fff8f0] to-[#fffdf9] px-5 sm:px-6 py-5 border-b border-[#f48c25]/25">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#f48c25] to-transparent opacity-70" />
          <div className="flex items-start gap-4">
            <div className="flex shrink-0 flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/uemasul-brasao.png"
                alt="UEMASUL"
                width={52}
                height={52}
                className="h-12 w-auto object-contain opacity-90"
              />
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#92400e]">UEMASUL</span>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f48c25]">
                Verificação de autenticidade
              </p>
              <h1 className="mt-1 text-base sm:text-lg font-bold text-slate-800 leading-snug">
                {CERTIFICATE_PROJECT_SHORT}
              </h1>
              <p className="mt-1.5 text-[11px] sm:text-xs leading-relaxed text-slate-600">
                {CERTIFICATE_PROJECT_TITLE}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-5 sm:px-6 py-7 sm:py-8">
          {result.valid ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
                <ShieldCheck className="h-9 w-9 text-emerald-600" strokeWidth={2.2} />
              </div>
              <h2 className="text-2xl font-bold text-emerald-700">Certificado autêntico</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Este certificado foi emitido oficialmente pela plataforma{' '}
                <strong className="text-slate-800">{CERTIFICATE_PROJECT_SHORT}</strong> e está{' '}
                <strong className="text-emerald-700">válido</strong>.
              </p>

              <div className="mt-6 rounded-xl border border-[#e8c9a0]/60 bg-[#fffdf9] text-left overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[#f48c25]/15 bg-[#fff8f0] px-4 py-2.5">
                  <Award className="h-4 w-4 text-[#f48c25]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#b45309]">
                    Dados do certificado
                  </span>
                </div>
                <div className="px-4 py-4 space-y-4 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Participante
                    </p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">
                      {result.participant.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Projeto
                    </p>
                    <p className="mt-0.5 font-medium text-slate-700 leading-relaxed">
                      {result.program}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ofertado por
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-800">{result.offeredBy}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Coordenação
                      </p>
                      <p className="mt-0.5 text-slate-700">Profa. Iracema Rocha da Silva</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Superintendência
                      </p>
                      <p className="mt-0.5 text-slate-700">Claudio Jhonson pereira Alves</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-4 ring-red-100">
                <ShieldX className="h-9 w-9 text-red-600" strokeWidth={2.2} />
              </div>
              <h2 className="text-2xl font-bold text-red-600">Não autenticado</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">{result.message}</p>
              <p className="mt-4 text-xs text-slate-500">
                Verifique se o QR Code ou o link não foi alterado ou recortado.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 sm:px-6 py-4">
          <p className="text-[11px] text-slate-500">Imperatriz — MA · {CERTIFICATE_PROJECT_SHORT}</p>
          <Link
            href="/"
            className="text-sm font-semibold text-[#f48c25] hover:text-[#c9781a] hover:underline"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
