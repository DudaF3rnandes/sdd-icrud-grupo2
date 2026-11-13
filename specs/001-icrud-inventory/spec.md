# Feature Specification: iCRUD Inventory Management System

**Feature Branch**: `001-icrud-inventory`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Especifique o sistema de gerenciamento de estoque de alimentos do iCRUD com base nas decisões já definidas pelo grupo. O sistema deve contemplar cadastro de alimentos, listagem, filtragem por categoria, edição, exclusão com confirmação, integração com API REST, tratamento de erros da API, validação, categorias, unidades de medida, quantidade em estoque, regras de status, falhas de rede, preservação de formulário e critérios de sucesso."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastro, Validação e Persistência de Alimentos (Priority: P1)

Como gerente ou operador do restaurante, quero cadastrar novos alimentos no sistema informando nome, quantidade em estoque, unidade de medida e categoria, para iniciar e manter o controle dos suprimentos disponíveis.

**Why this priority**: O cadastro é a funcionalidade fundacional para introduzir dados no sistema de estoque, sendo pré-requisito para listagem, consulta e movimentações.

**Independent Test**: Pode ser testado isoladamente preenchendo o formulário de cadastro com dados válidos e inválidos, verificando a persistência via API e o correto comportamento de validação e preservação de campos em caso de erro.

**Acceptance Scenarios**:

1. **Given** que o usuário está na tela de cadastro, **When** preenche o nome com texto válido, quantidade numérica não negativa, seleciona uma categoria da lista e uma unidade de medida válida, e submete o formulário, **Then** o sistema envia os dados para a API REST, salva o registro com sucesso e exibe uma confirmação visual.
2. **Given** que o usuário preenche dados inválidos (ex: quantidade negativa, nome vazio ou campos obrigatórios em branco), **When** tenta submeter o formulário, **Then** o sistema impede o envio, destaca os campos inválidos e exibe mensagens de erro explicativas de validação.
3. **Given** que ocorre uma falha de rede ou erro na API durante o envio do cadastro, **When** a requisição falha, **Then** o sistema exibe um aviso amigável de erro de comunicação e **preserva todos os dados digitados** no formulário para que o usuário não precise redigitá-los.

---

### User Story 2 - Visualização e Filtragem do Estoque (Priority: P1)

Como gerente ou operador, quero visualizar todos os alimentos cadastrados em uma lista organizada e poder filtrá-los por categoria, para consultar rapidamente a disponibilidade dos itens.

**Why this priority**: Essencial para a consulta diária do estoque e acompanhamento dos produtos disponíveis.

**Independent Test**: Pode ser testado carregando a tela de listagem com registros existentes e aplicando filtros de categoria para verificar se apenas os itens correspondentes são exibidos.

**Acceptance Scenarios**:

1. **Given** que há alimentos cadastrados no sistema, **When** o usuário acessa a tela de listagem, **Then** o sistema exibe uma tabela ou grade contendo o nome, quantidade, unidade de medida e categoria de cada alimento, além do status atual do estoque.
2. **Given** que a lista de alimentos está visível, **When** o usuário seleciona um filtro por categoria específica (ex: "Bebidas"), **Then** a listagem é atualizada para exibir apenas os produtos pertencentes àquela categoria.
3. **Given** que ocorre uma falha na API ao tentar carregar os dados de estoque (ex: indisponibilidade do servidor ou timeout), **When** a listagem é acionada, **Then** o sistema exibe uma mensagem clara de erro de integração com opção de tentar novamente, evitando telas em branco.

---

### User Story 3 - Atualização de Alimentos (Priority: P2)

Como gerente, quero editar as informações de um alimento existente (nome, quantidade, categoria ou unidade de medida), para refletir o consumo, novas compras ou correções de inventário.

**Why this priority**: Garante que o inventário reflita com precisão a realidade física do restaurante ao longo do tempo.

**Independent Test**: Pode ser testado selecionando um item cadastrado, alterando seus valores por dados válidos e salvando, confirmando a atualização na listagem e na API.

**Acceptance Scenarios**:

1. **Given** que um alimento está cadastrado, **When** o gerente altera sua quantidade ou dados e confirma a edição, **Then** o sistema envia a atualização para a API e reflete os novos dados imediatamente na interface.
2. **Given** que o gerente edita um alimento, **When** insere dados inválidos (ex: quantidade menor que zero), **Then** o sistema bloqueia a alteração e exibe mensagens de erro nos campos correspondentes.
3. **Given** que a API rejeita a atualização (ex: erro de validação do servidor ou conflito), **When** o salvamento falha, **Then** o sistema exibe o erro retornado pela API sem descartar as edições em andamento.

---

### User Story 4 - Exclusão de Alimentos com Confirmação (Priority: P3)

Como gerente, quero excluir um alimento do sistema mediante confirmação explícita, para remover itens que não são mais utilizados ou que foram cadastrados por engano.

**Why this priority**: Mantém a base de dados limpa, embora seja executada com menor frequência que listagem e cadastro.

**Independent Test**: Pode ser testado solicitando a exclusão de um item, cancelando ou confirmando o diálogo de segurança, e verificando a remoção efetiva da listagem.

**Acceptance Scenarios**:

1. **Given** que o usuário solicita a exclusão de um alimento, **When** o sistema exibe um diálogo de confirmação e o usuário confirma a ação, **Then** a requisição de exclusão é enviada à API e o item é removido da listagem.
2. **Given** que o usuário solicita a exclusão, **When** cancela a operação no diálogo de confirmação, **Then** nenhuma alteração é feita e o item permanece no sistema.
3. **Given** que a API falha ao tentar excluir o registro, **When** a requisição retorna erro, **Then** o sistema notifica o usuário sobre a falha e mantém o item visível na lista.

---

### Edge Cases

- **Quantidade Zero (Esgotado)**: O sistema permite o valor exato `0` na quantidade em estoque, classificando o item como esgotado, mas bloqueia estritamente valores negativos (`< 0`).
- **Preservação de Formulário em Falha de Cadastro**: Se o cadastro falhar por erro de rede ou erro HTTP da API (5xx), os campos preenchidos pelo usuário (nome, quantidade, categoria, unidade) não devem ser limpos, permitindo nova tentativa imediata.
- **Conexão Intermitente com a API**: Caso o servidor demore a responder ou fique inacessível, o sistema deve capturar a exceção e apresentar um aviso amigável sem quebrar a interface do usuário.
- **Espaços em Branco Excessivos**: Nomes de alimentos informados com espaços extras nas pontas devem passar por tratamento automático de remoção de espaços nas extremidades (*trim*).
- **Exclusão Simultânea / Recurso Inexistente**: Caso um usuário tente excluir ou editar um item que já foi removido por outro usuário (retornando erro HTTP 404 da API), o sistema deve informar que o item não existe mais e atualizar a listagem local.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir o cadastro de novos alimentos contendo obrigatoriamente os campos: nome, quantidade em estoque, unidade de medida e categoria.
- **FR-002**: O sistema MUST validar os dados informados pelo usuário antes do envio para a API:
  - *Nome*: Texto não vazio, com comprimento aceitável e sem caracteres inválidos.
  - *Quantidade*: Valor numérico maior ou igual a zero ($\ge 0$).
  - *Categoria*: Seleção obrigatória a partir da lista de categorias permitidas.
  - *Unidade de Medida*: Seleção obrigatória a partir da lista de unidades permitidas.
- **FR-003**: O sistema MUST integrar todas as operações de CRUD (Cadastro, Listagem, Edição e Exclusão) com uma API REST externa, enviando e recebendo dados nos formatos padronizados.
- **FR-004**: O sistema MUST tratar adequadamente os erros retornados pela API e falhas de rede, exibindo mensagens compreensíveis ao usuário (ex: erros HTTP 4xx e 5xx, falha de conexão).
- **FR-005**: O sistema MUST preservar os dados preenchidos no formulário de cadastro ou edição caso ocorra uma falha de envio para a API.
- **FR-006**: O sistema MUST exibir todos os alimentos cadastrados em uma listagem estruturada contendo nome, quantidade, unidade de medida, categoria e status do estoque.
- **FR-007**: O sistema MUST permitir a filtragem da listagem de alimentos por categoria selecionada.
- **FR-008**: O sistema MUST permitir a edição de registros de alimentos existentes, aplicando as mesmas regras de validação do cadastro.
- **FR-009**: O sistema MUST exigir uma confirmação explícita do usuário antes de efetivar a exclusão de um alimento.
- **FR-010**: O sistema MUST aplicar regras de status para o estoque com base na quantidade disponível (ex: "Disponível", "Estoque Baixo", "Esgotado").

### Key Entities

- **Alimento**:
  - *Identificador único*: Código ou ID gerado pelo sistema/API.
  - *Nome*: Descrição textual do produto alimentício.
  - *Quantidade*: Valor numérico representando o saldo atual em estoque.
  - *Unidade de Medida*: Classificação da unidade (ex: kg, g, litro, ml, unidade, pacote).
  - *Categoria*: Classificação do tipo de alimento (ex: Ingredientes, Bebidas, Hortifruti, Carnes, Laticínios, Outros).
  - *Status do Estoque*: Indicador calculado do estado do produto (Disponível, Estoque Baixo, Esgotado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das submissões de dados inválidos são bloqueadas pela validação local antes de disparar requisições incorretas para a API.
- **SC-002**: O tempo de resposta para exibir a listagem completa de alimentos após o carregamento da página é inferior a 2 segundos em condições normais de rede.
- **SC-003**: 100% de preservação dos dados do formulário quando ocorrer falha de envio por erro de rede ou erro HTTP da API.
- **SC-004**: O usuário consegue concluir o fluxo completo de cadastro de um novo alimento em menos de 45 segundos.
- **SC-005**: 100% das ações de exclusão exibem diálogo de confirmação prévia, impedindo exclusões acidentais.

## Assumptions

- A API REST de backend está estruturada e funcional para receber as operações de CRUD de alimentos.
- O acesso ao sistema é realizado por gerentes ou operadores de restaurantes com conectividade à internet padrão.
- As listas fechadas de categorias e unidades de medida são padronizadas conforme as necessidades operacionais do restaurante.

## Ambiguities & Group Decisions Pending

As seguintes informações não foram totalmente detalhadas ou padronizadas nas decisões iniciais do grupo e ficam registradas para alinhamento posterior:
1. **Limites exatos de "Estoque Baixo"**: Não foi especificado o limiar numérico exato (ex: quantidade menor que 5) que define quando um item passa de "Disponível" para "Estoque Baixo".
2. **Lista Fechada de Categorias e Unidades**: Embora a necessidade de categorias e unidades de medida esteja definida, os valores exatos permitidos (ex: se "Laticínios" é uma categoria oficial ou se pode ser texto livre) dependem do contrato final da API.
