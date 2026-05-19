/** Abas do painel (?tab=...) */
export const MANAGEMENT_TABS = [
  'responses',
  'catalogo',
  'vendas_catalogo',
  'pdv',
  'produtos',
  'post',
  'galeria',
  'relatorios',
  'usuarios',
  'configuracao',
] as const;

export type ManagementTabId = (typeof MANAGEMENT_TABS)[number];

export type AssistantAction =
  | { type: 'open_tab'; tab: ManagementTabId; label: string }
  | { type: 'add_product'; label: string }
  | { type: 'import_nota'; label: string };

export type AssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
};

export type AssistantChatResponse = {
  reply: string;
  actions: AssistantAction[];
};
