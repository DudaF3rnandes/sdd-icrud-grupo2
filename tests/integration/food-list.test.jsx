import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import InventoryPage from '../../src/pages/InventoryPage.jsx'
import { server } from '../mocks/server.js'
import { API_BASE_URL } from '../mocks/handlers.js'

function rowFor(name) {
  return screen.getByText(name).closest('tr')
}

describe('US2 — list and filter', () => {
  it('renders every row with name, quantity, unit, category and status', async () => {
    render(<InventoryPage />)

    await screen.findByText('Arroz')

    expect(within(rowFor('Arroz')).getByText('10')).toBeInTheDocument()
    expect(within(rowFor('Arroz')).getByText('kg')).toBeInTheDocument()
    expect(within(rowFor('Arroz')).getByText('Ingredientes')).toBeInTheDocument()
    expect(within(rowFor('Arroz')).getByText('Disponível')).toBeInTheDocument()

    expect(within(rowFor('Suco de laranja')).getByText('Estoque Baixo')).toBeInTheDocument()
    expect(within(rowFor('Alface')).getByText('Esgotado')).toBeInTheDocument()
  })

  it('filters by category and restores the full list with Todas', async () => {
    const user = userEvent.setup()
    render(<InventoryPage />)
    await screen.findByText('Arroz')

    await user.selectOptions(screen.getByLabelText('Filtrar por categoria'), 'Bebidas')

    expect(screen.getByText('Suco de laranja')).toBeInTheDocument()
    expect(screen.queryByText('Arroz')).not.toBeInTheDocument()
    expect(screen.queryByText('Alface')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filtrar por categoria'), '')

    expect(screen.getByText('Arroz')).toBeInTheDocument()
    expect(screen.getByText('Alface')).toBeInTheDocument()
  })

  it('shows an explicit empty state for a category without items', async () => {
    const user = userEvent.setup()
    render(<InventoryPage />)
    await screen.findByText('Arroz')

    await user.selectOptions(
      screen.getByLabelText('Filtrar por categoria'),
      'Laticínios'
    )

    expect(screen.getByText('Nenhum alimento nesta categoria.')).toBeInTheDocument()
  })

  it('shows a retry banner on failure, keeps the filter and recovers', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${API_BASE_URL}/foods`, () =>
        HttpResponse.json({ message: '' }, { status: 500 })
      )
    )

    render(<InventoryPage />)

    await screen.findByText('O servidor encontrou um erro. Tente novamente em instantes.')

    await user.selectOptions(screen.getByLabelText('Filtrar por categoria'), 'Bebidas')

    server.resetHandlers()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await screen.findByText('Suco de laranja')
    expect(screen.queryByText('Arroz')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Filtrar por categoria')).toHaveValue('Bebidas')
  })
})
