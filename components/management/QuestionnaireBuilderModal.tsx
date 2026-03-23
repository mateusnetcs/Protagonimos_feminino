'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  FileEdit,
  Plus,
  Save,
  Trash2,
  X,
  GripVertical,
} from 'lucide-react';
import type { QuestionnaireConfig, StepConfig, QuestionConfig, QuestionOption } from '@/types/questionnaire';
import EmojiPickerModal from '../EmojiPickerModal';

export type Questionnaire = {
  id: string;
  title: string;
  is_active?: number | boolean;
  config_json?: QuestionnaireConfig | null;
  created_at?: string;
  updated_at?: string;
};

const QUESTION_TYPES = [
  { value: 'radio_binary', label: 'Sim/Não (2 cards)', needOptions: true },
  { value: 'radio_list', label: 'Lista de opções (uma escolha)', needOptions: true },
  { value: 'radio_list_detail', label: 'Lista com descrição e emoji', needOptions: true },
  { value: 'checkbox', label: 'Múltipla escolha', needOptions: true },
  { value: 'textarea', label: 'Texto livre', needOptions: false },
] as const;

const emptyOption = (): QuestionOption => ({ value: '', label: '' });
const emptyQuestion = (): QuestionConfig => ({
  key: '',
  text: '',
  type: 'radio_list',
  options: [emptyOption()],
});
const emptyStep = (): StepConfig => ({
  id: `step_${Date.now()}`,
  title: '',
  questions: [emptyQuestion()],
});

type Props = {
  questionnaire: Questionnaire | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function QuestionnaireBuilderModal({
  questionnaire,
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(questionnaire?.title ?? '');
  const [config, setConfig] = useState<QuestionnaireConfig>(() => {
    const c = questionnaire?.config_json;
    if (c && c.steps?.length) return c;
    return {
      headerTitle: '',
      headerBadge: '',
      headerImage: '',
      steps: [emptyStep()],
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedStep, setExpandedStep] = useState<number>(0);
  const [emojiPickerFor, setEmojiPickerFor] = useState<{
    stepIdx: number;
    qIdx: number;
    optIdx: number;
  } | null>(null);

  useEffect(() => {
    setTitle(questionnaire?.title ?? '');
    const c = questionnaire?.config_json;
    if (c && c.steps?.length) {
      setConfig(c);
    } else {
      setConfig({
        headerTitle: '',
        headerBadge: '',
        headerImage: '',
        steps: [emptyStep()],
      });
    }
    setError('');
  }, [questionnaire]);

  const ensureUniqueKey = (base: string, exclude: string[]): string => {
    let key = base.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!key) key = 'pergunta';
    let i = 1;
    let final = key;
    while (exclude.includes(final)) {
      final = `${key}_${i++}`;
    }
    return final;
  };

  const updateStep = (idx: number, upd: Partial<StepConfig>) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === idx ? { ...s, ...upd } : s)),
    }));
  };

  const addStep = () => {
    setConfig((prev) => ({
      ...prev,
      steps: [...prev.steps, emptyStep()],
    }));
    setExpandedStep(config.steps.length);
  };

  const removeStep = (idx: number) => {
    if (config.steps.length <= 1) return;
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx),
    }));
    setExpandedStep(Math.max(0, expandedStep - 1));
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const n = config.steps.length;
    const next = idx + dir;
    if (next < 0 || next >= n) return;
    const steps = [...config.steps];
    [steps[idx], steps[next]] = [steps[next], steps[idx]];
    setConfig((prev) => ({ ...prev, steps }));
    setExpandedStep(next);
  };

  const updateQuestion = (stepIdx: number, qIdx: number, upd: Partial<QuestionConfig>) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((s, si) => {
        if (si !== stepIdx) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) =>
            qi === qIdx ? { ...q, ...upd } : q
          ),
        };
      }),
    }));
  };

  const addQuestion = (stepIdx: number) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => {
        if (i !== stepIdx) return s;
        const keys = s.questions.map((q) => q.key).filter(Boolean);
        const q = emptyQuestion();
        q.key = ensureUniqueKey('nova_pergunta', keys);
        return { ...s, questions: [...s.questions, q] };
      }),
    }));
  };

  const removeQuestion = (stepIdx: number, qIdx: number) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => {
        if (i !== stepIdx) return s;
        if (s.questions.length <= 1) return s;
        return { ...s, questions: s.questions.filter((_, qi) => qi !== qIdx) };
      }),
    }));
  };

  const updateOption = (
    stepIdx: number,
    qIdx: number,
    optIdx: number,
    upd: Partial<QuestionOption>
  ) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((s, si) => {
        if (si !== stepIdx) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) => {
            if (qi !== qIdx || !q.options) return q;
            const opts = q.options.map((o, oi) =>
              oi === optIdx ? { ...o, ...upd } : o
            );
            return { ...q, options: opts };
          }),
        };
      }),
    }));
  };

  const addOption = (stepIdx: number, qIdx: number) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => {
        if (i !== stepIdx) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) => {
            if (qi !== qIdx) return q;
            const opts = q.options ?? [];
            const vals = opts.map((o) => o.value);
            const newOpt = emptyOption();
            newOpt.value = ensureUniqueKey('opcao', vals);
            newOpt.label = 'Nova opção';
            return { ...q, options: [...opts, newOpt] };
          }),
        };
      }),
    }));
  };

  const removeOption = (stepIdx: number, qIdx: number, optIdx: number) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((s, si) => {
        if (si !== stepIdx) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) => {
            if (qi !== qIdx || !q.options) return q;
            if (q.options.length <= 1) return q;
            return { ...q, options: q.options.filter((_, oi) => oi !== optIdx) };
          }),
        };
      }),
    }));
  };

  const syncKeyFromText = (stepIdx: number, qIdx: number, text: string) => {
    const step = config.steps[stepIdx];
    const q = step.questions[qIdx];
    if (!q.key || q.key.startsWith('pergunta') || q.key.startsWith('nova')) {
      const others = config.steps.flatMap((s, si) =>
        s.questions.map((x, qi) => (si === stepIdx && qi === qIdx ? null : x.key))
      ).filter((k): k is string => Boolean(k));
      const key = ensureUniqueKey(text || 'pergunta', others);
      updateQuestion(stepIdx, qIdx, { key, text });
    } else {
      updateQuestion(stepIdx, qIdx, { text });
    }
  };

  const handleSave = async () => {
    if (!questionnaire?.id) return;
    const t = title.trim();
    if (!t) {
      setError('Informe o título do questionário.');
      return;
    }
    const validSteps = config.steps.filter(
      (s) => s.title?.trim() && s.questions.some((q) => q.text?.trim())
    );
    if (validSteps.length === 0) {
      setError('Adicione pelo menos um passo com perguntas.');
      return;
    }
    const cleanedConfig: QuestionnaireConfig = {
      ...config,
      headerTitle: config.headerTitle?.trim() || undefined,
      headerBadge: config.headerBadge?.trim() || undefined,
      headerImage: config.headerImage?.trim() || undefined,
      steps: validSteps.map((s) => ({
        ...s,
        id: s.id || `step_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        title: s.title.trim(),
        subtitle: s.subtitle?.trim() || undefined,
        questions: s.questions
          .filter((q) => q.text?.trim())
          .map((q) => {
            const needOpts = QUESTION_TYPES.find((x) => x.value === q.type)?.needOptions;
            let opts = q.options;
            if (needOpts && opts?.length) {
              opts = opts
                .filter((o) => o.value?.trim() || o.label?.trim())
                .map((o) => ({
                  value: (o.value || o.label || '').trim() || 'opcao',
                  label: (o.label || o.value || '').trim() || 'Opção',
                  emoji: o.emoji?.trim() || undefined,
                  description: o.description?.trim() || undefined,
                }));
            }
            return {
              ...q,
              key: (q.key || ensureUniqueKey(q.text, [])).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'q',
              text: q.text.trim(),
              options: needOpts ? opts : undefined,
              placeholder: q.placeholder?.trim() || undefined,
            };
          })
          .filter((q) => q.key),
      })),
    };

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/questionnaires/${questionnaire.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: t, config_json: cleanedConfig }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? 'Erro ao salvar');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <FileEdit size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Editar questionário</h3>
              <p className="text-sm text-slate-500">Configure título, passos e perguntas</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Título do questionário</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ex: Questionário Inicial"
            />
          </div>

          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="font-bold text-slate-800">Cabeçalho (primeiro passo)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
                <input
                  type="text"
                  value={config.headerTitle ?? ''}
                  onChange={(e) => setConfig((c) => ({ ...c, headerTitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  placeholder="Ex: Perfil de Mulheres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Badge</label>
                <input
                  type="text"
                  value={config.headerBadge ?? ''}
                  onChange={(e) => setConfig((c) => ({ ...c, headerBadge: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  placeholder="Ex: BEM-VINDA!"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">URL da imagem de fundo</label>
              <input
                type="text"
                value={config.headerImage ?? ''}
                onChange={(e) => setConfig((c) => ({ ...c, headerImage: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800">Passos e perguntas</h4>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5"
              >
                <Plus size={18} />
                Novo passo
              </button>
            </div>

            {config.steps.map((step, stepIdx) => (
              <div
                key={step.id || stepIdx}
                className="border border-slate-200 rounded-xl mb-4 overflow-hidden"
              >
                <div
                  className="flex items-center gap-2 p-4 bg-slate-50 cursor-pointer"
                  onClick={() => setExpandedStep(expandedStep === stepIdx ? -1 : stepIdx)}
                >
                  <GripVertical size={18} className="text-slate-400" />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Passo {stepIdx + 1}: {step.title || '(sem título)'}
                    </span>
                    <span className="text-slate-500 text-sm">
                      ({step.questions?.length ?? 0} pergunta(s))
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveStep(stepIdx, -1); }}
                      disabled={stepIdx === 0}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveStep(stepIdx, 1); }}
                      disabled={stepIdx === config.steps.length - 1}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                    >
                      <ChevronDown size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeStep(stepIdx); }}
                      disabled={config.steps.length <= 1}
                      className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {expandedStep === stepIdx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {expandedStep === stepIdx && (
                  <div className="p-4 space-y-6 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Título do passo</label>
                      <input
                        type="text"
                        value={step.title ?? ''}
                        onChange={(e) => updateStep(stepIdx, { title: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200"
                        placeholder="Ex: Feirinha da Prefs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Subtítulo (opcional)</label>
                      <input
                        type="text"
                        value={step.subtitle ?? ''}
                        onChange={(e) => updateStep(stepIdx, { subtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200"
                        placeholder="Ex: Progresso"
                      />
                    </div>

                    {step.questions?.map((q, qIdx) => {
                      const typeInfo = QUESTION_TYPES.find((x) => x.value === q.type);
                      return (
                        <div
                          key={qIdx}
                          className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Pergunta {qIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeQuestion(stepIdx, qIdx)}
                              disabled={(step.questions?.length ?? 0) <= 1}
                              className="p-1 rounded hover:bg-red-100 text-red-600 text-xs disabled:opacity-30"
                            >
                              Remover
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Texto da pergunta</label>
                            <input
                              type="text"
                              value={q.text ?? ''}
                              onChange={(e) => syncKeyFromText(stepIdx, qIdx, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200"
                              placeholder="Ex: Esta é a primeira vez que participa?"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                            <select
                              value={q.type ?? 'radio_list'}
                              onChange={(e) => {
                                const v = e.target.value as QuestionConfig['type'];
                                const needOpts = QUESTION_TYPES.find((x) => x.value === v)?.needOptions;
                                updateQuestion(stepIdx, qIdx, {
                                  type: v,
                                  options: needOpts ? (q.options?.length ? q.options : [emptyOption()]) : undefined,
                                });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200"
                            >
                              {QUESTION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>

                          {q.type === 'textarea' && (
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Placeholder</label>
                              <input
                                type="text"
                                value={q.placeholder ?? ''}
                                onChange={(e) => updateQuestion(stepIdx, qIdx, { placeholder: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                placeholder="Ex: Deixe sua opinião..."
                              />
                            </div>
                          )}

                          {typeInfo?.needOptions && q.options && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-slate-500">Opções de resposta</label>
                                <button
                                  type="button"
                                  onClick={() => addOption(stepIdx, qIdx)}
                                  className="text-xs text-primary font-medium hover:underline"
                                >
                                  + Opção
                                </button>
                              </div>
                              <div className="space-y-2">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2 items-center flex-wrap">
                                    {(q.type === 'radio_list_detail' || q.type === 'checkbox') && (
                                      <div className="flex flex-col">
                                        <label className="text-[10px] font-medium text-slate-500 mb-0.5">Emoji</label>
                                        <button
                                          type="button"
                                          onClick={() => setEmojiPickerFor({ stepIdx, qIdx, optIdx })}
                                          className="w-14 h-12 flex items-center justify-center rounded-lg border-2 border-slate-200 hover:border-primary/50 hover:bg-slate-50 text-2xl transition-colors"
                                          title="Clique para escolher um emoji"
                                        >
                                          {opt.emoji || '😀'}
                                        </button>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-[120px] flex flex-col">
                                      <label className="text-[10px] font-medium text-slate-500 mb-0.5">Valor</label>
                                      <input
                                        type="text"
                                        value={opt.value ?? ''}
                                        onChange={(e) => updateOption(stepIdx, qIdx, optIdx, { value: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        placeholder="ex: Feirinha local"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-[120px] flex flex-col">
                                      <label className="text-[10px] font-medium text-slate-500 mb-0.5">Texto exibido</label>
                                      <input
                                        type="text"
                                        value={opt.label ?? ''}
                                        onChange={(e) => updateOption(stepIdx, qIdx, optIdx, { label: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        placeholder="ex: Feirinha local"
                                      />
                                    </div>
                                    {q.type === 'radio_list_detail' && (
                                      <div className="flex-1 min-w-[120px] flex flex-col">
                                        <label className="text-[10px] font-medium text-slate-500 mb-0.5">Descrição</label>
                                        <input
                                          type="text"
                                          value={opt.description ?? ''}
                                          onChange={(e) => updateOption(stepIdx, qIdx, optIdx, { description: e.target.value })}
                                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                          placeholder="ex: Iniciando agora!"
                                        />
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeOption(stepIdx, qIdx, optIdx)}
                                      disabled={(q.options?.length ?? 0) <= 1}
                                      className="p-1.5 rounded hover:bg-red-100 text-red-600 disabled:opacity-30"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => addQuestion(stepIdx)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:border-primary hover:text-primary text-sm"
                    >
                      <Plus size={18} />
                      Nova pergunta
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {emojiPickerFor && (
          <EmojiPickerModal
            currentEmoji={
              config.steps[emojiPickerFor.stepIdx]?.questions[emojiPickerFor.qIdx]?.options?.[
                emojiPickerFor.optIdx
              ]?.emoji
            }
            onSelect={(emoji) => {
              updateOption(emojiPickerFor.stepIdx, emojiPickerFor.qIdx, emojiPickerFor.optIdx, {
                emoji,
              });
              setEmojiPickerFor(null);
            }}
            onClose={() => setEmojiPickerFor(null)}
          />
        )}

        <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-70 transition-colors"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
