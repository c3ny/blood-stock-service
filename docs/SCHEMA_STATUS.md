# Status dos Schemas Prisma

Este documento alinha o que está documentado com o que a aplicação usa em runtime.

## Estado atual

- Schema usado pela aplicação e migrations padrão: `prisma/schema.prisma`
- Schemas avançados (V3) para evolução/planejamento:
  - `prisma/schema-production.prisma`
  - `prisma/schema-refactored.prisma`

## Quando usar cada um

- `schema.prisma`
  - Use para execução atual da API, CI e ambiente padrão.
  - É o schema que reflete o runtime validado do backend.

- `schema-production.prisma` e `schema-refactored.prisma`
  - Use para análise de evolução, benchmarking e planejamento de migração V3.
  - Não devem substituir o schema ativo sem plano de migração completo.

## Fluxo recomendado para migração V3

1. Revisar impacto em [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
2. Validar queries e casos de uso com [reports/HOW_TO_TEST_NEW_SCHEMA.md](reports/HOW_TO_TEST_NEW_SCHEMA.md)
3. Rodar testes completos da aplicação
4. Promover V3 para `schema.prisma` apenas com janela de migração definida

## Checklist de alinhamento antes de promover V3

- Migrations revisadas e reproduzíveis
- Seed atualizado para o novo modelo
- Endpoints e DTOs compatíveis com o novo domínio
- Testes unitários e e2e verdes
- Plano de rollback definido