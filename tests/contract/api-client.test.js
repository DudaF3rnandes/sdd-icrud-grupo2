import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { server } from '../mocks/server.js'
import { API_BASE_URL } from '../mocks/handlers.js'
import {
  createFood,
  deleteFood,
  listFoods,
  updateFood,
} from '../../src/services/foodsApi.js'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('apiClient contract', () => {
  it('lists foods with GET /foods and Accept header', async () => {
    expect.assertions(3)
    server.use(
      http.get(`${API_BASE_URL}/foods`, ({ request }) => {
        expect(request.method).toBe('GET')
        expect(request.headers.get('accept')).toBe('application/json')
        return HttpResponse.json([{ id: '1', name: 'Arroz' }])
      })
    )

    const data = await listFoods()
    expect(data).toEqual([{ id: '1', name: 'Arroz' }])
  })

  it('creates a food with POST /foods and a JSON body', async () => {
    expect.assertions(4)
    const payload = { name: 'Arroz', quantity: 10, unit: 'kg', category: 'Ingredientes' }

    server.use(
      http.post(`${API_BASE_URL}/foods`, async ({ request }) => {
        expect(request.method).toBe('POST')
        expect(request.headers.get('content-type')).toContain('application/json')
        const body = await request.json()
        expect(body).toEqual(payload)
        return HttpResponse.json({ id: '42', ...body }, { status: 201 })
      })
    )

    const created = await createFood(payload)
    expect(created).toEqual({ id: '42', ...payload })
    expect(payload).toEqual({
      name: 'Arroz',
      quantity: 10,
      unit: 'kg',
      category: 'Ingredientes',
    })
  })

  it('updates a food with PUT /foods/:id', async () => {
    expect.assertions(2)
    const payload = { name: 'Arroz integral', quantity: 4, unit: 'kg', category: 'Ingredientes' }

    server.use(
      http.put(`${API_BASE_URL}/foods/42`, async ({ request, params }) => {
        expect(params.id).toBe('42')
        const body = await request.json()
        return HttpResponse.json({ id: '42', ...body })
      })
    )

    const updated = await updateFood('42', payload)
    expect(updated).toEqual({ id: '42', ...payload })
  })

  it('deletes a food with DELETE /foods/:id', async () => {
    expect.assertions(1)
    server.use(
      http.delete(`${API_BASE_URL}/foods/42`, () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    await expect(deleteFood('42')).resolves.toBeNull()
  })

  it('normalizes network failures', async () => {
    server.use(http.get(`${API_BASE_URL}/foods`, () => HttpResponse.error()))

    await expect(listFoods()).rejects.toMatchObject({
      kind: 'network',
      message:
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    })
  })

  it('normalizes timeouts after 10 seconds', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
              const error = new Error('aborted')
              error.name = 'AbortError'
              reject(error)
            })
          })
      )
    )

    const promise = listFoods()
    const assertion = expect(promise).rejects.toMatchObject({
      kind: 'timeout',
      message: 'O servidor demorou para responder. Tente novamente.',
    })
    await vi.advanceTimersByTimeAsync(10000)
    await assertion
  })

  it('maps 400 responses with fieldErrors', async () => {
    server.use(
      http.post(`${API_BASE_URL}/foods`, () =>
        HttpResponse.json(
          {
            message: 'A quantidade não pode ser negativa.',
            fieldErrors: { quantity: 'A quantidade não pode ser negativa.' },
          },
          { status: 400 }
        )
      )
    )

    await expect(createFood({})).rejects.toMatchObject({
      kind: 'http',
      status: 400,
      message: 'A quantidade não pode ser negativa.',
      fieldErrors: { quantity: 'A quantidade não pode ser negativa.' },
    })
  })

  it('maps 404 on update and delete with their specific messages', async () => {
    server.use(
      http.put(`${API_BASE_URL}/foods/1`, () =>
        HttpResponse.json({ message: '' }, { status: 404 })
      ),
      http.delete(`${API_BASE_URL}/foods/1`, () =>
        HttpResponse.json({}, { status: 404 })
      )
    )

    await expect(updateFood('1', {})).rejects.toMatchObject({
      status: 404,
      message: 'Este alimento não existe mais. A lista foi atualizada.',
    })
    await expect(deleteFood('1')).rejects.toMatchObject({
      status: 404,
      message: 'Este alimento já não existe. A lista foi atualizada.',
    })
  })

  it('maps 409 and 500 responses', async () => {
    server.use(
      http.get(`${API_BASE_URL}/foods`, () =>
        HttpResponse.json({ message: '' }, { status: 409 })
      )
    )
    await expect(listFoods()).rejects.toMatchObject({
      status: 409,
      message: 'Este alimento foi alterado por outro usuário. Recarregue a lista.',
    })

    server.use(
      http.get(`${API_BASE_URL}/foods`, () =>
        HttpResponse.json({ message: '' }, { status: 500 })
      )
    )
    await expect(listFoods()).rejects.toMatchObject({
      status: 500,
      message: 'O servidor encontrou um erro. Tente novamente em instantes.',
    })
  })

  it('rejects malformed JSON in a successful response', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}/foods`,
        () =>
          new HttpResponse('not-json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    )

    await expect(listFoods()).rejects.toMatchObject({
      kind: 'http',
      status: 200,
      message: 'A resposta do servidor é inválida.',
    })
  })
})
