# iCRUD — Controle de Estoque de Alimentos

Aplicação SPA em React (Vite, JavaScript) para o gerenciamento do estoque de
alimentos de um restaurante. Implementa o CRUD completo contra uma API REST:
cadastro com validação local, listagem com filtro por categoria, edição com as
mesmas regras e exclusão com confirmação explícita. Todos os erros de rede e de
API são convertidos em mensagens em PT-BR, e os dados do formulário nunca são
descartados quando o envio falha.

## Integrantes

- Grupo 2 — SDD/iCRUD (preencher nomes dos integrantes)

## Framework utilizado

**SpecKit** (Spec-Driven Development). A escolha foi feita pelo grupo por permitir
derivar especificação, plano de implementação, tarefas e validação a partir do
mesmo conjunto de artefatos versionados. A especificação é a fonte da verdade:
as decisões de estoque, categorias, unidades e contrato da API estão registradas
em `specs/001-icrud-inventory/`, e a implementação segue esses documentos.

### Artefatos do SpecKit

| Artefato | Caminho | Responsável |
| --- | --- | --- |
| Constituição | `.specify/memory/constitution.md` | Equipe |
| Especificação | `specs/001-icrud-inventory/spec.md` | Equipe |
| Plano | `specs/001-icrud-inventory/plan.md` | João Pedro Franco |
| Pesquisa | `specs/001-icrud-inventory/research.md` | João Pedro Franco |
| Modelo de dados | `specs/001-icrud-inventory/data-model.md` | João Pedro Franco |
| Contratos | `specs/001-icrud-inventory/contracts/` | João Pedro Franco |
| Tarefas | `specs/001-icrud-inventory/tasks.md` | João Pedro Franco |
| Implementação | `src/`, `tests/`, `mock/` | Equipe (ver `tasks.md`) |
| Quickstart / validação | `specs/001-icrud-inventory/quickstart.md` | Equipe |

## Como rodar

Pré-requisitos: Node.js `^20.19.0 || >=22.12.0` e npm.

```bash
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

O `.env` aponta o front para a API:

```text
VITE_API_BASE_URL=http://localhost:3001
```

### API local (mock de validação)

Em um terminal:

```bash
npm run mock:api
```

Sobe o `json-server` em `http://localhost:3001` com os dados de `mock/db.json`.
Para usar a API real do grupo, basta apontar `VITE_API_BASE_URL` para ela e não
subir o mock.

### Aplicação

Em outro terminal:

```bash
npm run dev
```

Abra `http://localhost:5173`.

### Testes, lint e build

```bash
npm test        # Vitest: unitários, integração e contrato
npm run lint    # oxlint
npm run build   # build de produção
```

Os testes usam MSW e nunca acessam a rede real. A validação manual está descrita
em `specs/001-icrud-inventory/quickstart.md` (cenários S1–S4).

## Estrutura do código

```text
src/
├── components/   # FoodForm, FoodList, CategoryFilter, StatusBadge, ConfirmDialog, FeedbackMessage
├── hooks/        # useFoods (listagem, filtro, loading/erro e cache local)
├── lib/          # constants, validation e stockStatus (regras puras)
├── pages/        # InventoryPage (composição da tela)
├── services/     # apiClient (único módulo que chama fetch) e foodsApi
└── styles/       # inventory.css
tests/
├── unit/         # validação e status de estoque
├── integration/  # fluxos de criar, listar, editar e excluir
├── contract/     # contrato do apiClient e mapeamento de erros
└── mocks/        # handlers e servidor MSW
mock/db.json      # dados de exemplo para o json-server
```

## Regras de negócio principais

- **Status do estoque**: `0` → Esgotado; `> 0` e `< 5` → Estoque Baixo;
  `>= 5` → Disponível.
- **Categorias**: Ingredientes, Bebidas, Hortifruti, Carnes, Laticínios, Outros.
- **Unidades**: kg, g, L, mL, unidade, pacote.
- **Validação**: nome obrigatório (2–80 caracteres), quantidade numérica
  `0 ≤ q ≤ 99999.999` com até 3 casas decimais, categoria e unidade das listas
  fechadas.
- **Falhas**: mensagens amigáveis em PT-BR; formulário preservado em qualquer
  erro; exclusão somente após confirmação; `404` informa que o item não existe
  mais e recarrega a lista.

## Reflexão

- **Decisão que a spec evitou**: o agente não pôde "inventar" limites de estoque,
  categorias ou unidades; elas vieram das decisões do grupo em FR-011/FR-012.
- **Inconsistência encontrada na validação**: a suíte de contrato expôs que o
  `json-server` não devolve exatamente `201/204` como a API real; por isso a
  validação automatizada usa MSW com o contrato do OpenAPI, e o mock serve
  apenas para validação manual.
- **Como o framework ajudou**: os artefatos (`spec.md`, `plan.md`, `tasks.md`,
  `quickstart.md`) deram rastreabilidade entre requisitos, código e testes.
- **O que faríamos diferente**: validar a API real mais cedo, já que o contrato
  foi confirmado pelo grupo mas a integração real ainda precisa ser exercitada.
