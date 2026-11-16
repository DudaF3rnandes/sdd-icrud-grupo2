import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import InventoryPage from '../../src/pages/InventoryPage.jsx'
import { server } from '../mocks/server.js'
import { API_BASE_URL } from '../mocks/handlers.js'

function rowFor(name) {
  return screen.getByText(name).closest('tr')
}

async function openEdit(user, name = 'Arroz') {
  const row = rowFor(name)
  await user.click(within(row).getByRole('button', { name: 'Editar' }))
}

describe('US3 — edit food', () => {
  it('prefills the form and updates the row in place', async () => {
    const user = userEvent.setup()
    let received = null

    server.use(
      http.put(`${API_BASE_URL}/foods/1`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ id: '1', ...received })
      })
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')

    await openEdit(user)

    expect(screen.getByLabelText('Nome')).toHaveValue('Arroz')
    expect(screen.getByLabelText('Quantidade em estoque')).toHaveValue(10)
    expect(screen.getByLabelText('Categoria')).toHaveValue('Ingredientes')
    expect(screen.getByLabelText('Unidade de medida')).toHaveValue('kg')

    const quantity = screen.getByLabelText('Quantidade em estoque')
    await user.clear(quantity)
    await user.type(quantity, '3')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await screen.findByText('Alimento atualizado com sucesso.')
    expect(received).toEqual({
      name: 'Arroz',
      quantity: 3,
      unit: 'kg',
      category: 'Ingredientes',
    })
    await waitFor(() => {
      expect(within(rowFor('Arroz')).getByText('3')).toBeInTheDocument()
      expect(within(rowFor('Arroz')).getByText('Estoque Baixo')).toBeInTheDocument()
    })
  })

  it('blocks a negative quantity locally', async () => {
    const user = userEvent.setup()
    let putCalled = false
    server.use(
      http.put(`${API_BASE_URL}/foods/1`, () => {
        putCalled = true
        return HttpResponse.json({ id: '1' })
      })
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')
    await openEdit(user)

    const quantity = screen.getByLabelText('Quantidade em estoque')
    await user.clear(quantity)
    await user.type(quantity, '-5')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(screen.getByText('A quantidade não pode ser negativa.')).toBeInTheDocument()
    expect(putCalled).toBe(false)
  })

  it('keeps the edits and shows the server message on 400', async () => {
    const user = userEvent.setup()
    server.use(
      http.put(`${API_BASE_URL}/foods/1`, () =>
        HttpResponse.json(
          {
            message: 'A API rejeitou os dados enviados. Revise o formulário.',
            fieldErrors: { name: 'Nome recusado pelo servidor.' },
          },
          { status: 400 }
        )
      )
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')
    await openEdit(user)

    const name = screen.getByLabelText('Nome')
    await user.clear(name)
    await user.type(name, 'Arroz especial')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await screen.findByText('A API rejeitou os dados enviados. Revise o formulário.')
    expect(screen.getByText('Nome recusado pelo servidor.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Arroz especial')
  })

  it('shows the not-found message and refreshes the list on 404', async () => {
    const user = userEvent.setup()
    server.use(
      http.put(`${API_BASE_URL}/foods/1`, () =>
        HttpResponse.json({ message: '' }, { status: 404 })
      )
    )

    render(<InventoryPage />)
    await screen.findByText('Arroz')
    await openEdit(user)

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await screen.findByText(
      'Este alimento não existe mais. A lista foi atualizada.'
    )
    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument()
    })
  })
})
