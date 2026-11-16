# Data Model: iCRUD Inventory Management System

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-15

This model covers the client-side representation of a food record and the UI states needed to satisfy FR-001…FR-010. The REST transport shape is defined in [contracts/openapi.yaml](./contracts/openapi.yaml).

The group confirmed the threshold, category and unit values and transport contract below. Actual API and database integration must still be validated during implementation.

---

## Entity: Food (Alimento)

| Field | API key | Type | Required | Rules |
|-------|---------|------|----------|-------|
| Identifier | `id` | string | Server-assigned | Read-only in the UI; opaque (UUID or numeric string); used in `PUT`/`DELETE` URLs |
| Name | `name` | string | Yes | Trimmed before validation and submission; 2–80 characters; letters (incl. accented), digits, spaces, `-`, `'`, `.`, `(`, `)` only; cannot be only whitespace/symbols (FR-001, FR-002) |
| Quantity | `quantity` | number | Yes | `0 ≤ quantity ≤ 99999.999`; at most 3 decimal places; `0` is valid and means "Esgotado" (edge case) |
| Unit of measure | `unit` | enum string | Yes | One of `kg`, `g`, `L`, `mL`, `unidade`, `pacote` (decision in research.md §2) |
| Category | `category` | enum string | Yes | One of `Ingredientes`, `Bebidas`, `Hortifruti`, `Carnes`, `Laticínios`, `Outros` (stored with accents in the UI; API enum values per contract) |
| Stock status | — (derived) | enum | Computed | `esgotado` when `quantity = 0`; `estoque-baixo` when `0 < quantity < 5`; `disponivel` when `quantity ≥ 5`. Never sent to or received from the API (FR-010) |
| Created at | `createdAt` | ISO 8601 string | Optional | Display/debug only; not edited |
| Updated at | `updatedAt` | ISO 8601 string | Optional | Display/debug only; not edited |

**Identity**: `id` is unique per food and is the key used for list rendering, update, and delete.

**Relationships**: None. Categories and units are fixed enumerations, not entities with their own lifecycle (no CRUD for them in this feature).

---

## Value object: FoodFormValues

The editable subset used by both create and edit forms.

| Field | Type | Initial value (create) | Source (edit) |
|-------|------|------------------------|---------------|
| `name` | string | `''` | `food.name` |
| `quantity` | string | `''` | `String(food.quantity)` |
| `unit` | string | `''` | `food.unit` |
| `category` | string | `''` | `food.category` |

`quantity` is kept as a string while editing so intermediate values such as `"0."` are representable; it is converted to a number only after validation passes. This is what makes field preservation on failure straightforward (FR-005).

**Validation error shape**: `Record<'name' | 'quantity' | 'unit' | 'category' | 'form', string>`. `form` holds a non-field error (e.g. server rejection message).

---

## Validation rules (FR-002, FR-008)

| Rule ID | Field | Condition | Message (PT-BR) |
|---------|-------|-----------|-----------------|
| V-01 | `name` | empty after trim | "Informe o nome do alimento." |
| V-02 | `name` | length < 2 or > 80 after trim | "O nome deve ter entre 2 e 80 caracteres." |
| V-03 | `name` | contains characters outside the allowed set | "O nome contém caracteres inválidos." |
| V-04 | `quantity` | empty | "Informe a quantidade em estoque." |
| V-05 | `quantity` | not a finite number | "Informe uma quantidade numérica." |
| V-06 | `quantity` | `< 0` | "A quantidade não pode ser negativa." |
| V-07 | `quantity` | `> 99999.999` or more than 3 decimals | "A quantidade deve ser no máximo 99.999,999 com até 3 casas decimais." |
| V-08 | `category` | not in category list | "Selecione uma categoria válida." |
| V-09 | `unit` | not in unit list | "Selecione uma unidade de medida válida." |

**Submission rule**: if any rule fails, no HTTP request is issued (SC-001). Editing applies the identical rule set (FR-008).

---

## Derived status rules (FR-010)

```text
quantity == 0            → esgotado        ("Esgotado")
0 < quantity < 5         → estoque-baixo   ("Estoque Baixo")
quantity >= 5            → disponivel      ("Disponível")
```

The threshold lives in `LOW_STOCK_THRESHOLD = 5` inside `src/lib/constants.js` (research.md §1). Status transitions occur only when quantity changes; they are not persisted, so a refetch always recomputes them consistently.

---

## State models

### Form state

```text
idle ──edit/submit──► validating ──invalid──► idle (field errors shown, values kept)
                           │
                           └──valid──► submitting ──success──► success (form reset/closed, list updated)
                                              │
                                              └──failure──► idle (values kept, form error shown)
```

Invariants:
- Form values are mutated only by user input and by a successful response.
- `submitting` disables the submit button to prevent duplicate requests.
- On failure of any kind (network, timeout, 4xx, 5xx) the values remain exactly as typed (FR-005, SC-003).

### List state

```text
loading ──success──► loaded ──filter change──► loaded (client-side filtered view)
   │                    │
   │                    └──create/update/delete success──► loaded (cache updated)
   └──failure──► error (message + "Tentar novamente") ──retry──► loading
```

Invariants:
- The screen never renders blank: `loading`, `error`, `empty`, and `loaded` all have explicit UI (edge case).
- The selected category filter is preserved across retries and mutations.

### Delete flow state

```text
idle ──request delete──► confirming ──cancel/Escape──► idle (no request)
                              │
                              └──confirm──► deleting ──success──► idle (row removed)
                                                   └──failure──► idle (row retained + error message)
```

Invariants:
- A `DELETE` request is sent only after explicit confirmation (FR-009, SC-005).
- A failed delete never removes the row locally.
- A `404` on delete/edit means the record is already gone: show "Este alimento não existe mais." and refresh the list.

---

## Request payloads (see contracts/openapi.yaml)

| Operation | Request | Success response |
|-----------|---------|------------------|
| List | `GET /foods` | `200` array of Food |
| Create | `POST /foods` `{ name, quantity, unit, category }` | `201` Food (with `id`) |
| Update | `PUT /foods/{id}` `{ name, quantity, unit, category }` | `200` Food |
| Delete | `DELETE /foods/{id}` | `204` no body |

Status, `createdAt`, and `updatedAt` are never part of write payloads.
