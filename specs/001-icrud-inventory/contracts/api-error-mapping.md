# Contract: API Failure → UI Behavior

**Feature**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md) | **API contract**: [openapi.yaml](./openapi.yaml)

All failures are normalized by `src/services/apiClient.js` into an `ApiError` before reaching components. This table is the single source of truth for user-facing behavior and is exercised by `tests/contract/api-client.test.js` and the integration suites.

## Normalized error shape

```js
{
  kind: 'network' | 'timeout' | 'http',
  status: number | null,          // HTTP status, when kind === 'http'
  message: string,                // safe PT-BR message for the user
  fieldErrors: Record<string,string> | null  // from 400 body, when available
}
```

## Failure mapping

| Trigger | `kind` | User-facing message | Required behavior |
|---------|--------|---------------------|-------------------|
| `fetch` rejects (DNS, offline, CORS, connection refused) | `network` | "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente." | Show error banner; keep all form values; offer retry |
| No response within 10 s (`AbortController`) | `timeout` | "O servidor demorou para responder. Tente novamente." | Same as network; request aborted client-side |
| `400` / `422` on create or update | `http` | Body `message` if present, else "A API rejeitou os dados enviados. Revise o formulário." | Show banner and, when `fieldErrors` is present, attach messages to the matching fields; **never discard edits** |
| `404` on update | `http` | "Este alimento não existe mais. A lista foi atualizada." | Close/keep form as-is per user action, refresh the list |
| `404` on delete | `http` | "Este alimento já não existe. A lista foi atualizada." | Keep dialog closed, refresh the list, do not report success |
| `409` (concurrent change) | `http` | "Este alimento foi alterado por outro usuário. Recarregue a lista." | Show banner; keep form values; refresh list on acknowledgement |
| `5xx` | `http` | "O servidor encontrou um erro. Tente novamente em instantes." | Show banner; keep form values; offer retry |
| Any other non-2xx | `http` | "Não foi possível concluir a operação (código {status})." | Show banner; keep form values |
| Malformed JSON in a `2xx` body | `http` | "A resposta do servidor é inválida." | Treat as failure; do not update local list |

## Per-operation outcomes

| Operation | On success | On failure |
|-----------|-----------|------------|
| List (`GET /foods`) | Render rows and enable filter | Render inline error state with "Tentar novamente"; never a blank screen |
| Create (`POST /foods`) | Show success confirmation, reset form, append returned record to list | Keep form values exactly as typed (FR-005, SC-003), show error, allow immediate resubmit |
| Update (`PUT /foods/{id}`) | Show success confirmation, update row in place, exit edit mode | Keep edits in the form, show error; on 404 refresh list |
| Delete (`DELETE /foods/{id}`) | Remove row, show success confirmation | Keep row visible, show error; on 404 refresh list |

## Invariants

1. No component other than `apiClient` calls `fetch` (Principle IV).
2. No failure path clears form state or removes a row before the server confirms success.
3. Every failure is announced in an `aria-live="polite"` region and is visible without hovering.
4. Retry actions re-issue the same request with the current in-memory values; nothing is silently retried in the background.
5. Error messages never expose raw stack traces, HTML, or API internals to the user.
