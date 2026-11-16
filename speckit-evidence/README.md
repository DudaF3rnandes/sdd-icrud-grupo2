# Evidências de validação — SpecKit (feature/03251036)

Execução local em 2026-11-16, após implementar as user stories da especificação
`specs/001-icrud-inventory/spec.md`.

| Verificação | Comando | Arquivo | Resultado |
| --- | --- | --- | --- |
| Testes automatizados | `npm test` | `test-output.txt` | 7 arquivos, 42 testes aprovados |
| Análise estática | `npm run lint` | `lint-output.txt` | sem erros ou avisos |
| Build de produção | `npm run build` | `build-output.txt` | sucesso; JS 73,17 kB gzip (≤ 200 kB) |
| Mock de validação | `npm run mock:api` | — | `GET /foods` 200 e `POST /foods` 201 verificados via HTTP |

## Cenários do quickstart cobertos pelos testes

- **S1** — `tests/integration/create-food.test.jsx`: validação local sem request,
  envio com trim e quantidade numérica, preservação em falha de rede e 500,
  bloqueio de quantidade negativa.
- **S2** — `tests/integration/food-list.test.jsx`: colunas e status, filtro por
  categoria, estado vazio por categoria, erro com retry e filtro preservado.
- **S3** — `tests/integration/edit-food.test.jsx`: prefill, atualização em linha,
  bloqueio local, 400 preservando edições e 404 recarregando a lista.
- **S4** — `tests/integration/delete-food.test.jsx`: diálogo sem request,
  cancelamento, exclusão confirmada, falha mantendo a linha e 404.

## Contrato da API

`tests/contract/api-client.test.js` cobre métodos, URLs, corpo JSON, cabeçalhos,
timeout de 10 s, erros de rede, 400/404/409/500 e JSON malformado conforme
`specs/001-icrud-inventory/contracts/api-error-mapping.md`.

## Observação sobre o mock

O `json-server` é usado apenas para validação manual (S1–S4). A validação
automatizada usa MSW com os status e payloads do OpenAPI, pois o `json-server`
não reproduz todas as respostas do contrato (por exemplo, `204` no DELETE).
