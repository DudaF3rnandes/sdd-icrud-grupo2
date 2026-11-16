import { http, HttpResponse } from 'msw'

export const API_BASE_URL = 'http://localhost:3001'

export const sampleFoods = [
  { id: '1', name: 'Arroz', quantity: 10, unit: 'kg', category: 'Ingredientes' },
  { id: '2', name: 'Suco de laranja', quantity: 3, unit: 'L', category: 'Bebidas' },
  { id: '3', name: 'Alface', quantity: 0, unit: 'unidade', category: 'Hortifruti' },
  { id: '4', name: 'Picanha', quantity: 6, unit: 'kg', category: 'Carnes' },
]

export const handlers = [
  http.get(`${API_BASE_URL}/foods`, () => {
    return HttpResponse.json(sampleFoods)
  }),

  http.post(`${API_BASE_URL}/foods`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: '99', ...body }, { status: 201 })
  }),

  http.put(`${API_BASE_URL}/foods/:id`, async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({ id: params.id, ...body })
  }),

  http.delete(`${API_BASE_URL}/foods/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

export default handlers
