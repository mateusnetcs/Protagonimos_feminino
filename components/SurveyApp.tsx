'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  DollarSign,
  Store,
  Target,
  X,
  XCircle,
} from 'lucide-react';

type SurveyAppProps = {
  onBackToLanding: () => void;
  questionnaireId?: string;
};

export default function SurveyApp({ onBackToLanding, questionnaireId }: SurveyAppProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState({
    primeiraVez: '',
    idade: '',
    tempoAtuacao: '',
    rendaAgricultura: '',
    produtos: '',
    locaisVenda: [] as string[],
    divulgaRedes: '',
    controlaFinancas: '',
    dificuldades: [] as string[],
    conciliarFamilia: '',
    temasAprender: [] as string[],
    sugestao: '',
  });

  const totalSteps = 6;

  const handleChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (
    field: 'locaisVenda' | 'dificuldades' | 'temasAprender',
    value: string,
  ) => {
    setAnswers((prev) => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter((i) => i !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  const nextStep = async () => {
    if (step === 5) {
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
          primeira_vez: answers.primeiraVez,
          idade: answers.idade,
          tempo_atuacao: answers.tempoAtuacao,
          renda_agricultura: answers.rendaAgricultura,
          produtos: answers.produtos,
          locais_venda: answers.locaisVenda,
          divulga_redes: answers.divulgaRedes,
          controla_financas: answers.controlaFinancas,
          dificuldades: answers.dificuldades,
          conciliar_familia: answers.conciliarFamilia,
          temas_aprender: answers.temasAprender,
          sugestao: answers.sugestao,
          ...(questionnaireId && { questionnaire_id: questionnaireId }),
        }),
      });
      if (!res.ok) throw new Error('Erro');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep(6);
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
    setAnswers({
      primeiraVez: '',
      idade: '',
      tempoAtuacao: '',
      rendaAgricultura: '',
      produtos: '',
      locaisVenda: [],
      divulgaRedes: '',
      controlaFinancas: '',
      dificuldades: [],
      conciliarFamilia: '',
      temasAprender: [],
      sugestao: '',
    });
    setStep(1);
    onBackToLanding();
  };

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
          {step === 1 && (
            <X
              size={24}
              onClick={onBackToLanding}
              className="cursor-pointer"
            />
          )}
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
    progress,
  }: {
    title: string;
    subtitle?: string;
    progress: number;
  }) => (
    <div className="flex flex-col gap-3 p-6 pt-2">
      <div className="flex gap-6 justify-between items-end">
        <div>
          {subtitle && (
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">
              {subtitle}
            </p>
          )}
          <p className="text-slate-900 text-lg font-bold leading-none">{title}</p>
        </div>
        <p className="text-primary text-sm font-bold leading-normal">
          {Math.round(progress)}%
        </p>
      </div>
      <div className="rounded-full bg-primary/10 h-3 w-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-3 mb-5 px-6">
      <span className="p-2 bg-primary/20 text-primary rounded-lg">
        <Icon size={24} strokeWidth={2.5} />
      </span>
      <h3 className="text-slate-900 tracking-tight text-xl font-extrabold leading-tight uppercase">
        {title}
      </h3>
    </div>
  );

  const GridRadio = ({
    field,
    value,
    label,
    icon: Icon,
    isPositive,
  }: {
    field: keyof typeof answers;
    value: string;
    label: string;
    icon: any;
    isPositive: boolean;
  }) => {
    const isSelected = answers[field] === value;
    return (
      <button
        onClick={() => handleChange(field as string, value)}
        className={`flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl p-6 transition-all active:scale-95 border-2 
          ${isSelected && isPositive ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : ''}
          ${isSelected && !isPositive ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : ''}
          ${!isSelected ? 'bg-slate-100 text-slate-900 border-transparent hover:border-primary/30' : ''}
        `}
      >
        {Icon ? (
          <Icon
            size={36}
            className={isSelected ? 'text-white' : 'text-slate-400'}
          />
        ) : null}
        <span className="font-bold text-lg">{label}</span>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-2 
          ${isSelected ? 'border-white' : 'border-slate-300'}`}
        >
          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
        </div>
      </button>
    );
  };

  const ListRadio = ({
    field,
    value,
    label,
    description,
    emoji,
  }: {
    field: keyof typeof answers;
    value: string;
    label: string;
    description?: string;
    emoji: string;
  }) => {
    const isSelected = answers[field] === value;
    return (
      <label className="relative cursor-pointer block">
        <div
          onClick={() => handleChange(field as string, value)}
          className={`flex items-center justify-between gap-4 rounded-xl border-2 p-4 transition-all 
          ${isSelected ? 'border-primary bg-primary/10' : 'border-slate-200 hover:border-primary/50'}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg text-2xl shadow-sm">
              {emoji}
            </div>
            <div className="flex flex-col text-left">
              <p className="text-slate-900 text-base font-bold">{label}</p>
              {description && (
                <p className="text-slate-500 text-sm font-medium">{description}</p>
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
  };

  const TagRadio = ({
    field,
    value,
    label,
  }: {
    field: keyof typeof answers;
    value: string;
    label: string;
  }) => {
    const isSelected = answers[field] === value;
    return (
      <button
        onClick={() => handleChange(field as string, value)}
        className={`flex items-center justify-between w-full p-4 rounded-xl border-2 text-left transition-all group
          ${isSelected ? 'bg-primary/10 border-primary/50 text-slate-900 shadow-sm' : 'bg-transparent border-slate-200 text-slate-700 hover:bg-slate-50'}
        `}
      >
        <span className="font-bold text-base">{label}</span>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 
            ${isSelected ? 'border-primary bg-primary' : 'border-slate-300 group-hover:border-primary/50'}`}
        >
          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      </button>
    );
  };

  const ListCheckbox = ({
    field,
    value,
    label,
    emoji,
  }: {
    field: 'locaisVenda' | 'dificuldades' | 'temasAprender';
    value: string;
    label: string;
    emoji?: string;
  }) => {
    const isSelected = (answers[field] as string[]).includes(value);
    return (
      <label className="relative cursor-pointer block">
        <div
          onClick={() => toggleArrayItem(field, value)}
          className={`flex items-center justify-between gap-4 rounded-xl border-2 p-4 transition-all 
          ${isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-slate-200 hover:border-primary/50'}`}
        >
          <div className="flex items-center gap-3">
            {emoji && <span className="text-2xl w-8 text-center">{emoji}</span>}
            <span className="text-slate-900 text-base font-bold">{label}</span>
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
  };

  const renderStep1 = () => (
    <div className="pb-28 animate-fade-in">
      <Header title="Feirinha da Prefs" showBack={false} />
      <div className="px-4 py-2">
        <div
          className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-2xl min-h-[220px] relative shadow-md"
          style={{
            backgroundImage:
              'linear-gradient(0deg, rgba(34,25,16,0.8) 0%, rgba(34,25,16,0.2) 60%), url("https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070&auto=format&fit=crop")',
          }}
        >
          <div className="flex p-6 flex-col relative z-10">
            <span className="bg-primary text-white text-[10px] tracking-wider font-extrabold px-3 py-1.5 rounded-full w-fit mb-3">
              BEM-VINDA!
            </span>
            <p className="text-white tracking-tight text-3xl font-extrabold leading-tight">
              Perfil de Mulheres
            </p>
          </div>
        </div>
      </div>
      <ProgressBar title="Passo 1 de 5" subtitle="Progresso" progress={20} />
      <div className="px-6 py-4 space-y-10">
        <div>
          <h2 className="text-slate-900 tracking-tight text-2xl font-bold leading-tight mb-6">
            Esta é a primeira vez que participa da Feirinha?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <GridRadio
              field="primeiraVez"
              value="SIM"
              label="SIM"
              icon={CheckCircle2}
              isPositive
            />
            <GridRadio
              field="primeiraVez"
              value="NÃO"
              label="NÃO"
              icon={XCircle}
              isPositive={false}
            />
          </div>
        </div>
        <div>
          <h2 className="text-slate-900 tracking-tight text-2xl font-bold leading-tight mb-6">
            Qual a sua idade?
          </h2>
          <div className="flex flex-col gap-3">
            {['MENOS DE 25 ANOS', '25-34', '35-44', '45-54', '55 anos ou mais'].map((v) => (
              <TagRadio
                key={v}
                field="idade"
                value={v}
                label={
                  v === '25-34'
                    ? '25 - 34 anos'
                    : v === '35-44'
                    ? '35 - 44 anos'
                    : v === '45-54'
                    ? '45 - 54 anos'
                    : v
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="pb-28 animate-fade-in">
      <Header title="Sua Jornada" />
      <ProgressBar title="Passo 2 de 5" subtitle="Quase lá! 🚜" progress={40} />
      <div className="px-6 pt-4 space-y-10">
        <div>
          <SectionTitle icon={Calendar} title="Experiência" />
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-5">
            Há quanto tempo atua nesta área?
          </h2>
          <div className="flex flex-col gap-3">
            <ListRadio
              field="tempoAtuacao"
              value="MENOS DE 1 ANO"
              label="Menos de 1 ano"
              description="Iniciando agora!"
              emoji="🌱"
            />
            <ListRadio
              field="tempoAtuacao"
              value="1 A 3 ANOS"
              label="1 a 3 anos"
              description="Ganhando experiência"
              emoji="🌿"
            />
            <ListRadio
              field="tempoAtuacao"
              value="4 A 6 ANOS"
              label="4 a 6 anos"
              description="Já tem estrada"
              emoji="🌳"
            />
            <ListRadio
              field="tempoAtuacao"
              value="MAIS DE 6 ANOS"
              label="Mais de 6 anos"
              description="Mestre do campo"
              emoji="👑"
            />
          </div>
        </div>
        <div>
          <SectionTitle icon={DollarSign} title="Rendimentos" />
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-5">
            A agricultura é a sua principal fonte de renda?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <GridRadio
              field="rendaAgricultura"
              value="SIM"
              label="SIM"
              icon={CheckCircle2}
              isPositive
            />
            <GridRadio
              field="rendaAgricultura"
              value="NÃO"
              label="NÃO"
              icon={XCircle}
              isPositive={false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="pb-28 animate-fade-in">
      <Header title="Seus Produtos" />
      <ProgressBar title="Passo 3 de 5" subtitle="O que vende 🛒" progress={60} />
      <div className="px-6 pt-4 space-y-10">
        <div>
          <SectionTitle icon={Store} title="Comercialização" />
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-3">
            Quais produtos comercializa?
          </h2>
          <textarea
            rows={4}
            className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-base bg-slate-50 outline-none"
            placeholder="Ex: Hortaliças, doces caseiros, artesanato..."
            value={answers.produtos}
            onChange={(e) => handleChange('produtos', e.target.value)}
          />
        </div>
        <div>
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-2">
            Onde vende os seus produtos?
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-5">
            Pode escolher mais de uma opção.
          </p>
          <div className="flex flex-col gap-3">
            <ListCheckbox
              field="locaisVenda"
              value="Feirinha local"
              label="Feirinha local"
              emoji="🎪"
            />
            <ListCheckbox
              field="locaisVenda"
              value="Encomendas"
              label="Encomendas"
              emoji="📦"
            />
            <ListCheckbox
              field="locaisVenda"
              value="Redes sociais"
              label="Redes sociais"
              emoji="📱"
            />
            <ListCheckbox
              field="locaisVenda"
              value="Para mercados"
              label="Para mercados"
              emoji="🛒"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="pb-28 animate-fade-in">
      <Header title="O Dia a Dia" />
      <ProgressBar title="Passo 4 de 5" subtitle="Rotina 📊" progress={80} />
      <div className="px-6 pt-4 space-y-10">
        <div>
          <SectionTitle icon={Target} title="Gestão" />
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-5">
            Divulga os seus produtos nas redes sociais?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <GridRadio
              field="divulgaRedes"
              value="SIM"
              label="SIM"
              icon={CheckCircle2}
              isPositive
            />
            <GridRadio
              field="divulgaRedes"
              value="NÃO"
              label="NÃO"
              icon={XCircle}
              isPositive={false}
            />
          </div>
        </div>
        <div>
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-5">
            Controla os seus ganhos e despesas?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <GridRadio
              field="controlaFinancas"
              value="SIM"
              label="SIM"
              icon={CheckCircle2}
              isPositive
            />
            <GridRadio
              field="controlaFinancas"
              value="NÃO"
              label="NÃO"
              icon={XCircle}
              isPositive={false}
            />
          </div>
        </div>
        <div>
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-2">
            Quais são as suas maiores dificuldades hoje?
          </h2>
          <div className="flex flex-col gap-3 mt-4">
            {[
              'Falta de clientes',
              'Preço baixo dos produtos',
              'Falta de divulgação',
              'Organização financeira',
              'Acesso a crédito',
              'Transporte',
            ].map((v) => (
              <ListCheckbox
                key={v}
                field="dificuldades"
                value={v}
                label={v}
                emoji={
                  v === 'Falta de clientes'
                    ? '🤷‍♀️'
                    : v === 'Preço baixo dos produtos'
                    ? '📉'
                    : v === 'Falta de divulgação'
                    ? '🤫'
                    : v === 'Organização financeira'
                    ? '🧾'
                    : v === 'Acesso a crédito'
                    ? '🏦'
                    : '🚚'
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="pb-28 animate-fade-in">
      <Header title="O Futuro" />
      <ProgressBar title="Passo 5 de 5" subtitle="A finalizar ✨" progress={100} />
      <div className="px-6 pt-4 space-y-10">
        <div>
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-5">
            Sente dificuldade em conciliar trabalho e família?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <GridRadio
              field="conciliarFamilia"
              value="SIM"
              label="SIM"
              icon={CheckCircle2}
              isPositive
            />
            <GridRadio
              field="conciliarFamilia"
              value="NÃO"
              label="NÃO"
              icon={XCircle}
              isPositive={false}
            />
          </div>
        </div>
        <div>
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-2">
            Sobre quais temas gostaria de aprender mais?
          </h2>
          <div className="flex flex-col gap-3 mt-4">
            {[
              'Como aumentar as vendas',
              'Divulgar Instagram e WhatsApp',
              'Organização financeira',
              'Precificação correta',
              'Empreendedorismo feminino',
            ].map((v) => (
              <ListCheckbox
                key={v}
                field="temasAprender"
                value={v}
                label={v === 'Divulgar Instagram e WhatsApp' ? 'Divulgar (Insta/WhatsApp)' : v}
                emoji={
                  v === 'Como aumentar as vendas'
                    ? '🚀'
                    : v === 'Divulgar Instagram e WhatsApp'
                    ? '💬'
                    : v === 'Organização financeira'
                    ? '📈'
                    : v === 'Precificação correta'
                    ? '🏷️'
                    : '💪'
                }
              />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-slate-900 tracking-tight text-xl font-bold leading-tight mb-3">
            Qual a sua sugestão para tornarmos a próxima feirinha ainda melhor?
          </h2>
          <textarea
            rows={4}
            className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-base bg-slate-50 outline-none"
            placeholder="Deixe aqui a sua opinião..."
            value={answers.sugestao}
            onChange={(e) => handleChange('sugestao', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="w-full max-w-md bg-background-light relative shadow-2xl min-h-screen flex flex-col overflow-x-hidden mx-auto">
      <div className="flex-1">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderSuccess()}
      </div>
      {step >= 1 && step <= 5 && (
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
            {isSubmitting ? 'Enviando...' : step === 5 ? 'Enviar Formulário' : 'Próximo Passo'}
            {!isSubmitting && <ArrowRight size={22} strokeWidth={3} />}
          </button>
        </div>
      )}
    </div>
  );
}

