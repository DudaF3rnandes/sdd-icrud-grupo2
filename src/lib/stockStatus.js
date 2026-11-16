import { LOW_STOCK_THRESHOLD, STATUS_LABELS, STOCK_STATUS } from './constants.js'

/**
 * Derives the stock status from a quantity (FR-010, FR-011).
 * quantity === 0 -> esgotado
 * 0 < quantity < 5 -> estoque-baixo
 * quantity >= 5 -> disponivel
 */
export function getStockStatus(quantity) {
  const value = Number(quantity)

  if (!Number.isFinite(value)) return STOCK_STATUS.OUT_OF_STOCK
  if (value <= 0) return STOCK_STATUS.OUT_OF_STOCK
  if (value < LOW_STOCK_THRESHOLD) return STOCK_STATUS.LOW
  return STOCK_STATUS.AVAILABLE
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status
}
