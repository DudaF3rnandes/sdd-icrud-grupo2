import { request } from './apiClient.js'

export function listFoods({ signal } = {}) {
  return request('/foods', { signal })
}

export function createFood(payload, { signal } = {}) {
  return request('/foods', { method: 'POST', body: payload, signal })
}

export function updateFood(id, payload, { signal } = {}) {
  return request(`/foods/${id}`, { method: 'PUT', body: payload, signal })
}

export function deleteFood(id, { signal } = {}) {
  return request(`/foods/${id}`, {
    method: 'DELETE',
    signal,
    notFoundMessage: 'Este alimento já não existe. A lista foi atualizada.',
  })
}
