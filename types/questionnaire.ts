/** Configuração de uma opção de resposta */
export type QuestionOption = {
  value: string;
  label: string;
  emoji?: string;
  description?: string;
};

/** Configuração de uma pergunta */
export type QuestionConfig = {
  key: string;
  text: string;
  type: 'radio_binary' | 'radio_list' | 'radio_list_detail' | 'checkbox' | 'textarea';
  options?: QuestionOption[];
  placeholder?: string;
};

/** Configuração de um passo do questionário */
export type StepConfig = {
  id: string;
  title: string;
  subtitle?: string;
  questions: QuestionConfig[];
};

/** Configuração completa do questionário */
export type QuestionnaireConfig = {
  headerTitle?: string;
  headerBadge?: string;
  headerImage?: string;
  steps: StepConfig[];
};
