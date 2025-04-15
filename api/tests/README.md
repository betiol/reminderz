# Testes do Sistema Lembreme

Este diretório contém testes automatizados para o sistema Lembreme.

## Executando os testes

Para executar todos os testes:

```bash
npm test
```

Para executar apenas os testes de uma pasta específica:

```bash
npm test -- tests/unit
```

Para executar um arquivo de teste específico:

```bash
npm test -- tests/unit/schedulerService.test.js
```

## Estrutura dos testes

- `unit/`: Testes unitários que verificam o comportamento de funções individuais
- `integration/`: Testes que verificam a integração entre componentes do sistema

## Correção do problema de notificações incorretas

Foi identificado e corrigido um problema onde tarefas estavam sendo erroneamente marcadas como atrasadas quando estavam com data para hoje, mas o horário ainda não tinha vencido.

A correção implementada:

1. Agora o sistema considera corretamente tanto a data quanto o horário da tarefa
2. É criada uma data/hora combinada para comparação adequada com o momento atual
3. Testes automatizados foram criados para validar o comportamento correto

### Detalhes da implementação

Para verificar se uma tarefa está atrasada, o sistema agora:

1. Recupera a data da tarefa
2. Adiciona a hora específica da tarefa 
3. Compara esse momento combinado com a data/hora atual
4. Apenas marca como atrasada se o momento combinado já tiver passado

Essa abordagem garante que tarefas marcadas para hoje com horário ainda no futuro não sejam incorretamente classificadas como atrasadas.