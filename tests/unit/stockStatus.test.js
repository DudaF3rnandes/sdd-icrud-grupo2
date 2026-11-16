import { describe, expect, it } from 'vitest'
import { getStockStatus } from '../../src/lib/stockStatus.js'

describe('getStockStatus', () => {
  it('returns esgotado for zero', () => {
    expect(getStockStatus(0)).toBe('esgotado')
    expect(getStockStatus('0')).toBe('esgotado')
  })

  it('returns estoque-baixo for values between 0 and 5', () => {
    expect(getStockStatus(0.001)).toBe('estoque-baixo')
    expect(getStockStatus(1)).toBe('estoque-baixo')
    expect(getStockStatus(4.999)).toBe('estoque-baixo')
  })

  it('returns disponivel for values greater than or equal to 5', () => {
    expect(getStockStatus(5)).toBe('disponivel')
    expect(getStockStatus(100)).toBe('disponivel')
  })
})
