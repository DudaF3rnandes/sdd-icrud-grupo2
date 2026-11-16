import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import InventoryPage from '../../src/pages/InventoryPage.jsx'
import { server } from '../mocks/server.js'
import { API_BASE_URL } from '../mocks/handlers.js'

async function fillValidForm(user) {
  await user.type(screen.getByLabelText('Nome'), '  Suco de laranja  ')
  await user.type(screen.getByLabelText('Quantidade em estoque'), '12.5')
  await user.selectOptions(screen.getByLabelText('Categoria'), 'Bebidas')
  await user.selectOptions(screen.getByLabelText('Unidade de medida'), 'L')
}

describe('US1 — create food', () => {
  it('blocks an empty submit locally and shows every required message', async () => {
    const user = userEvent.setup()
    let postCalled = false
    server.use(
      http.post(`${API_BASE_URL}/foods`, () => {
        postCalled = true
        return HttpResponse.json({ id: '99' }, { status: 201 })
      })
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')

    await user.click(screen.getByRole('button', { name: 'Cadastrar alimento' }))

    expect(screen.getByText('Informe o nome do alimento.')).toBeInTheDocument()
    expect(screen.getByText('Informe a quantidade em estoque.')).toBeInTheDocument()
    expect(screen.getByText('Selecione uma categoria válida.')).toBeInTheDocument()
    expect(
      screen.getByText('Selecione uma unidade de medida válida.')
    ).toBeInTheDocument()
    expect(postCalled).toBe(false)
  })

  it('posts trimmed values and resets the form on success', async () => {
    const user = userEvent.setup()
    let received = null
    server.use(
      http.post(`${API_BASE_URL}/foods`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ id: '99', ...received }, { status: 201 })
      })
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Cadastrar alimento' }))

    await screen.findByText('Alimento cadastrado com sucesso.')
    expect(received).toEqual({
      name: 'Suco de laranja',
      quantity: 12.5,
      unit: 'L',
      category: 'Bebidas',
    })
    await waitFor(() => {
      expect(screen.getByLabelText('Nome')).toHaveValue('')
      expect(screen.getByLabelText('Quantidade em estoque')).toHaveValue(null)
    })
  })

  it('keeps every typed value when the network fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/foods`, () => HttpResponse.error())
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Cadastrar alimento' }))

    await screen.findByText(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('  Suco de laranja  ')
    expect(screen.getByLabelText('Quantidade em estoque')).toHaveValue(12.5)
    expect(screen.getByLabelText('Categoria')).toHaveValue('Bebidas')
    expect(screen.getByLabelText('Unidade de medida')).toHaveValue('L')
  })

  it('keeps the form values when the server returns 500', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/foods`, () =>
        HttpResponse.json({ message: '' }, { status: 500 })
      )
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Cadastrar alimento' }))

    await screen.findByText(
      'O servidor encontrou um erro. Tente novamente em instantes.'
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('  Suco de laranja  ')
  })

  it('blocks a negative quantity without sending a request', async () => {
    const user = userEvent.setup()
    let postCalled = false
    server.use(
      http.post(`${API_BASE_URL}/foods`, () => {
        postCalled = true
        return HttpResponse.json({ id: '99' }, { status: 201 })
      })
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')

    await user.type(screen.getByLabelText('Nome'), 'Arroz')
    await user.type(screen.getByLabelText('Quantidade em estoque'), '-1')
    await user.selectOptions(screen.getByLabelText('Categoria'), 'Ingredientes')
    await user.selectOptions(screen.getByLabelText('Unidade de medida'), 'kg')
    await user.click(screen.getByRole('button', { name: 'Cadastrar alimento' }))

    expect(
      screen.getByText('A quantidade não pode ser negativa.')
    ).toBeInTheDocument()
    expect(postCalled).toBe(false)
  })
})
