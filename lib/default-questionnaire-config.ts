import type { QuestionnaireConfig } from '@/types/questionnaire';
import defaultConfigJson from './default-questionnaire-config.json';

/** Config padrão do Questionário Inicial (como o SurveyApp estático) */
export const DEFAULT_QUESTIONNAIRE_CONFIG: QuestionnaireConfig = defaultConfigJson as QuestionnaireConfig;
