export const LOW_STOCK_THRESHOLD = 5

export const CATEGORIES = [
  'Ingredientes',
  'Bebidas',
  'Hortifruti',
  'Carnes',
  'Laticínios',
  'Outros',
]

export const UNITS = ['kg', 'g', 'L', 'mL', 'unidade', 'pacote']

/** Canonical status codes used in code and tests. */
export const STOCK_STATUS = {
  OUT_OF_STOCK: 'esgotado',
  LOW: 'estoque-baixo',
  AVAILABLE: 'disponivel',
}

/** PT-BR labels rendered in the UI. */
export const STATUS_LABELS = {
  esgotado: 'Esgotado',
  'estoque-baixo': 'Estoque Baixo',
  disponivel: 'Disponível',
}
