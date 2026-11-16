# Quickstart: iCRUD Inventory Management System

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-15

Validation guide for use **after implementation**. The application, mock, `.env.example`, `npm test` and `npm run mock:api` are not yet available. A mock verifies the frontend against a simulated HTTP service; final end-to-end validation must also use the confirmed real API and database. Implementation details belong in `tasks.md` and the source.

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0` and npm
- A browser (Chrome, Edge, Firefox, or Safari, current version)
- The external REST API, **or** the bundled local mock (recommended for validation)

## Setup

```bash
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

`.env` contents:

```text
VITE_API_BASE_URL=http://localhost:3001
```

If you use the group's real API, point `VITE_API_BASE_URL` at it and skip the mock server. Payload shapes and status codes must match [contracts/openapi.yaml](./contracts/openapi.yaml).

## Run the local mock API (validation only)

```bash
npm run mock:api
```

Once implemented, this starts the selected contract-compatible mock on `http://localhost:3001` with sample inventory in `mock/db.json`. Verify its methods, validation errors and response codes against the contract; plain `json-server` must not be assumed to implement them.

## Run the application

In a second terminal:

```bash
npm run dev
```

Open the printed URL (by default `http://localhost:5173`).

## Automated checks

```bash
npm test          # Vitest: unit + integration + contract
npm run lint      # oxlint
npm run build     # production build must succeed
```

Expected: all tests pass, lint reports no errors, build completes.

## Validation scenarios

Each scenario is independently runnable and maps to a user story and its functional requirements.

### S1 — Create, validate, and preserve (US1 / FR-001, FR-002, FR-005; SC-001, SC-003, SC-004)

1. Open the form and submit it empty.
   - **Expected**: no network request; each required field shows its PT-BR message; nothing is saved.
2. Fill name `Suco de laranja`, quantity `12.5`, category `Bebidas`, unit `L`; submit.
   - **Expected**: success confirmation; the item appears at the top/end of the list with status `Disponível`; the form resets.
3. Fill a valid form, then stop the mock API (Ctrl+C) and submit.
   - **Expected**: connection error banner; **all typed values remain in the form**; restart the API and resubmit successfully.
4. Enter quantity `-1` and submit.
   - **Expected**: quantity is rejected locally; no request is sent.
5. Enter quantity `0` and submit.
   - **Expected**: accepted; the new item shows status `Esgotado`.
6. Enter a name with surrounding spaces (`"  Arroz  "`), save, and inspect the list/API.
   - **Expected**: stored and displayed as `Arroz` (trimmed).

### S2 — List, filter, and recover from load failure (US2 / FR-006, FR-007; SC-002)

1. Load the application with the mock running.
   - **Expected**: the list shows name, quantity, unit, category, and status for every record; load time is under 2 s.
2. Select category `Bebidas`.
   - **Expected**: only beverages are shown; the filter label reflects the selection; selecting `Todas` restores the full list.
3. Select a category with no items (or delete all items of a category).
   - **Expected**: an explicit "Nenhum alimento nesta categoria" empty state, not a blank table.
4. Stop the mock API and reload the page.
   - **Expected**: an inline integration error with a "Tentar novamente" button; no blank screen. Restart the API and click retry.
   - **Expected**: the list loads; filter preservation applies to retries within the same session, not necessarily across page reloads.

### S3 — Edit an existing food (US3 / FR-008; SC-001)

1. Choose an item and change its quantity from `10` to `3`; save.
   - **Expected**: the row updates immediately and the status changes to `Estoque Baixo`.
2. Start an edit, set quantity to `-5`, and save.
   - **Expected**: local validation blocks the request and shows the field message.
3. Begin an edit, stop the mock API, and save.
   - **Expected**: error banner; all edits remain in the form; restart the API and save successfully.
4. Delete a record directly in the mock (`DELETE /foods/{id}` via a REST client) while its edit form is open, then save.
   - **Expected**: "Este alimento não existe mais. A lista foi atualizada."; the row disappears after the list refresh.

### S4 — Delete with confirmation (US4 / FR-009; SC-005)

1. Click delete on a row.
   - **Expected**: a modal asks for confirmation; the row is still present and no request has been sent.
2. Press Escape or choose "Cancelar".
   - **Expected**: dialog closes; the item remains; the API receives no `DELETE`.
3. Confirm deletion.
   - **Expected**: the row is removed and a success confirmation is shown; refreshing the page does not bring it back.
4. Stop the mock API and confirm deletion of another row.
   - **Expected**: error banner; the row stays visible; the list is unchanged.

## Optional manual API checks

Use any REST client against `http://localhost:3001`:

| Call | Expected |
|------|----------|
| `GET /foods` | `200` and an array |
| `POST /foods` with a valid body | `201` and the created object with `id` |
| `POST /foods` with `quantity: -1` | `400` with a `message` |
| `PUT /foods/{id}` for an existing id | `200` with the updated object |
| `PUT /foods/does-not-exist` | `404` |
| `DELETE /foods/{id}` | `204`, then `GET` no longer includes it |
| `DELETE /foods/{id}` again | `404` |

## Troubleshooting

- **CORS errors in the browser**: the mock and the real API must allow the dev origin; `json-server` does by default. Do not "fix" CORS by disabling browser security.
- **Empty list with no error**: confirm the mock is running and `VITE_API_BASE_URL` matches its port; restart `npm run dev` after editing `.env`.
- **Filter shows nothing**: select `Todas` to reset; the empty state is expected when a category has no records.
- **Tests fail only in CI**: ensure the test environment is `jsdom` (configured in `vitest.config.js`) and that no test depends on a real network.
