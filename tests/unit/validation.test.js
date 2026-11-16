import { describe, expect, it } from 'vitest'
import { validateFood } from '../../src/lib/validation.js'

const valid = {
  name: 'Arroz',
  quantity: '10',
  unit: 'kg',
  category: 'Ingredientes',
}

describe('validateFood', () => {
  it('accepts a valid payload', () => {
    expect(validateFood(valid)).toEqual({})
  })

  it('V-01: rejects an empty name', () => {
    expect(validateFood({ ...valid, name: '   ' }).name).toBe(
      'Informe o nome do alimento.'
    )
  })

  it('V-02: rejects names shorter than 2 or longer than 80 characters', () => {
    expect(validateFood({ ...valid, name: 'A' }).name).toBe(
      'O nome deve ter entre 2 e 80 caracteres.'
    )
    expect(validateFood({ ...valid, name: 'A'.repeat(81) }).name).toBe(
      'O nome deve ter entre 2 e 80 caracteres.'
    )
  })

  it('V-03: rejects invalid characters', () => {
    expect(validateFood({ ...valid, name: 'Arroz @ casa' }).name).toBe(
      'O nome contém caracteres inválidos.'
    )
  })

  it('V-04: rejects an empty quantity', () => {
    expect(validateFood({ ...valid, quantity: '' }).quantity).toBe(
      'Informe a quantidade em estoque.'
    )
  })

  it('V-05: rejects a non-numeric quantity', () => {
    expect(validateFood({ ...valid, quantity: 'abc' }).quantity).toBe(
      'Informe uma quantidade numérica.'
    )
  })

  it('V-06: rejects a negative quantity', () => {
    expect(validateFood({ ...valid, quantity: '-1' }).quantity).toBe(
      'A quantidade não pode ser negativa.'
    )
  })

  it('V-07: rejects quantities above the maximum or with more than 3 decimals', () => {
    expect(validateFood({ ...valid, quantity: '100000' }).quantity).toBe(
      'A quantidade deve ser no máximo 99.999,999 com até 3 casas decimais.'
    )
    expect(validateFood({ ...valid, quantity: '1.2345' }).quantity).toBe(
      'A quantidade deve ser no máximo 99.999,999 com até 3 casas decimais.'
    )
  })

  it('V-08: rejects categories outside the closed list', () => {
    expect(validateFood({ ...valid, category: 'Doces' }).category).toBe(
      'Selecione uma categoria válida.'
    )
  })

  it('V-09: rejects units outside the closed list', () => {
    expect(validateFood({ ...valid, unit: 'litro' }).unit).toBe(
      'Selecione uma unidade de medida válida.'
    )
  })

  it('accepts zero quantity and trims nothing internally', () => {
    expect(validateFood({ ...valid, quantity: '0' })).toEqual({})
    expect(validateFood({ ...valid, quantity: '0.001' })).toEqual({})
  })
})
