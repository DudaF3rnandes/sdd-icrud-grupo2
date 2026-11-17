# Specification Quality Checklist: iCRUD Inventory Management System

# Requisitos (PT-BR)

Este arquivo resume, em português, os requisitos funcionais e critérios de sucesso relevantes
para validação durante a implementação da feature iCRUD — Inventário.

Functional Requirements (trecho resumido para rápido checklist)

- FR-001: O sistema deve permitir cadastro de novos alimentos com os campos obrigatórios: nome, quantidade, unidade de medida e categoria.
- FR-002: Validação local obrigatória antes do envio: nome não vazio (após trim), 2–80 caracteres, caracteres permitidos; quantidade numérica ≥ 0, até 3 casas decimais, ≤ 99999.999; categoria e unidade devem pertencer às listas fechadas.
- FR-003: Operações CRUD via API REST conforme contrato (list, create, update, delete).
- FR-004: Tratamento de erros da API e de rede com mensagens PT-BR amigáveis.
- FR-005: Preservar todos os dados do formulário em caso de falha de envio (network/5xx/errors da API).
- FR-006: Exibir listagem estruturada com nome, quantidade, unidade, categoria e status.
- FR-007: Permitir filtragem da listagem por categoria (incluindo opção "Todas").
- FR-008: Permitir edição com mesmas regras de validação do cadastro.
- FR-009: Confirmação explícita antes de exclusão.
- FR-010 / FR-011: Regras de status do estoque: 0 → "Esgotado"; 0 < q < 5 → "Estoque Baixo"; q ≥ 5 → "Disponível".
- FR-012: Categorias permitidas: Ingredientes, Bebidas, Hortifruti, Carnes, Laticínios, Outros. Unidades: kg, g, L, mL, unidade, pacote.

Success Criteria (resumo mensurável)

- SC-001: Validação local bloqueia 100% das submissões inválidas (nenhuma requisição indevida enviada).
- SC-002: Listagem visível em < 2s em rede normal (meta de performance do bundle e fetch).
- SC-003: 100% de preservação dos dados do formulário em caso de falha de envio.
- SC-005: 100% das exclusões exibem diálogo de confirmação prévio.

Checklist rápido para revisão antes de marcar história como completa

1. Há testes unitários cobrindo `lib/validation.js` e `lib/stockStatus.js` (validações de limite e formatos).
2. Há testes de contrato para `apiClient` cobrindo timeout, network, 400 (fieldErrors), 404 e 500.
3. Há testes de integração que exercitam create, list+filter, edit, delete e preservação de formulário em falhas.
4. O `FoodForm` preserva valores em falhas e exibe `fieldErrors` retornados pela API.
5. `ConfirmDialog` é acessível e impede exclusão sem confirmação.

Observação: este documento é uma tradução/resumo de partes relevantes da spec.md e serve como checklist em PT-BR
para revisões rápidas e validação por QA.