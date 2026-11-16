const DEFAULT_BASE_URL = 'http://localhost:3001'
const REQUEST_TIMEOUT_MS = 10000

export const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || DEFAULT_BASE_URL
).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor({ kind, status = null, message, fieldErrors = null }) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function defaultMessage(status) {
  if (status === 400 || status === 422) {
    return 'A API rejeitou os dados enviados. Revise o formulário.'
  }
  if (status === 404) {
    return 'Este alimento não existe mais. A lista foi atualizada.'
  }
  if (status === 409) {
    return 'Este alimento foi alterado por outro usuário. Recarregue a lista.'
  }
  if (status >= 500) {
    return 'O servidor encontrou um erro. Tente novamente em instantes.'
  }
  return `Não foi possível concluir a operação (código ${status}).`
}

async function parseBody(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    if (response.ok) {
      throw new ApiError({
        kind: 'http',
        status: response.status,
        message: 'A resposta do servidor é inválida.',
      })
    }
    return null
  }
}

/**
 * Only module in the app allowed to call fetch (Principle IV).
 * Normalizes every failure into an ApiError as described in
 * specs/001-icrud-inventory/contracts/api-error-mapping.md.
 */
export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers,
    signal,
    notFoundMessage,
  } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const externalAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', externalAbort, { once: true })
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })

    const data = await parseBody(response)

    if (!response.ok) {
      let message =
        data && typeof data.message === 'string' && data.message.trim()
          ? data.message
          : defaultMessage(response.status)
      if (response.status === 404 && notFoundMessage) message = notFoundMessage

      throw new ApiError({
        kind: 'http',
        status: response.status,
        message,
        fieldErrors:
          data && typeof data.fieldErrors === 'object' ? data.fieldErrors : null,
      })
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error?.name === 'AbortError') {
      if (signal?.aborted) {
        throw new ApiError({ kind: 'aborted', message: 'Requisição cancelada.' })
      }
      throw new ApiError({
        kind: 'timeout',
        message: 'O servidor demorou para responder. Tente novamente.',
      })
    }
    throw new ApiError({
      kind: 'network',
      message:
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    })
  } finally {
    clearTimeout(timeoutId)
    if (signal) signal.removeEventListener('abort', externalAbort)
  }
}

const apiClient = { request, ApiError, API_BASE_URL }

export default apiClient
