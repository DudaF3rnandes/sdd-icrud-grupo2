import { CATEGORIES, UNITS } from './constants.js'

const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 '\-.()]+$/
const MAX_QUANTITY = 99999.999

function countDecimals(raw) {
  const text = String(raw).trim()
  if (text.includes('e') || text.includes('E')) return 0
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/**
 * Validates the editable food form values (FR-002, FR-008).
 * Returns a { field: message } map, never throws.
 */
export function validateFood(values = {}) {
  const errors = {}
  const name = typeof values.name === 'string' ? values.name.trim() : ''

  if (!name) {
    errors.name = 'Informe o nome do alimento.'
  } else if (name.length < 2 || name.length > 80) {
    errors.name = 'O nome deve ter entre 2 e 80 caracteres.'
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = 'O nome contém caracteres inválidos.'
  }

  const rawQuantity = values.quantity
  if (rawQuantity === undefined || rawQuantity === null || String(rawQuantity).trim() === '') {
    errors.quantity = 'Informe a quantidade em estoque.'
  } else {
    const quantity = Number(rawQuantity)
    if (!Number.isFinite(quantity)) {
      errors.quantity = 'Informe uma quantidade numérica.'
    } else if (quantity < 0) {
      errors.quantity = 'A quantidade não pode ser negativa.'
    } else if (quantity > MAX_QUANTITY || countDecimals(rawQuantity) > 3) {
      errors.quantity = 'A quantidade deve ser no máximo 99.999,999 com até 3 casas decimais.'
    }
  }

  if (!CATEGORIES.includes(values.category)) {
    errors.category = 'Selecione uma categoria válida.'
  }

  if (!UNITS.includes(values.unit)) {
    errors.unit = 'Selecione uma unidade de medida válida.'
  }

  return errors
}
