'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X, CheckCircle2, XCircle } from 'lucide-react';
import type { QuestionnaireConfig, QuestionConfig } from '@/types/questionnaire';

type SurveyAppDynamicProps = {
  config: QuestionnaireConfig;
  questionnaireId: string;
  onBackToLanding: () => void;
};

export default function SurveyAppDynamic({
  config,
  questionnaireId,
  onBackToLanding,
}: SurveyAppDynamicProps) {
  const steps = config.steps ?? [];
  const totalSteps = steps.length;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: string, value: string) => {
    setAnswers((prev) => {
      const arr = (prev[key] as string[]) ?? [];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter((i) => i !== value) };
      }
      return { ...prev, [key]: [...arr, value] };
    });
  };

  const nextStep = async () => {
    if (step === totalSteps) {
      await submitForm();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionnaire_id: questionnaireId,
          answers_json: answers,
        }),
      });
      if (!res.ok) throw new Error('Erro');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep(totalSteps + 1);
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step === 1) {
      onBackToLanding();
    } else {
      setStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const resetForm = () => {
    setAnswers({});
    setStep(1);
    onBackToLanding();
  };

  const currentStepConfig = steps[step - 1];
  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  const Header = ({ title, showBack = true }: { title: string; showBack?: boolean }) => (
    <div className="flex items-center p-4 pb-2 justify-between">
      {showBack ? (
        <button
          onClick={prevStep}
          className="text-slate-900 flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
      ) : (
        <div className="text-slate-900 flex size-12 shrink-0 items-center justify-center">
          {step === 1 && <X size={24} onClick={onBackToLanding} className="cursor-pointer" />}
        </div>
      )}
      <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">
        {title}
      </h2>
    </div>
  );

  const ProgressBar = ({
    title,
    subtitle,
    progress: pct,
  }: {
    title: string;
    subtitle?: string;
    progress: number;
  }) => (
    <div className="flex flex-col gap-3 p-6 pt-2">
      <div className="flex gap-6 justify-between items-end">
        <div>
          {subtitle && (
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">{subtitle}</p>
          )}
          <p className="text-slate-900 text-lg font-bold leading-none">{title}</p>
        </div>
        <p className="text-primary text-sm font-bold leading-normal">{Math.round(pct)}%</p>
      </div>
      <div className="rounded-full bg-primary/10 h-3 w-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );

  const renderQuestion = (q: QuestionConfig) => {
    const value = answers[q.key];
    const isArrayField = q.type === 'checkbox';

    if (q.type === 'radio_binary' && q.options?.length === 2) {
      const [opt1, opt2] = q.options;
      const isPos1 = opt1.value.toUpperCase() === 'SIM';
      const isPos2 = opt2.value.toUpperCase() === 'SIM';
      return (
        <div key={q.key} className="mb-8">
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-5">{q.text}</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleChange(q.key, opt1.value)}
              className={`flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl p-6 transition-all active:scale-95 border-2 
                ${value === opt1.value && isPos1 ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : ''}
                ${value === opt1.value && !isPos1 ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : ''}
                ${value !== opt1.value ? 'bg-slate-100 text-slate-900 border-transparent hover:border-primary/30' : ''}
              `}
            >
              <CheckCircle2 size={36} className={value === opt1.value ? 'text-white' : 'text-slate-400'} />
              <span className="font-bold text-lg">{opt1.label}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-2 
                  ${value === opt1.value ? 'border-white' : 'border-slate-300'}`}
              >
                {value === opt1.value && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
            </button>
            <button
              onClick={() => handleChange(q.key, opt2.value)}
              className={`flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl p-6 transition-all active:scale-95 border-2 
                ${value === opt2.value && isPos2 ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : ''}
                ${value === opt2.value && !isPos2 ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : ''}
                ${value !== opt2.value ? 'bg-slate-100 text-slate-900 border-transparent hover:border-primary/30' : ''}
              `}
            >
              <XCircle size={36} className={value === opt2.value ? 'text-white' : 'text-slate-400'} />
              <span className="font-bold text-lg">{opt2.label}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-2 
                  ${value === opt2.value ? 'border-white' : 'border-slate-300'}`}
              >
                {value === opt2.value && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
            </button>
          </div>
        </div>
      );
    }

    if (q.type === 'radio_list' && q.options?.length) {
      return (
        <div key={q.key} className="mb-8">
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-5">{q.text}</h2>
          <div className="flex flex-col gap-3">
            {q.options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChange(q.key, opt.value)}
                  className={`flex items-center justify-between w-full p-4 rounded-xl border-2 text-left transition-all group
                    ${isSelected ? 'bg-primary/10 border-primary/50 text-slate-900 shadow-sm' : 'bg-transparent border-slate-200 text-slate-700 hover:bg-slate-50'}
                  `}
                >
                  <span className="font-bold text-base">{opt.label}</span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 
                      ${isSelected ? 'border-primary bg-primary' : 'border-slate-300 group-hover:border-primary/50'}`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (q.type === 'radio_list_detail' && q.options?.length) {
      return (
        <div key={q.key} className="mb-8">
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-5">{q.text}</h2>
          <div className="flex flex-col gap-3">
            {q.options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <label key={opt.value} className="relative cursor-pointer block">
                  <div
                    onClick={() => handleChange(q.key, opt.value)}
                    className={`flex items-center justify-between gap-4 rounded-xl border-2 p-4 transition-all 
                      ${isSelected ? 'border-primary bg-primary/10' : 'border-slate-200 hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg text-2xl shadow-sm">
                        {opt.emoji ?? ''}
                      </div>
                      <div className="flex flex-col text-left">
                        <p className="text-slate-900 text-base font-bold">{opt.label}</p>
                        {opt.description && (
                          <p className="text-slate-500 text-sm font-medium">{opt.description}</p>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 
                        ${isSelected ? 'border-primary bg-primary' : 'border-slate-300'}`}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    if (q.type === 'checkbox' && q.options?.length) {
      const arr = (value as string[]) ?? [];
      return (
        <div key={q.key} className="mb-8">
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-2">{q.text}</h2>
          <p className="text-sm font-medium text-slate-500 mb-5">Pode escolher mais de uma opção.</p>
          <div className="flex flex-col gap-3">
            {q.options.map((opt) => {
              const isSelected = arr.includes(opt.value);
              return (
                <label key={opt.value} className="relative cursor-pointer block">
                  <div
                    onClick={() => toggleArrayItem(q.key, opt.value)}
                    className={`flex items-center justify-between gap-4 rounded-xl border-2 p-4 transition-all 
                      ${isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-slate-200 hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      {opt.emoji && <span className="text-2xl w-8 text-center">{opt.emoji}</span>}
                      <span className="text-slate-900 text-base font-bold">{opt.label}</span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                        ${isSelected ? 'border-primary bg-primary' : 'border-slate-300'}`}
                    >
                      {isSelected && <Check size={16} strokeWidth={3} className="text-white" />}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    if (q.type === 'textarea') {
      return (
        <div key={q.key} className="mb-8">
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-3">{q.text}</h2>
          <textarea
            rows={4}
            className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-base bg-slate-50 outline-none"
            placeholder={q.placeholder ?? ''}
            value={(value as string) ?? ''}
            onChange={(e) => handleChange(q.key, e.target.value)}
          />
        </div>
      );
    }

    return null;
  };

  const renderStepContent = () => {
    if (!currentStepConfig) return null;
    return (
      <div className="pb-28 animate-fade-in">
        <Header title={currentStepConfig.title} showBack={step > 1} />
        {step === 1 && config.headerImage && (
          <div className="px-4 py-2">
            <div
              className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-2xl min-h-[220px] relative shadow-md"
              style={{
                backgroundImage: `linear-gradient(0deg, rgba(34,25,16,0.8) 0%, rgba(34,25,16,0.2) 60%), url("${config.headerImage}")`,
              }}
            >
              <div className="flex p-6 flex-col relative z-10">
                {config.headerBadge && (
                  <span className="bg-primary text-white text-[10px] tracking-wider font-extrabold px-3 py-1.5 rounded-full w-fit mb-3">
                    {config.headerBadge}
                  </span>
                )}
                {config.headerTitle && (
                  <p className="text-white tracking-tight text-3xl font-extrabold leading-tight">
                    {config.headerTitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <ProgressBar
          title={`Passo ${step} de ${totalSteps}`}
          subtitle={currentStepConfig.subtitle ?? 'Progresso'}
          progress={progress}
        />
        <div className="px-6 py-4 space-y-4">
          {currentStepConfig.questions.map((q) => renderQuestion(q))}
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-fade-in">
      <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-8">
        <Check size={48} strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-4">Respostas Enviadas!</h2>
      <p className="text-slate-600 text-lg mb-10">
        Obrigada por participar e contribuir para a inovação em Imperatriz. Sua voz é fundamental!
      </p>
      <button
        onClick={resetForm}
        className="bg-primary text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-95"
      >
        Voltar ao Início
      </button>
    </div>
  );

  if (totalSteps === 0) {
    return (
      <div className="w-full max-w-md bg-background-light min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-500">Este questionário ainda não tem perguntas configuradas.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-background-light relative shadow-2xl min-h-screen flex flex-col overflow-x-hidden mx-auto">
      <div className="flex-1">
        {step <= totalSteps ? renderStepContent() : renderSuccess()}
      </div>
      {step >= 1 && step <= totalSteps && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-between items-center z-50">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="p-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          ) : (
            <button
              onClick={onBackToLanding}
              className="p-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={isSubmitting}
            className="bg-primary hover:bg-orange-600 text-white px-8 py-4 rounded-full font-extrabold text-lg shadow-lg shadow-primary/40 flex items-center gap-2 flex-1 justify-center ml-4 active:scale-95 transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Enviando...'
              : step === totalSteps
              ? 'Enviar Formulário'
              : 'Próximo Passo'}
            {!isSubmitting && <ArrowRight size={22} strokeWidth={3} />}
          </button>
        </div>
      )}
    </div>
  );
}
