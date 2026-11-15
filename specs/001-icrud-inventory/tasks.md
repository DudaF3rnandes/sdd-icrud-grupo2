Tasks: iCRUD Inventory Management System

Input: Design documents from /specs/001-icrud-inventory/

Prerequisites: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

Tests: Included because the project constitution (Principle III — Validação Obrigatória) and the plan make automated validation the completion gate for every requirement. Write each story's tests before its implementation.

Organization: Tasks are grouped by user story to enable independent implementation and testing.

Responsáveis por etapa
/speckit.plan — João Pedro Franco
/speckit.tasks — João Pedro Franco
/speckit.implement — João Pedro Franco
Format: [ID] [P?] [Story] Description
[P]: Can run in parallel (different files, no dependencies)
[Story]: Which user story this task belongs to (US1, US2, US3, US4)
Every task includes its exact file path
Path Conventions

Single-project Vite SPA: src/, tests/, mock/ at repository root (per plan.md).

Phase 1: Setup (Shared Infrastructure)

Purpose: Project initialization, test tooling, and local mock API.

 T001 Create the feature directory structure: src/components/, src/pages/, src/services/, src/hooks/, src/lib/, src/styles/, tests/unit/, tests/integration/, tests/contract/, tests/mocks/, and mock/ at the repository root
 T002 Install dev dependencies and add scripts in package.json: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, msw, json-server; add "test": "vitest run", "test:watch": "vitest", "mock:api": "json-server --watch mock/db.json --port 3001"
 T003 [P] Create .env.example containing VITE_API_BASE_URL=http://localhost:3001 and add .env to .gitignore (keep .env.example tracked)
 T004 [P] Create vitest.config.js with environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.js'], and include patterns for tests/**/*.test.{js,jsx}
 T005 [P] Create tests/setup.js importing @testing-library/jest-dom/vitest, starting/stopping the MSW server from tests/mocks/server.js, and resetting handlers after each test
 T006 [P] Create tests/mocks/server.js with MSW handlers for GET /foods, POST /foods, PUT /foods/:id, and DELETE /foods/:id using the payloads and status codes in specs/001-icrud-inventory/contracts/openapi.yaml
 T007 [P] Create mock/db.json with at least six seed foods covering all statuses (quantity: 0, 1–4, ≥5) and every category, using the field names and enums from specs/001-icrud-inventory/contracts/openapi.yaml
 T008 [P] Replace the Vite starter content in src/App.jsx, src/main.jsx, and src/index.css with a minimal app shell (keep StrictMode, remove the counter/hero demo and its src/App.css import; leave src/assets/ untouched until Phase 7)

Checkpoint: npm test starts and reports no tests, npm run mock:api serves http://localhost:3001/foods.

Phase 2: Foundational (Blocking Prerequisites)

Purpose: Shared rules, API client, and app scaffolding required by every story.

⚠️ CRITICAL: No user story work can begin until this phase is complete.

 T009 Create src/lib/constants.js with LOW_STOCK_THRESHOLD = 5, CATEGORIES = ['Ingredientes','Bebidas','Hortifruti','Carnes','Laticínios','Outros'], UNITS = ['kg','g','L','mL','unidade','pacote'], PT-BR status labels (Disponível, Estoque Baixo, Esgotado), and the API↔label mapping tables
 T010 [P] Create src/lib/stockStatus.js exporting getStockStatus(quantity): quantity === 0 → esgotado; 0 < quantity < LOW_STOCK_THRESHOLD → estoque-baixo; quantity >= LOW_STOCK_THRESHOLD → disponivel
 T011 [P] Create src/lib/validation.js exporting validateFood(values) with the rules and PT-BR messages from specs/001-icrud-inventory/data-model.md: name required after trim, 2–80 chars, only letters (incl. accented), digits, spaces and - ' . ( ); quantity required, finite, 0 ≤ quantity ≤ 99999.999, at most 3 decimals; category and unit must be in the closed lists; return a { field: message } map and never throw
 T012 [P] Create src/services/apiClient.js with a single request(path, options) wrapper over native fetch: 10 s AbortController timeout, JSON headers, ApiError { kind: 'network'|'timeout'|'http', status, message, fieldErrors } normalization, and mapping exactly as specified in specs/001-icrud-inventory/contracts/api-error-mapping.md
 T013 [P] Create src/services/foodsApi.js exporting listFoods(), createFood(payload), updateFood(id, payload), and deleteFood(id) calling apiClient.request with the URLs, methods, and bodies from specs/001-icrud-inventory/contracts/openapi.yaml
 T014 [P] Create src/components/FeedbackMessage.jsx: role="status"/role="alert" banner with variant (success/error), optional onRetry button labeled Tentar novamente, and Dismiss action; render nothing when there is no message
 T015 [P] Create tests/unit/stockStatus.test.js covering 0 → esgotado, 0.001, 1, 4.999 → estoque-baixo, and 5, 100 → disponivel
 T016 [P] Create tests/unit/validation.test.js covering V-01 to V-09: empty name, 1 char, 81 chars, invalid characters, empty/negative/non-numeric quantity, 100000, 4 decimals, and invalid category/unit; assert no request would be needed
 T017 Create tests/contract/api-client.test.js asserting methods, URLs, JSON bodies, and headers for all four operations; error normalization for network rejection, aborted timeout, 400 with fieldErrors, 404, and 500; and that list/create/update/delete never mutate inputs
 T018 Create src/styles/inventory.css with base tokens (colors, spacing, typography), app shell, form/list containers, visible focus outlines, error/success text styles, and a @media (max-width: 640px) breakpoint
 T019 Create src/pages/InventoryPage.jsx as the single screen scaffold (page heading, FeedbackMessage region, and placeholders for form/list) and wire it into src/App.jsx; import src/styles/inventory.css

Checkpoint: npm test passes unit and contract suites; the app renders the empty inventory shell.

Phase 3: User Story 1 — Cadastro, Validação e Persistência (Priority: P1) 🎯 MVP

Goal: Create foods with local validation, API persistence, success confirmation, and full form preservation on failure.

Independent Test: Fill the form with valid data and confirm the record is created in the API; submit invalid data and confirm no request is sent; simulate a network failure and confirm every typed value remains in the form.

Tests for User Story 1

Write first and confirm they fail before implementation.

 T020 [P] [US1] Create tests/integration/create-food.test.jsx covering: empty submit blocks the request and shows V-01/V-04/V-08/V-09 messages; valid submit sends POST /foods with trimmed name and numeric quantity; 201 shows success and resets the form; network failure and 500 show the error banner and keep name, quantity, category, and unit exactly as typed; negative quantity is blocked locally
Implementation for User Story 1
 T021 [US1] Create src/components/FoodForm.jsx in create mode: labeled fields for name, quantity (inputMode="decimal"), category, and unit selects built from CATEGORIES/UNITS; blur validation; submit handler that trims name, converts quantity to a number, runs validateFood, renders field errors with aria-describedby, and disables the submit button while submitting
 T022 [US1] Integrate create in src/pages/InventoryPage.jsx: own FoodFormValues state, call createFood on valid submit, show success feedback on 201, keep values on any ApiError, and reset values only after success; map ApiError.fieldErrors onto matching form fields
 T023 [US1] Add create-form styles to src/styles/inventory.css: two-column desktop grid, single-column under 640 px, inline field errors, disabled button state, and aria-live message region styling
 T024 [US1] Run npm test -- tests/integration/create-food.test.jsx and execute scenarios S1.1–S1.6 in specs/001-icrud-inventory/quickstart.md against npm run mock:api; fix any deviation before marking the story complete

Checkpoint: US1 works end-to-end on its own (create, validate, preserve on failure) and is demonstrable as the MVP.

Phase 4: User Story 2 — Visualização e Filtragem do Estoque (Priority: P1)

Goal: Display every food with name, quantity, unit, category, and derived status; filter by category; recover from load failures without blank screens.

Independent Test: Load the page against seeded data, verify all columns and statuses, select each category filter, and stop the API to confirm the error state and working retry.

Tests for User Story 2
 T025 [P] [US2] Create tests/integration/food-list.test.jsx covering: successful load renders name/quantity/unit/category/status for each row; Esgotado, Estoque Baixo, and Disponível badges match quantities 0, 3, 10; filtering by Bebidas hides other categories and Todas restores the list; empty category shows the empty-state text; 500 or network failure shows the retry banner and clicking Tentar novamente reloads successfully; the previous filter is preserved across retry
Implementation for User Story 2
 T026 [P] [US2] Create src/components/StatusBadge.jsx rendering the PT-BR label and a distinct style per getStockStatus value (disponivel, estoque-baixo, esgotado), with status conveyed by text and not color alone
 T027 [US2] Create src/hooks/useFoods.js exposing { foods, loading, error, selectedCategory, setSelectedCategory, filteredFoods, reload }, loading on mount, aborting on unmount, and providing replaceFood, appendFood, and removeFood helpers for later stories
 T028 [P] [US2] Create src/components/CategoryFilter.jsx as a labeled <select> with Todas plus CATEGORIES; controlled by selectedCategory and onChange
 T029 [US2] Create src/components/FoodList.jsx rendering a semantic table (cards under 640 px) with columns Nome, Quantidade, Unidade, Categoria, Status; include explicit loading, empty (Nenhum alimento cadastrado. / Nenhum alimento nesta categoria.), and error states with a Tentar novamente action; leave an actions column extensible for US3/US4
 T030 [US2] Integrate list and filter in src/pages/InventoryPage.jsx: call useFoods, render CategoryFilter above FoodList, keep the create form usable when the list fails, and refresh the list after a successful create (via appendFood)
 T031 [US2] Add table, badge, filter, and responsive card styles to src/styles/inventory.css (status colors with text labels, zebra rows, horizontal scroll fallback)
 T032 [US2] Run npm test -- tests/integration/food-list.test.jsx and execute scenarios S2.1–S2.4 in specs/001-icrud-inventory/quickstart.md; fix any deviation before marking the story complete

Checkpoint: US1 and US2 both work independently; the page shows a complete, filterable inventory and survives API downtime.

Phase 5: User Story 3 — Atualização de Alimentos (Priority: P2)

Goal: Edit an existing food with the same validation rules, update it in place, and keep edits when the API rejects the change.

Independent Test: Select a row, change quantity, save, and verify the row and API are updated; submit invalid data and confirm it is blocked; force a 400/404 and confirm edits remain visible with the server message.

Tests for User Story 3
 T033 [P] [US3] Create tests/integration/edit-food.test.jsx covering: opening edit prefills current values; saving sends PUT /foods/{id} with trimmed/numeric payload and updates the row in place; changing quantity 10 → 3 updates the badge to Estoque Baixo; negative quantity is blocked locally; 400 keeps all edits and shows the server/field message; 404 shows Este alimento não existe mais. and refreshes the list
Implementation for User Story 3
 T034 [US3] Extend src/components/FoodForm.jsx with an initialValues/mode (create | edit) contract: prefill fields, change the submit label to Salvar alterações, keep a Cancelar action, and preserve values on failed submit
 T035 [US3] Add edit actions to src/components/FoodList.jsx (per-row Editar button calling onEdit(food)) and use replaceFood from useFoods so updated records replace the existing row without refetching
 T036 [US3] Integrate edit mode in src/pages/InventoryPage.jsx: track editingFood, open the form with its values, call updateFood, close and show success only on 200, retain edits on failure, and on 404 show the not-found message + reload()
 T037 [US3] Add edit-mode styles (form heading with record name, action buttons, row action alignment) to src/styles/inventory.css
 T038 [US3] Run npm test -- tests/integration/edit-food.test.jsx and execute scenarios S3.1–S3.4 in specs/001-icrud-inventory/quickstart.md; fix any deviation before marking the story complete

Checkpoint: US1–US3 work independently; edits are validated, persisted, and never lost on failure.

Phase 6: User Story 4 — Exclusão com Confirmação (Priority: P3)

Goal: Delete a food only after explicit confirmation, keep the row on failure, and handle already-deleted records.

Independent Test: Request deletion, cancel and verify no request is sent, then confirm and verify removal from the list and API; force a failure and confirm the row stays visible.

Tests for User Story 4
 T039 [P] [US4] Create tests/integration/delete-food.test.jsx covering: clicking Excluir opens a dialog naming the food and sends no request; Cancelar/Escape closes it with no request and the row intact; confirming sends DELETE /foods/{id}, removes the row on 204, and shows success; network/500 failure keeps the row and shows the error; 404 shows the already-removed message and refreshes the list
Implementation for User Story 4
 T040 [US4] Create src/components/ConfirmDialog.jsx: accessible modal (role="dialog", aria-modal="true", labelled by title), initial focus on Cancelar, focus trap, Escape to cancel, and Confirmar exclusão/Cancelar buttons; renders nothing when closed
 T041 [US4] Add a per-row Excluir action to src/components/FoodList.jsx calling onDelete(food), disabled while a deletion is in progress
 T042 [US4] Integrate delete in src/pages/InventoryPage.jsx: track foodToDelete and deleting, show ConfirmDialog, call deleteFood only after confirmation, call removeFood on 204, keep the row and show the mapped error on failure, and reload() on 404
 T043 [US4] Add dialog backdrop, panel, and destructive-button styles to src/styles/inventory.css, including a visible focus ring and mobile sizing
 T044 [US4] Run npm test -- tests/integration/delete-food.test.jsx and execute scenarios S4.1–S4.4 in specs/001-icrud-inventory/quickstart.md; fix any deviation before marking the story complete

Checkpoint: All four user stories work independently and together; no destructive action can bypass confirmation.

Phase 7: Polish & Cross-Cutting Concerns

Purpose: Hardening, documentation, and full-system validation.

 T045 [P] Audit accessibility in src/components/FoodForm.jsx, src/components/FoodList.jsx, src/components/ConfirmDialog.jsx, and src/components/FeedbackMessage.jsx: every input has a <label>, errors use aria-describedby, messages live in aria-live="polite" regions, dialog traps focus and restores it on close, and all icons/actions have accessible names
 T046 [P] Update README.md with the project overview, chosen framework and rationale, npm install / npm run mock:api / npm run dev / npm test commands, artifact paths (specs/001-icrud-inventory/spec.md, plan.md, tasks.md), and task ownership placeholders
 T047 [P] Record the confirmed group decisions (low-stock threshold, category/unit lists, API field naming) in the Ambiguities & Group Decisions Pending section of specs/001-icrud-inventory/spec.md; if values changed, update research.md, data-model.md, contracts/openapi.yaml, and src/lib/constants.js together
 T048 [P] Remove unused Vite starter files (src/App.css, src/assets/hero.png, src/assets/react.svg, src/assets/vite.svg) and the unused public/icons.svg/public/vite.svg references, then confirm src/main.jsx and src/App.jsx contain no dead imports
 T049 Run npm run lint, and resolve every oxlint error or warning in src/ and tests/
 T050 Run npm test (all unit, integration, and contract suites) and npm run build; confirm the build succeeds and the initial JS bundle is ≤ 200 KB gzip (SC-002), adjusting imports if it is not
 T051 Execute scenarios S1–S4 in specs/001-icrud-inventory/quickstart.md end-to-end with npm run mock:api + npm run dev, including the optional manual API checks table; record results in the PR description
 T052 Review src/pages/InventoryPage.jsx for duplicated state/handlers and extract only if it improves clarity; confirm no component except src/services/apiClient.js calls fetch and no form failure path clears values (Principle IV, FR-005)
Dependencies & Execution Order
Phase Dependencies
Setup (Phase 1): No dependencies.
Foundational (Phase 2): Depends on Setup; blocks all user stories.
US1 (Phase 3): Depends on Foundational. No story dependencies.
US2 (Phase 4): Depends on Foundational; edits src/pages/InventoryPage.jsx created in US1 for form/list composition and reuses FeedbackMessage.
US3 (Phase 5): Depends on US1 (FoodForm) and US2 (FoodList, useFoods).
US4 (Phase 6): Depends on US2 (FoodList, useFoods); independent of US3.
Polish (Phase 7): Depends on all targeted stories.
User Story Dependencies
US1 (P1): Fully independent after Foundational — shippable MVP.
US2 (P1): Independent for testing; integrates with US1 on the shared page.
US3 (P2): Needs US1's form and US2's list as entry points; testable on its own.
US4 (P3): Needs US2's list rows; testable on its own.
Within Each User Story
Tests first (must fail), then components, then page integration, then styles, then run the story's validation.
src/lib/* and src/services/* are complete in Foundational, so stories do not re-implement rules or HTTP.
Parallel Opportunities
Phase 1: T003–T008 are independent.
Phase 2: T010–T016 are independent; T017 depends on T012/T013; T018/T019 can proceed alongside.
US1: T020 (test) can be written in parallel with T021 (form component).
US2: T025–T026, T028 can run in parallel; T027/T029 feed T030.
US3: T033 can run alongside T034; T035 and T036 must be sequenced.
US4: T039 can run alongside T040; T041/T042 must be sequenced.
Polish: T045–T048 are parallelizable; T049–T052 run after code is stable.
Parallel Example: User Story 2
text
Task: "Create tests/integration/food-list.test.jsx"
Task: "Create src/components/StatusBadge.jsx"
Task: "Create src/components/CategoryFilter.jsx"
Parallel Example: Phase 2
text
Task: "Create src/lib/stockStatus.js"
Task: "Create src/lib/validation.js"
Task: "Create src/services/apiClient.js"
Task: "Create src/services/foodsApi.js"
Task: "Create src/components/FeedbackMessage.jsx"
Task: "Create tests/unit/stockStatus.test.js"
Task: "Create tests/unit/validation.test.js"
Implementation Strategy
MVP First (User Story 1)
Complete Phase 1 (Setup) and Phase 2 (Foundational).
Complete Phase 3 (US1).
STOP and VALIDATE: npm test -- tests/integration/create-food.test.jsx plus quickstart S1.
Demo the create flow with validation and failure preservation.
Incremental Delivery
Setup + Foundational → foundation ready.
US1 → validate → demo (MVP).
US2 → validate → demo (complete P1 read/create experience).
US3 → validate → demo.
US4 → validate → demo.
Polish → full quickstart + build + lint.
Parallel Team Strategy

After Foundational, with up to four developers:

Developer A: US1 (FoodForm, create integration).
Developer B: US2 (useFoods, FoodList, CategoryFilter, StatusBadge) — coordinate on InventoryPage.jsx.
Developer C: US3 after US1+US2 land (edit mode).
Developer D: US4 after US2 lands (ConfirmDialog, delete flow).

Because US1–US4 share InventoryPage.jsx and src/styles/inventory.css, serialize edits to those two files or assign them to one owner per iteration.

Notes
[P] = different files, no dependency on an incomplete task.
[Story] labels map tasks to user stories for traceability (FR-001…FR-010).
Every story ends with an executable checkpoint; do not proceed while its tests fail.
Commit after each task or logical group.
Tests use MSW, never the real network; manual validation uses npm run mock:api.
Avoid changing src/lib/constants.js values without updating the spec, contract, and tests together.