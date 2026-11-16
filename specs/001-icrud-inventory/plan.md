# Implementation Plan: iCRUD Inventory Management System

**Branch Git atual**: `feature/03251030` | **Identificador da feature**: `001-icrud-inventory` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Estado do planejamento: decisões de design confirmadas pelo grupo.** A validação end-to-end com API e banco reais permanece obrigatória durante a implementação.

**Input**: Feature specification from `/specs/001-icrud-inventory/spec.md`

## Summary

Build the iCRUD food-inventory front end as a single-page React application (Vite, JavaScript) that performs full CRUD against an external REST API: create foods with local validation, list and filter by category, edit existing items, and delete with explicit confirmation. All API failures (network, timeout, HTTP 4xx/5xx) are translated into friendly PT-BR messages; form values are never discarded on submission failure, and the stock status (`Disponível`, `Estoque Baixo`, `Esgotado`) is derived from quantity on the client.

Technical approach: keep the stack minimal per the constitution — React function components + hooks, one `apiClient` module wrapping `fetch`, one custom `useFoods` hook for list state, a single inventory page composed of presentational components, and plain CSS. Add only development-time tooling (Vitest + React Testing Library + MSW for automated validation, `json-server` for a local mock API used in manual end-to-end validation).

## Technical Context

**Language/Version**: JavaScript ES2022 + JSX (React 19.3); Node.js `^20.19.0 || >=22.12.0` for the installed Vite version

**Primary Dependencies**: React 19.3, React DOM 19.3, Vite 8.3, oxlint 1.90. Dev-only additions: Vitest, @testing-library/react, @testing-library/user-event, jsdom, MSW, json-server

**Storage**: No client-side persistence. The external REST API is the single source of truth; form drafts live only in React state (no `localStorage`)

**Testing**: Vitest + React Testing Library + jsdom + MSW (component/integration/contract tests); `oxlint` for static analysis. Manual E2E validation documented in [quickstart.md](./quickstart.md)

**Target Platform**: Modern desktop browsers (last 2 versions of Chrome, Edge, Firefox, Safari); responsive down to 360 px width

**Project Type**: Single-project web SPA (frontend only; backend/API is external to this repository)

**Performance Goals**: Inventory list visible in under 2 s on a normal network (SC-002); UI interactions respond in under 100 ms; initial JS bundle ≤ 200 KB gzip

**Constraints**: API base URL configured via `VITE_API_BASE_URL` (default `http://localhost:3001`); request timeout of 10 s; PT-BR user-facing text; no new runtime dependencies beyond React

**Scale/Scope**: One restaurant, up to ~500 food records, one main screen plus form/dialog overlays, 6 categories, 6 units of measure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Código Simples e Sustentável | No state-management library, router, or CSS framework; one API module, one data hook, presentational components; new dependencies limited to dev tooling | PASS |
| II. Organização e Rastreabilidade | Work is traceable to FR-001…FR-010; `tasks.md` (Phase 2) will map every task to a requirement/user story; feature artifacts live under `specs/001-icrud-inventory/` | PASS |
| III. Validação Obrigatória | Automated unit/integration/contract tests plus a manual quickstart scenario per user story define "done"; no feature is complete on code alone | PASS |
| IV. Integração Consistente | The group confirmed the API contract; end-to-end validation through the real API and database is required during implementation | PASS (design) |
| V. Consistência com Especificação | Confirmed stock rules and closed lists are recorded in the specification | PASS |

Design gates pass. Development-only tooling and a mock are proposed for validation, not substitutes for validation against the real API and database.

## Project Structure

### Documentation (this feature)

```text
specs/001-icrud-inventory/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── openapi.yaml             # REST contract consumed by the SPA
│   └── api-error-mapping.md     # HTTP/network failure → UI behavior contract
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── FoodForm.jsx            # Create/edit form with validation feedback
│   ├── FoodList.jsx            # Table/grid of foods + empty/loading/error states
│   ├── CategoryFilter.jsx      # Category filter control
│   ├── ConfirmDialog.jsx       # Accessible delete confirmation
│   ├── StatusBadge.jsx         # Disponível / Estoque Baixo / Esgotado
│   └── FeedbackMessage.jsx     # Success/error banners with optional retry
├── pages/
│   └── InventoryPage.jsx       # Composes the screen, owns filter + form mode
├── services/
│   ├── apiClient.js            # Only module that calls fetch; timeout + error mapping
│   └── foodsApi.js             # listFoods / createFood / updateFood / deleteFood
├── hooks/
│   └── useFoods.js             # List loading/error/retry + local cache updates
├── lib/
│   ├── constants.js            # Categories, units, low-stock threshold
│   ├── validation.js           # validateFood(form) → field errors
│   └── stockStatus.js          # Quantity → status mapping
├── styles/
│   └── inventory.css           # Feature styles (plain CSS)
├── App.jsx                     # Renders InventoryPage
└── main.jsx

tests/
├── unit/
│   ├── validation.test.js
│   └── stockStatus.test.js
├── integration/
│   ├── create-food.test.jsx
│   ├── food-list.test.jsx
│   ├── edit-food.test.jsx
│   └── delete-food.test.jsx
└── contract/
    └── api-client.test.js

mock/
├── db.json                     # Sample foods for json-server
└── routes.json                 # Optional json-server route config

.env.example                    # VITE_API_BASE_URL=http://localhost:3001
vitest.config.js                # jsdom environment + setup file
```

**Structure Decision**: Single-project frontend layout (Option 1 adapted for a Vite SPA). The repository contains only the React client; the REST API is external per the spec's Assumptions. `src/services/` isolates HTTP concerns from UI, satisfying Principle IV, while `src/lib/` holds pure, unit-testable rules (validation, stock status). Tests are grouped by confidence level: pure unit rules, user-facing integration flows with a mocked network, and API-client contract checks.

## Phase 0: Research Outcomes

See [research.md](./research.md). The group confirmed the stock threshold, allowed lists and API contract; real integration validation remains an implementation obligation.

## Phase 1: Design Outcomes

- **Entities and rules**: [data-model.md](./data-model.md)
- **REST contract**: [contracts/openapi.yaml](./contracts/openapi.yaml)
- **Failure-handling contract**: [contracts/api-error-mapping.md](./contracts/api-error-mapping.md)
- **End-to-end validation guide**: [quickstart.md](./quickstart.md)

### Requirement traceability

| Requirement | Design coverage | Primary validation |
|-------------|-----------------|--------------------|
| FR-001 create food | POST `/foods`, `FoodForm` (create mode) | `create-food.test.jsx` |
| FR-002 local validation | `lib/validation.js` rules table | `validation.test.js`, form tests |
| FR-003 REST CRUD | `contracts/openapi.yaml`, `services/*` | `api-client.test.js` |
| FR-004 API/network error handling | `api-error-mapping.md`, `apiClient`, `FeedbackMessage` | integration failure cases |
| FR-005 preserve form on failure | Form state owned by `InventoryPage`/`FoodForm`, cleared only on success | create/edit failure tests |
| FR-006 structured listing | `FoodList`, `StatusBadge` | `food-list.test.jsx` |
| FR-007 category filter | `CategoryFilter` (client-side filter) | `food-list.test.jsx` |
| FR-008 edit with same rules | `FoodForm` (edit mode), PUT `/foods/{id}` | `edit-food.test.jsx` |
| FR-009 delete confirmation | `ConfirmDialog`, DELETE `/foods/{id}` | `delete-food.test.jsx` |
| FR-010 stock status rules | `lib/stockStatus.js`, threshold in `constants.js` | `stockStatus.test.js` |
| FR-011 status thresholds | `lib/stockStatus.js`, threshold in `constants.js` | `stockStatus.test.js` boundary cases |
| FR-012 allowed categories and units | `lib/constants.js`, `FoodForm`, OpenAPI enums | validation and form tests |

## Post-Design Constitution Check

| Principle | Re-evaluation after Phase 1 | Status |
|-----------|-----------------------------|--------|
| I. Simplicity | Final structure adds no runtime library; form, list, filter, dialog, and badge are small focused components; status logic is a pure function | PASS |
| II. Organization & traceability | Traceability table above links every FR to a design artifact and test; artifacts reside in the feature folder | PASS |
| III. Mandatory validation | Each user story has an automated integration suite and a quickstart scenario; contract tests cover the API boundary | PASS |
| IV. Consistent integration | Group confirmed OpenAPI; implementation must validate real API and database integration | PASS (design) |
| V. Spec consistency | Confirmed threshold and lists are recorded in FR-011 and FR-012 | PASS |

Design gates pass. Real end-to-end integration remains a mandatory completion criterion. Complexity Tracking remains empty.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
