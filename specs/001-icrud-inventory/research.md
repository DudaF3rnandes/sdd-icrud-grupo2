# Phase 0 Research: iCRUD Inventory Management System

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-15

The group confirmed the stock threshold, allowed lists and API contract documented below. The proposed files and tooling now exist and the front-end validation results are recorded in `speckit-evidence/`. Real API/database integration still requires execution and validation.

---

## 1. Low-stock threshold (spec ambiguity #1)

- **Decision**: `0` → `Esgotado`; `0 < quantity < 5` → `Estoque Baixo`; `quantity ≥ 5` → `Disponível`. The threshold is the single constant `LOW_STOCK_THRESHOLD = 5`.
- **Rationale**: A fixed, global threshold is the simplest rule that satisfies FR-010 and is trivially testable. Centralizing it in `constants.js` makes a future per-category threshold a one-file change. Decimal quantities are compared numerically, so `4.999` is low stock and `5` is available.
- **Alternatives considered**: Per-category thresholds (rejected: no requirement, adds configuration UI); server-provided status (rejected: spec defines status as a derived indicator and not a stored field; also forces every list response to carry it); threshold expressed as a percentage of capacity (rejected: no capacity field exists).

## 2. Closed lists of categories and units (spec ambiguity #2)

- **Decision**: Categories = `Ingredientes`, `Bebidas`, `Hortifruti`, `Carnes`, `Laticínios`, `Outros`. Units = `kg`, `g`, `L`, `mL`, `unidade`, `pacote`. Both are frozen arrays in `src/lib/constants.js`, validated locally, and mirrored as enums in the OpenAPI contract.
- **Rationale**: The spec names these values as examples in the Key Entities section and requires selection from allowed lists (FR-002). Freezing them in one module keeps UI, validation, and tests consistent with Principle V.
- **Alternatives considered**: Server-supplied lookup endpoints (rejected: adds two endpoints and loading states not requested); free text with datalist (rejected: violates the "closed list" requirement); storing labels in Portuguese with accented slugs in the API (rejected: see decision 5).

## 3. UI framework, language, and routing

- **Decision**: React 19 function components written in JavaScript (JSX) on Vite 8, as mandated by the constitution. No router: one `InventoryPage` with the list always visible and the create/edit form shown in an overlay/panel state. State management is React `useState`/`useReducer` plus one custom hook.
- **Rationale**: The specification describes a single inventory workflow ("tela de cadastro", "tela de listagem") belonging to one area; adding a router or Redux would be complexity without technical justification (Principle I).
- **Alternatives considered**: React Router with `/foods/new` and `/foods/:id/edit` (rejected: deep links were not requested, and a single screen keeps form-preservation logic simple); Redux/Zustand (rejected: single consumer of state; hooks suffice); TypeScript (rejected: constitution fixes JavaScript).

## 4. HTTP client

- **Decision**: Wrap the native `fetch` API in a single `src/services/apiClient.js` that adds a 10-second `AbortController` timeout, JSON headers, response parsing, and normalization of every failure into a typed `ApiError` (`kind`: `network` | `timeout` | `http`; optional `status`, `fieldErrors`, `message`). Feature modules call `foodsApi`, never `fetch` directly.
- **Rationale**: Native `fetch` avoids a new runtime dependency and satisfies Principle IV with one interception point for errors, timeouts, and contract tests. A 10 s timeout addresses the "server slow/unreachable" edge case without leaving the UI hanging.
- **Alternatives considered**: Axios (rejected: extra runtime dependency for behavior `fetch` + `AbortController` already provides); per-component fetch calls (rejected: duplicated error handling, untestable contract).

## 5. API contract and naming

- **Decision**: REST resources under `/foods` with JSON payloads using English camelCase fields: `id`, `name`, `quantity`, `unit`, `category`, `createdAt`, `updatedAt`. UI labels and validation messages remain PT-BR. The mapping between API enums and PT-BR labels lives in `constants.js`. Full contract in [contracts/openapi.yaml](./contracts/openapi.yaml).
- **Rationale**: Field naming must be documented somewhere (Principle IV); choosing one convention and localizing only at the presentation layer prevents accents/spaces from leaking into URLs and payloads. Keeping the mapping in one constant table means a backend that prefers Portuguese names only requires changing `foodsApi` + contract.
- **Alternatives considered**: Portuguese field names (`nome`, `quantidade`, `unidadeMedida`, `categoria`) — viable but mixes presentation text with transport; accepted as a documented alternative if the group's API is already built that way. GraphQL (rejected: spec says REST).

## 6. API base URL and environments

- **Decision**: Read `import.meta.env.VITE_API_BASE_URL`; default to `http://localhost:3001` for local development. Document in `.env.example`. No secrets in the front end.
- **Rationale**: Vite's standard env mechanism; a default lets the quickstart run against the local mock without configuration.
- **Alternatives considered**: Vite dev-server proxy (rejected as the primary mechanism because the app must also work as a static build; may be added later for CORS convenience); hard-coded URL (rejected: breaks deploys).

## 7. Status computation location

- **Decision**: Derive status on the client from `quantity` via a pure function `getStockStatus(quantity)`; never send status to the API.
- **Rationale**: FR-010 defines status as a rule over available quantity, and the Key Entities describe it as a calculated indicator. Deriving locally keeps the list responsive without extra fields and keeps status consistent during optimistic edits.
- **Alternatives considered**: Persisting status server-side (rejected: becomes stale and duplicates the rule); recomputing only on refetch (rejected: UI would lag after edits).

## 8. Filtering strategy

- **Decision**: Client-side filtering over the already-loaded list using a single `selectedCategory` state (`Todas` plus the six categories). The API is called only for initial load and mutations.
- **Rationale**: At the documented scale (≤500 items) client filtering is instantaneous, avoids extra endpoints, and keeps filter state stable across reloads/retries. Satisfies FR-007 and SC-002.
- **Alternatives considered**: `GET /foods?category=` server-side filtering (rejected: requires a request per filter change and an agreement not present in the spec; can be added later behind the same `foodsApi.list` signature).

## 9. Form validation

- **Decision**: Pure synchronous `validateFood(values)` returning a `{ field: message }` map, run on submit (and on blur for touched fields), before any request. Rules:
  - `name`: required after `trim`; 2–80 characters; only letters (including accented), digits, spaces, and `- ' . ( )`; reject strings that are only symbols/whitespace.
  - `quantity`: required; numeric; `≥ 0`; at most 3 decimal places; `≤ 99999.999`.
  - `category` / `unit`: required; must belong to the closed lists.
- **Rationale**: Satisfies FR-002 and SC-001 (100% of invalid submissions blocked before the request), gives deterministic unit tests, and prevents duplicated validation logic between create and edit (FR-008).
- **Alternatives considered**: HTML-only validation (rejected: inconsistent messages, cannot enforce closed lists or trimming reliably); schema library such as Zod (rejected: extra runtime dependency for four fields).

## 10. Error handling and form preservation

- **Decision**: `apiClient` normalizes failures; the UI maps them through one table ([contracts/api-error-mapping.md](./contracts/api-error-mapping.md)). On create/edit failure the form values stay untouched in state; the form is cleared/closed only after a successful response. On `404` during edit/delete the item is reported as no longer existing and the list is refreshed. List load failures render an inline error with a "Tentar novamente" button (never a blank screen).
- **Rationale**: Directly implements FR-004, FR-005, the edge cases, and SC-003. Centralizing messages keeps wording consistent.
- **Alternatives considered**: Toast-only feedback (rejected: toasts disappear and cannot carry field errors); optimistic updates without rollback (rejected: a failed save would show data the server never accepted).

## 11. Testing strategy

- **Decision**: Vitest with jsdom, React Testing Library, `@testing-library/user-event`, and MSW for network mocking. Three layers:
  1. **Unit** — `validation.test.js`, `stockStatus.test.js` (pure rules, fast).
  2. **Integration** — one suite per user story, driving real components with mocked HTTP: create success/validation failure/network failure with preserved values; list success/error/retry/filter; edit success/rejection; delete confirm/cancel/failure.
  3. **Contract** — `api-client.test.js` asserts URLs, methods, payload shapes, headers, timeout behavior, and error normalization against the OpenAPI contract.
- **Rationale**: Satisfies Principle III (validation is mandatory) and SC-001/SC-003/SC-005 with executable evidence. MSW intercepts at the network level, so components exercise the real `apiClient`.
- **Alternatives considered**: Jest + Enzyme (rejected: Enzyme is unmaintained and not React 19 compatible); Playwright E2E (rejected as the primary gate: heavier setup; the quickstart still provides manual end-to-end verification and Playwright can be added later); snapshot tests (rejected: brittle, low confidence for behavior rules).

## 12. Local mock API for manual validation

- **Decision**: Propose a local HTTP mock with `mock/db.json`, representative foods and an npm script `mock:api` on port 3001. Evaluate `json-server` against the confirmed contract before choosing it; add an adapter or another mock if required.
- **Rationale**: The repository has no backend. A mock enables repeatable frontend validation, but cannot establish API/database integration. In particular, validation errors, 404 handling and DELETE response codes must be verified rather than assumed.
- **Alternatives considered**: MSW in the browser (rejected for manual validation: hides real network behavior such as CORS and latency); writing an Express server (rejected: more code to maintain for the same effect); requiring the external API before any validation (rejected: blocks the group and violates Principle III).

## 13. Styling and accessibility

- **Decision**: Plain CSS in `src/styles/inventory.css` with semantic class names; responsive table (cards under 640 px). Accessibility: every field has a `<label>`, errors are linked via `aria-describedby` and announced in an `aria-live="polite"` region, the delete confirmation is a focus-trapped dialog with `role="dialog"`/`aria-modal`, Escape cancels, and buttons have explicit `type`.
- **Rationale**: No CSS framework keeps the bundle small and the code reviewable (Principle I). Accessible dialogs and error announcements reduce accidental deletions and make validation feedback perceivable.
- **Alternatives considered**: Tailwind/Bootstrap (rejected: build/runtime complexity and large surface for a one-screen app); native `window.confirm` (rejected: unstyled, not testable as a component, and inconsistent across browsers).

## 14. Performance approach

- **Decision**: No virtualization; render the full filtered list (≤500 rows). Filtering and status derivation are `O(n)` pure functions executed during render. Use `AbortController` on unmount to avoid state updates after navigation.
- **Rationale**: Meets SC-002 with a large margin at the documented scale while keeping the code simple. Virtualization would add a dependency and complexity with no user-visible benefit here.
- **Alternatives considered**: `react-window` (rejected: unnecessary below ~1000 rows); memoizing every row (rejected: premature; row components stay cheap).

## 15. Confirmed group decisions

| Item | Confirmed decision | Impact if changed |
|------|------------------------------|-------------------|
| Low-stock threshold | `< 5` (after zero) | One constant + `stockStatus.test.js` expectations |
| Category list | Ingredientes, Bebidas, Hortifruti, Carnes, Laticínios, Outros | `constants.js`, select options, validation test, OpenAPI enum |
| Unit list | kg, g, L, mL, unidade, pacote | Same as above |
| API field names | English camelCase | `foodsApi`, OpenAPI contract, contract tests |

These decisions are recorded in the specification. Changes require updating the specification and associated design artifacts (Principle V).
