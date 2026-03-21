export type SurveyResponse = {
  id: string;
  created_at: string;
  primeira_vez: string;
  idade: string;
  tempo_atuacao: string;
  renda_agricultura: string;
  produtos: string;
  locais_venda: string[];
  divulga_redes: string;
  controla_financas: string;
  dificuldades: string[];
  conciliar_familia: string;
  temas_aprender: string[];
  sugestao: string | null;
};
