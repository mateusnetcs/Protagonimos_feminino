'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, FileText, ExternalLink, Link2, Search, Store, X, XCircle, FileEdit, Plus } from 'lucide-react';
import type { SurveyResponse } from '@/types/survey';
import QuestionnaireBuilderModal, { type Questionnaire } from './QuestionnaireBuilderModal';

export type ResponsesViewProps = {
  responses: SurveyResponse[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedResponse: SurveyResponse | null;
  onSelectResponse: (response: SurveyResponse | null) => void;
  onRetry: () => void;
  showCreateQuestionnaire?: boolean;
  selectedQuestionnaireId?: string;
  onQuestionnaireChange?: (id: string) => void;
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
  showCreateQuestionnaire = false,
  selectedQuestionnaireId = '',
  onQuestionnaireChange,
}: ResponsesViewProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [creatingQuestionnaire, setCreatingQuestionnaire] = useState(false);

  const selectedQuestionnaire = questionnaires.find((q) => q.id === selectedQuestionnaireId) ?? questionnaires[0];
  const surveyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/questionario${selectedQuestionnaire?.id ? `?id=${selectedQuestionnaire.id}` : ''}`
    : '';

  useEffect(() => {
    fetch('/api/questionnaires', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setQuestionnaires(list);
      })
      .catch(() => setQuestionnaires([]));
  }, []);

  const fetchQuestionnaires = () => {
    fetch('/api/questionnaires', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setQuestionnaires(list);
      })
      .catch(() => setQuestionnaires([]));
  };

  const handleCreateQuestionnaire = async () => {
    setCreatingQuestionnaire(true);
    try {
      const res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Novo questionário' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Erro ao criar');
      fetchQuestionnaires();
      if (data.id) {
        onQuestionnaireChange?.(String(data.id));
        setEditingQuestionnaire({ id: data.id, title: 'Novo questionário' });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar questionário.');
    } finally {
      setCreatingQuestionnaire(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      alert('Não foi possível copiar o link.');
    }
  };

  const filteredResponses = !searchTerm.trim()
    ? responses
    : responses.filter((r) => {
        const term = searchTerm.toLowerCase();
        const sugestao = r.sugestao?.toLowerCase() ?? '';
        const produtos = r.produtos?.toLowerCase() ?? '';
        const answersStr = r.answers_json
          ? Object.values(r.answers_json)
              .map((v) => (Array.isArray(v) ? v.join(' ') : String(v ?? '')))
              .join(' ')
              .toLowerCase()
          : '';
        return sugestao.includes(term) || produtos.includes(term) || answersStr.includes(term);
      });

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
          <div className="flex flex-wrap items-center gap-2">
            {showCreateQuestionnaire && (
              <>
                <select
                  value={selectedQuestionnaireId}
                  onChange={(e) => onQuestionnaireChange?.(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">Todas as respostas</option>
                  {questionnaires.map((q) => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCreateQuestionnaire}
                  disabled={creatingQuestionnaire}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm disabled:opacity-70"
                >
                  <Plus size={18} />
                  Novo questionário
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedQuestionnaire) return;
                    try {
                      const r = await fetch(`/api/questionnaires/${selectedQuestionnaire.id}`, { credentials: 'include' });
                      const data = r.ok ? await r.json() : selectedQuestionnaire;
                      setEditingQuestionnaire({ ...selectedQuestionnaire, ...data });
                    } catch {
                      setEditingQuestionnaire(selectedQuestionnaire);
                    }
                  }}
                  disabled={!selectedQuestionnaire}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
                >
                  <FileEdit size={18} />
                  Editar
                </button>
                <a
                  href={surveyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm"
                >
                  <ExternalLink size={18} />
                  Abrir questionário
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors text-sm border ${
                    linkCopied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Link2 size={18} />
                  {linkCopied ? 'Link copiado!' : 'Copiar link'}
                </button>
              </>
            )}
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
                    <td className="px-6 py-4 text-sm font-medium">{res.answers_json?.['primeira_vez'] ?? res.primeira_vez ?? '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium">{res.answers_json?.['idade'] ?? res.idade ?? '-'}</td>
                    <td className="px-6 py-4 text-sm">{res.answers_json?.['tempo_atuacao'] ?? res.tempo_atuacao ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold uppercase whitespace-nowrap ${
                          (res.answers_json?.['renda_agricultura'] ?? res.renda_agricultura) === 'SIM'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {res.answers_json?.['renda_agricultura'] ?? res.renda_agricultura ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-[150px] truncate">{res.answers_json?.['produtos'] ?? res.produtos ?? '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {((res.answers_json?.['locais_venda'] as string[] | undefined) ?? res.locais_venda ?? [])?.slice(0, 1).map((l, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold"
                          >
                            {l}
                          </span>
                        ))}
                        {((res.answers_json?.['locais_venda'] as string[] | undefined) ?? res.locais_venda ?? []).length > 1 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{((res.answers_json?.['locais_venda'] as string[] | undefined) ?? res.locais_venda ?? []).length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{res.answers_json?.['divulga_redes'] ?? res.divulga_redes ?? '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium">{res.answers_json?.['controla_financas'] ?? res.controla_financas ?? '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {((res.answers_json?.['dificuldades'] as string[] | undefined) ?? res.dificuldades ?? [])?.slice(0, 1).map((d, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold"
                          >
                            {d}
                          </span>
                        ))}
                        {((res.answers_json?.['dificuldades'] as string[] | undefined) ?? res.dificuldades ?? []).length > 1 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{((res.answers_json?.['dificuldades'] as string[] | undefined) ?? res.dificuldades ?? []).length - 1}
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
                {selectedResponse.answers_json && Object.keys(selectedResponse.answers_json).length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Respostas</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedResponse.answers_json).map(([key, val]) => (
                        <DetailItem
                          key={key}
                          label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          value={Array.isArray(val) ? val.join(', ') : String(val ?? '')}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
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
                      <DetailList label="Locais de Venda" items={selectedResponse.locais_venda ?? []} />
                      <DetailList label="Maiores Dificuldades" items={selectedResponse.dificuldades ?? []} />
                      <DetailList label="Temas que gostaria de aprender" items={selectedResponse.temas_aprender ?? []} />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          Sugestões ou Comentários
                        </p>
                        <p className="text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                          &quot;{selectedResponse.sugestao || 'Nenhuma sugestão enviada.'}&quot;
                        </p>
                      </div>
                    </div>
                  </>
                )}
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

      {editingQuestionnaire && (
        <QuestionnaireBuilderModal
          questionnaire={editingQuestionnaire}
          onClose={() => setEditingQuestionnaire(null)}
          onSaved={() => {
            fetchQuestionnaires();
            setEditingQuestionnaire(null);
            onRetry();
          }}
        />
      )}
    </>
  );
}
