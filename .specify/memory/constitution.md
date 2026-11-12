<!-- 
Relatório de Impacto de Sincronização:
- Mudança de versão: 0.2.0 -> 0.2.1
- Alterações: Ajuste de estrutura para total conformidade com o constitution-template.
-->
# sdd-icrud-grupo2 Constitution

## Core Principles

### I. Código Simples e Sustentável
O código DEVE ser simples, modular e de fácil manutenção. Soluções complexas sem justificativa técnica clara DEVEM ser evitadas em prol da legibilidade e simplicidade acadêmica.

### II. Organização e Rastreabilidade
Funcionalidades e tarefas DEVEM estar organizadas e documentadas. Todo desenvolvimento DEVE ser rastreável a uma tarefa definida, garantindo que o progresso seja transparente e estruturado.

### III. Validação Obrigatória
Nenhuma funcionalidade PODE ser considerada concluída sem passar por uma validação efetiva. Testes ou verificações funcionais DEVEM ser executados para confirmar que o requisito foi atendido conforme esperado.

### IV. Integração Consistente
A comunicação entre o Front-end, API e Banco de Dados DEVE seguir um contrato definido. A integração DEVE ser validada em todas as camadas para garantir o funcionamento end-to-end do fluxo de estoque.

### V. Consistência com Especificação
A implementação DEVE refletir fielmente a especificação técnica definida no `/speckit.specify`. Divergências entre o código e o requisito especificado DEVEM ser corrigidas ou a especificação DEVE ser atualizada.

## Visão Geral do Projeto

O **iCRUD** é um sistema de gerenciamento de estoque de alimentos voltado para restaurantes. O sistema tem como objetivo facilitar o controle dos produtos armazenados, permitindo acompanhar os itens disponíveis, suas quantidades e informações relevantes para a gestão do estoque. O projeto busca resolver problemas comuns no controle manual de estoque, como falta de organização, dificuldade para acompanhar a quantidade de produtos e risco de perda de alimentos.

## Fluxo de Desenvolvimento

O desenvolvimento segue a metodologia Spec-Driven: todo código implementado DEVE derivar de uma tarefa validada. O projeto DEVE utilizar React com Vite. A linguagem de programação obrigatória é JavaScript. A estrutura do projeto deve priorizar a clareza, com separação de responsabilidades entre componentes de UI e lógica de integração. Revisões devem focar na aderência aos princípios desta constituição e na consistência com a especificação técnica do projeto.

## Governance

Esta constituição substitui todas as práticas anteriores. Emendas exigem consenso da equipe e devem ser documentadas com um plano de migração claro. Todos os Pull Requests e revisões de código DEVEM verificar a conformidade com estes princípios.

**Version**: 0.2.1 | **Ratified**: 2026-11-12 | **Last Amended**: 2026-11-12
