/** Categorias de produto (cadastro e filtros) */
export const PRODUCT_CATEGORIES = ['Bebidas', 'Orgânicos', 'Salgado', 'Doses', 'Outros'] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Catálogo público inclui "Todos" para filtrar */
export const CATALOG_CATEGORIES = ['Todos', ...PRODUCT_CATEGORIES] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Todos: 'deployed_code',
  Bebidas: 'local_cafe',
  Orgânicos: 'eco',
  Salgado: 'restaurant',
  Doses: 'liquor',
  Outros: 'more_horiz',
};
