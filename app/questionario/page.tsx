'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SurveyApp from '@/components/SurveyApp';
import SurveyAppDynamic from '@/components/SurveyAppDynamic';
import { DEFAULT_QUESTIONNAIRE_CONFIG } from '@/lib/default-questionnaire-config';
import type { QuestionnaireConfig } from '@/types/questionnaire';

function QuestionarioContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const questionnaireId = idParam || '1';
  const [config, setConfig] = useState<QuestionnaireConfig | null | 'loading'>('loading');

  useEffect(() => {
    if (!questionnaireId) {
      setConfig(DEFAULT_QUESTIONNAIRE_CONFIG);
      return;
    }
    fetch(`/api/questionnaires/${questionnaireId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const cfg = data?.config_json;
        if (cfg && cfg.steps?.length) {
          setConfig(cfg);
        } else if (questionnaireId === '1') {
          setConfig(DEFAULT_QUESTIONNAIRE_CONFIG);
        } else {
          setConfig(cfg || { steps: [] });
        }
      })
      .catch(() => setConfig(questionnaireId === '1' ? DEFAULT_QUESTIONNAIRE_CONFIG : { steps: [] }));
  }, [questionnaireId]);

  const onBack = () => {
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  if (config === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <p className="text-slate-500">Carregando questionário...</p>
      </div>
    );
  }

  if (config && config.steps?.length) {
    return (
      <SurveyAppDynamic
        config={config}
        questionnaireId={questionnaireId}
        onBackToLanding={onBack}
      />
    );
  }

  if (questionnaireId === '1') {
    return <SurveyApp questionnaireId="1" onBackToLanding={onBack} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light p-6">
      <p className="text-slate-600 text-center mb-4">
        Este questionário ainda não tem perguntas configuradas.
      </p>
      <button
        onClick={onBack}
        className="bg-primary text-white px-6 py-3 rounded-xl font-bold"
      >
        Voltar ao início
      </button>
    </div>
  );
}

export default function QuestionarioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <QuestionarioContent />
    </Suspense>
  );
}
