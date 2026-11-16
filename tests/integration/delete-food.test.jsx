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

async function openDeleteDialog(user, name = 'Alface') {
  const row = rowFor(name)
  await user.click(within(row).getByRole('button', { name: 'Excluir' }))
  return screen.getByRole('dialog', { name: 'Confirmar exclusão' })
}

describe('US4 — delete with confirmation', () => {
  it('opens the dialog naming the food and sends no request', async () => {
    const user = userEvent.setup()
    let deleteCalled = false
    server.use(
      http.delete(`${API_BASE_URL}/foods/:id`, () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<InventoryPage />)
    await screen.findByText('Alface')

    const dialog = await openDeleteDialog(user)

    expect(within(dialog).getByText(/Alface/)).toBeInTheDocument()
    expect(screen.getByText('Alface')).toBeInTheDocument()
    expect(deleteCalled).toBe(false)
  })

  it('cancels with no request and keeps the row', async () => {
    const user = userEvent.setup()
    let deleteCalled = false
    server.use(
      http.delete(`${API_BASE_URL}/foods/:id`, () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<InventoryPage />)
    await screen.findByText('Alface')

    const dialog = await openDeleteDialog(user)
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Alface')).toBeInTheDocument()
    expect(deleteCalled).toBe(false)
  })

  it('deletes only after confirmation and removes the row', async () => {
    const user = userEvent.setup()
    let deletedId = null
    server.use(
      http.delete(`${API_BASE_URL}/foods/:id`, ({ params }) => {
        deletedId = params.id
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<InventoryPage />)
    await screen.findByText('Alface')

    const dialog = await openDeleteDialog(user)
    await user.click(
      within(dialog).getByRole('button', { name: 'Confirmar exclusão' })
    )

    await screen.findByText('Alimento excluído com sucesso.')
    expect(deletedId).toBe('3')
    expect(screen.queryByText('Alface')).not.toBeInTheDocument()
  })

  it('keeps the row visible and shows the error when deletion fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.delete(`${API_BASE_URL}/foods/:id`, () => HttpResponse.error())
    )

    render(<InventoryPage />)
    await screen.findByText('Alface')

    const dialog = await openDeleteDialog(user)
    await user.click(
      within(dialog).getByRole('button', { name: 'Confirmar exclusão' })
    )

    await screen.findByText(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    )
    expect(screen.getByText('Alface')).toBeInTheDocument()
  })

  it('shows the already-removed message and refreshes on 404', async () => {
    const user = userEvent.setup()
    server.use(
      http.delete(`${API_BASE_URL}/foods/:id`, () =>
        HttpResponse.json({ message: '' }, { status: 404 })
      )
    )

    render(<InventoryPage />)
    await screen.findByText('Alface')

    const dialog = await openDeleteDialog(user)
    await user.click(
      within(dialog).getByRole('button', { name: 'Confirmar exclusão' })
    )

    await screen.findByText('Este alimento já não existe. A lista foi atualizada.')
    expect(screen.getByText('Alface')).toBeInTheDocument()
  })
})
