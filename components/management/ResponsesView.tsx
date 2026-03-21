'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, FileText, Search, Store, X, XCircle } from 'lucide-react';
import type { SurveyResponse } from '@/types/survey';

export type ResponsesViewProps = {
  responses: SurveyResponse[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedResponse: SurveyResponse | null;
  onSelectResponse: (response: SurveyResponse | null) => void;
  onRetry: () => void;
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-slate-900 font-bold">{value || 'Não informado'}</p>
    </div>
  );
}

function DetailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items && items.length > 0 ? (
          items.map((item, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-full text-xs font-bold"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-slate-400 text-sm italic">Nenhum item selecionado</span>
        )}
      </div>
    </div>
  );
}

export default function ResponsesView({
  responses,
  loading,
  error,
  searchTerm,
  onSearchTermChange,
  selectedResponse,
  onSelectResponse,
  onRetry,
}: ResponsesViewProps) {
  const filteredResponses = responses.filter(
    (r) =>
      r.sugestao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.produtos?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total de Respostas</p>
            <p className="text-2xl font-bold">{responses.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {error && (
          <div className="p-6 bg-red-50 border-b border-red-100 text-red-600 flex items-center gap-3">
            <XCircle size={20} />
            <p className="font-medium">{error}</p>
            <button onClick={onRetry} className="ml-auto text-sm underline hover:no-underline">
              Tentar novamente
            </button>
          </div>
        )}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store size={20} className="text-primary" />
            Respostas Detalhadas
          </h2>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por produto ou sugestão..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-full md:w-64"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">1ª Vez?</th>
                <th className="px-6 py-4">Idade</th>
                <th className="px-6 py-4">Tempo</th>
                <th className="px-6 py-4">Renda</th>
                <th className="px-6 py-4">Produtos</th>
                <th className="px-6 py-4">Locais</th>
                <th className="px-6 py-4">Redes?</th>
                <th className="px-6 py-4">Finanças?</th>
                <th className="px-6 py-4">Dificuldades</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={11} className="px-6 py-8">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma resposta encontrada.
                  </td>
                </tr>
              ) : (
                filteredResponses.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(res.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{res.primeira_vez}</td>
                    <td className="px-6 py-4 text-sm font-medium">{res.idade}</td>
                    <td className="px-6 py-4 text-sm">{res.tempo_atuacao}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold uppercase whitespace-nowrap ${
                          res.renda_agricultura === 'SIM'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {res.renda_agricultura}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-[150px] truncate">{res.produtos}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {res.locais_venda?.slice(0, 1).map((l, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold"
                          >
                            {l}
                          </span>
                        ))}
                        {res.locais_venda?.length > 1 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{res.locais_venda.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{res.divulga_redes}</td>
                    <td className="px-6 py-4 text-sm font-medium">{res.controla_financas}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {res.dificuldades?.slice(0, 1).map((d, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold"
                          >
                            {d}
                          </span>
                        ))}
                        {res.dificuldades?.length > 1 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{res.dificuldades.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onSelectResponse(res)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Ver Detalhes"
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedResponse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onSelectResponse(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-primary text-white">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Detalhes da Resposta</h3>
                    <p className="text-white/70 text-sm">
                      Recebida em {new Date(selectedResponse.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onSelectResponse(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem label="Primeira vez na feira?" value={selectedResponse.primeira_vez} />
                  <DetailItem label="Faixa Etária" value={selectedResponse.idade} />
                  <DetailItem label="Tempo de Atuação" value={selectedResponse.tempo_atuacao} />
                  <DetailItem label="Renda vem da agricultura?" value={selectedResponse.renda_agricultura} />
                  <DetailItem label="Produtos que comercializa" value={selectedResponse.produtos} />
                  <DetailItem label="Divulga nas redes sociais?" value={selectedResponse.divulga_redes} />
                  <DetailItem label="Controla as finanças?" value={selectedResponse.controla_financas} />
                  <DetailItem label="Consegue conciliar com a família?" value={selectedResponse.conciliar_familia} />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <DetailList label="Locais de Venda" items={selectedResponse.locais_venda} />
                  <DetailList label="Maiores Dificuldades" items={selectedResponse.dificuldades} />
                  <DetailList label="Temas que gostaria de aprender" items={selectedResponse.temas_aprender} />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Sugestões ou Comentários
                    </p>
                    <p className="text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                      &quot;{selectedResponse.sugestao || 'Nenhuma sugestão enviada.'}&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => onSelectResponse(null)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
