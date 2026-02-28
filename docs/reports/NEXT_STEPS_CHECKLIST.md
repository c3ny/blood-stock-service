# ✅ CHECKLIST: Próximas Ações

> **Status**: Schema refatorado documentado e pronto para implementação  
> **Data**: 2026-02-28  
> **Decisão necessária**: Aprovar e aplicar novo schema ou manter atual

---

## 📋 FASE 1: REVISÃO (VOCÊ ESTÁ AQUI)

### Documentação para Revisar

- [ ] **Ler** [docs/REFACTORING_SUMMARY.md](../REFACTORING_SUMMARY.md)
  - Resumo executivo com comparações visuais
  - Tempo estimado: **10 minutos**
  
- [ ] **Ler** [docs/COMPLETE_SCHEMA_ANALYSIS.md](../COMPLETE_SCHEMA_ANALYSIS.md) (seções principais)
  - Parte 1: 8 problemas identificados
  - Parte 4: Exemplos de queries práticas
  - Tempo estimado: **20 minutos**
  
- [ ] **Revisar** [prisma/schema-refactored.prisma](prisma/schema-refactored.prisma)
  - Modelos: Company, User, Batch, BloodBag, Movement, StockView
  - Enums: BloodType, BloodBagStatus, MovementType, etc.
  - Tempo estimado: **15 minutos**

### Decisão

- [ ] **DECISÃO**: Aprovar schema refatorado?
  - ✅ **SIM** → Ir para FASE 2 (Testes em Dev)
  - ⏸️  **MAIS TARDE** → Agendar revisão
  - ❌ **NÃO** → Manter schema atual

---

## 📋 FASE 2: TESTES EM DESENVOLVIMENTO

> **Pré-requisito**: Decisão de prosseguir tomada

### 2.1 Backup e Preparação

- [ ] **Backup do schema atual**
  ```bash
  cp prisma/schema.prisma prisma/schema-BACKUP-$(date +%Y%m%d).prisma
  ```

- [ ] **Backup do banco de dados**
  ```bash
  docker-compose exec db pg_dump -U postgres bloodstock > backup-$(date +%Y%m%d).sql
  ```

### 2.2 Aplicar Novo Schema

- [ ] **Copiar schema refatorado**
  ```bash
  cp prisma/schema-refactored.prisma prisma/schema.prisma
  ```

- [ ] **Criar migration**
  ```bash
  npx prisma migrate dev --name refactor_blood_stock_complete
  ```

- [ ] **Gerar Prisma Client**
  ```bash
  npx prisma generate
  ```

- [ ] **Verificar se migration funcionou**
  - Sem erros de SQL
  - Todas as tabelas criadas
  - Índices aplicados

### 2.3 Popular com Dados de Teste

- [ ] **Criar seed de teste** (arquivo já fornecido em [HOW_TO_TEST_NEW_SCHEMA.md](HOW_TO_TEST_NEW_SCHEMA.md))
  ```bash
  # Criar prisma/seed-refactored.ts
  # Copiar código do guia HOW_TO_TEST_NEW_SCHEMA.md
  ```

- [ ] **Executar seed**
  ```bash
  npx ts-node prisma/seed-refactored.ts
  ```

- [ ] **Validar dados no Prisma Studio**
  ```bash
  npx prisma studio
  ```
  - Verificar Company criado
  - Verificar User criado
  - Verificar Batch com bolsas
  - Verificar StockView atualizado

### 2.4 Testar Queries

- [ ] **Criar arquivo de testes** (exemplo em [HOW_TO_TEST_NEW_SCHEMA.md](HOW_TO_TEST_NEW_SCHEMA.md))
  ```bash
  # Criar test-queries.ts
  # Copiar código do guia
  ```

- [ ] **Executar testes de queries**
  ```bash
  npx ts-node test-queries.ts
  ```

- [ ] **Validar resultados**
  - [ ] Estoque retorna dados corretos
  - [ ] FIFO ordena por `expiresAt ASC`
  - [ ] Alertas de vencimento funcionam
  - [ ] Histórico de bolsas completo

### 2.5 Testar Fluxos Completos

Use as funções em [src/examples/queries-refactored.ts](../../src/examples/queries-refactored.ts):

- [ ] **Entrada de lote**
  ```typescript
  await registerBatchEntry(companyId, userId, 'A_POS', 10);
  ```

- [ ] **Consulta de estoque**
  ```typescript
  await getStockSummary(companyId, 'A_POS');
  ```

- [ ] **Transfusão (FIFO)**
  ```typescript
  await registerTransfusion(companyId, 'A_POS', 'paciente-123', userId);
  ```

- [ ] **Reserva de bolsa**
  ```typescript
  await reserveBloodBag(companyId, 'O_NEG', 'paciente-456', userId);
  ```

- [ ] **Cancelamento de reserva**
  ```typescript
  await cancelReservation(bloodBagId, userId, 'Cirurgia cancelada');
  ```

- [ ] **Descarte de bolsa vencida**
  ```typescript
  await discardBloodBag(bloodBagId, userId, 'Vencimento');
  ```

- [ ] **Dashboard completo**
  ```typescript
  await getDashboard(companyId);
  ```

### 2.6 Validação SQL

Execute as queries de validação em [docs/MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) seção "5.1 Queries de Validação":

- [ ] **Validar FKs** (sem órfãos)
- [ ] **Validar bloodType** (consistente entre BloodBag e Movement)
- [ ] **Validar StockView** (valores corretos)
- [ ] **Validar índices** (todos criados)

### 2.7 Performance

- [ ] **Testar query de estoque** (deve ser < 50ms)
  ```sql
  EXPLAIN ANALYZE SELECT * FROM "StockView";
  ```

- [ ] **Testar FIFO query** (deve usar index em expiresAt)
  ```sql
  EXPLAIN ANALYZE 
  SELECT * FROM "BloodBag" 
  WHERE status = 'AVAILABLE' AND expires_at >= NOW()
  ORDER BY expires_at ASC 
  LIMIT 1;
  ```

---

## 📋 FASE 3: REFATORAÇÃO DE CÓDIGO (SE TESTES PASSARAM)

> **Pré-requisito**: Todos os testes da Fase 2 passaram

### 3.1 Atualizar Entidades de Domínio

- [ ] **Criar entidade BloodBagEntity**
  - Campos: id, bagCode, bloodType, volume, status, expiresAt
  - Validações: volume > 0, bagCode único, status enum

- [ ] **Criar entidade CompanyEntity**
  - Campos: id, name, cnpj, address, isActive
  - Validações: CNPJ válido, name não vazio

- [ ] **Criar entidade UserEntity**
  - Campos: id, name, email, role, cpf
  - Validações: email válido, CPF válido

- [ ] **Atualizar BatchEntity**
  - Adicionar: receivedAt, expiresAt, donorReference

- [ ] **Atualizar MovementEntity**
  - Mudar: movement (Int) → type (enum MovementType)
  - Adicionar: origin, destination, userId

### 3.2 Atualizar Repositories

- [ ] **Criar BloodBagRepository**
  - `findAvailableByType(bloodType): Promise<BloodBag[]>` (FIFO)
  - `findNextAvailable(bloodType): Promise<BloodBag | null>`
  - `reserve(id, patientId): Promise<BloodBag>`
  - `markAsUsed(id, patientId): Promise<BloodBag>`
  - `discard(id, reason): Promise<BloodBag>`

- [ ] **Criar StockViewRepository**
  - `getByBloodType(companyId, bloodType): Promise<StockView>`
  - `getAll(companyId): Promise<StockView[]>`
  - `recalculate(companyId, bloodType): Promise<void>`

- [ ] **Criar MovementRepository**
  - `create(movement): Promise<Movement>`
  - `getHistory(bloodBagId): Promise<Movement[]>`
  - `getReport(companyId, startDate, endDate): Promise<Report>`

### 3.3 Atualizar Use Cases

- [ ] **RegisterBatchEntryUseCase**
  - Criar lote
  - Criar N bolsas individuais
  - Registrar movimentos
  - Atualizar StockView

- [ ] **RegisterTransfusionUseCase**
  - Buscar próxima bolsa FIFO
  - Atualizar status para USED
  - Registrar movimento EXIT_TRANSFUSION
  - Atualizar StockView

- [ ] **ReserveBloodBagUseCase**
  - Buscar próxima bolsa FIFO
  - Atualizar status para RESERVED
  - Atualizar StockView (available--, reserved++)

- [ ] **GetStockSummaryUseCase**
  - Consultar StockView (O(1))

- [ ] **GetExpiringSoonUseCase**
  - Buscar bolsas expirando em N dias
  - Ordenar por expiresAt ASC

### 3.4 Atualizar Controllers e DTOs

- [ ] **BatchController**
  - `POST /batches` - Registrar entrada de lote
  - `GET /batches/:id` - Buscar lote por ID

- [ ] **BloodBagController**
  - `GET /blood-bags/available?bloodType=A_POS` - Listar disponíveis
  - `PATCH /blood-bags/:id/reserve` - Reservar bolsa
  - `PATCH /blood-bags/:id/use` - Usar bolsa (transfusão)
  - `PATCH /blood-bags/:id/discard` - Descartar bolsa
  - `GET /blood-bags/:id/history` - Histórico de movimentos

- [ ] **StockController**
  - `GET /stocks?companyId=X` - Listar todos os estoques
  - `GET /stocks/:bloodType?companyId=X` - Estoque específico

- [ ] **AlertController**
  - `GET /alerts?companyId=X` - Alertas ativos
  - `PATCH /alerts/:id/resolve` - Resolver alerta

### 3.5 Criar DTOs

- [ ] **BloodBagResponseDTO**
- [ ] **StockSummaryResponseDTO**
- [ ] **MovementResponseDTO**
- [ ] **AlertResponseDTO**
- [ ] **RegisterBatchRequestDTO**
- [ ] **TransfusionRequestDTO**
- [ ] **ReservationRequestDTO**

---

## 📋 FASE 4: TESTES E2E COM NOVO SCHEMA

> **Pré-requisito**: Código refatorado completo

### 4.1 Criar Testes E2E

- [ ] **E2E: Entrada de lote**
  ```typescript
  POST /batches
  // Verificar: lote criado, bolsas criadas, movimentos registrados
  ```

- [ ] **E2E: Transfusão FIFO**
  ```typescript
  POST /blood-bags/transfusion
  // Verificar: bolsa mais antiga usada, StockView atualizado
  ```

- [ ] **E2E: Reserva e cancelamento**
  ```typescript
  PATCH /blood-bags/:id/reserve
  PATCH /blood-bags/:id/cancel-reservation
  ```

- [ ] **E2E: Alertas de vencimento**
  ```typescript
  GET /alerts?type=EXPIRING_SOON
  ```

- [ ] **E2E: Relatórios**
  ```typescript
  GET /movements/report?startDate=X&endDate=Y
  ```

### 4.2 Executar Testes

- [ ] **Todos os testes unitários passam**
  ```bash
  npm run test:unit
  ```

- [ ] **Todos os testes E2E passam**
  ```bash
  npm run test:e2e
  ```

- [ ] **Cobertura de código > 80%**
  ```bash
  npm run test:cov
  ```

---

## 📋 FASE 5: MIGRAÇÃO DE PRODUÇÃO (SE APROVADO)

> **Pré-requisito**: Todos os testes passaram, código revisado e aprovado

### 5.1 Planejamento

- [ ] **Definir janela de manutenção**
  - Data: _______________
  - Horário: _______________
  - Duração estimada: 3-7 horas

- [ ] **Notificar stakeholders**
  - [ ] Equipe técnica
  - [ ] Usuários finais
  - [ ] Suporte

### 5.2 Preparação

- [ ] **Backup completo de produção**
  ```bash
  pg_dump -h production-db -U postgres bloodstock > backup-prod-$(date +%Y%m%d-%H%M%S).sql
  ```

- [ ] **Testar restore do backup** (em ambiente staging)
  ```bash
  psql -h staging-db -U postgres bloodstock < backup-prod-*.sql
  ```

### 5.3 Migração

Seguir estratégia escolhida em [docs/MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md):

- [ ] **Opção 1: Reset Completo** (se sem dados importantes)
  - DROP todas as tabelas
  - Aplicar novo schema
  - Popular com dados novos

- [ ] **Opção 2: Transformação** (se com dados importantes)
  - Criar tabelas novas
  - Migrar dados com heurísticas
  - Validar integridade
  - Drop tabelas antigas

### 5.4 Validação Pós-Migração

- [ ] **Validar integridade** (queries SQL do guia)
- [ ] **Testar endpoints críticos** (health check, estoque, transfusão)
- [ ] **Monitorar logs por 24h**
- [ ] **Verificar performance** (queries < 100ms)

### 5.5 Rollback (se necessário)

- [ ] **Plano de rollback preparado**
- [ ] **Backup acessível**
- [ ] **Tempo de rollback < 30min**

---

## 📋 FASE 6: MONITORAMENTO E OTIMIZAÇÃO

> **Pré-requisito**: Migração de produção completa

### 6.1 Primeira Semana

- [ ] **Monitorar performance**
  - Tempo médio de queries < 50ms
  - Sem deadlocks
  - CPU/memória estáveis

- [ ] **Monitorar erros**
  - Sem FKs órfãs
  - StockView sempre consistente

- [ ] **Coletar feedback dos usuários**

### 6.2 Primeiro Mês

- [ ] **Implementar features avançadas**
  - [ ] Dashboard em tempo real
  - [ ] Alertas automáticos por email/SMS
  - [ ] Relatórios ANVISA (CSV/PDF)

- [ ] **Otimizações**
  - [ ] Cache Redis para StockView
  - [ ] Job agendado para recalcular StockView
  - [ ] Compressão de EventLog antigo

### 6.3 Manutenção Contínua

- [ ] **Job agendado: Descarte automático de vencidas** (diário)
- [ ] **Job agendado: Alertas de estoque baixo** (a cada 6h)
- [ ] **Job agendado: Recalcular StockView** (noturno)

---

## 🎯 RESUMO DE DECISÕES NECESSÁRIAS

| Decisão | Quando | Status |
|---------|--------|--------|
| Aprovar schema refatorado? | Após revisão (Fase 1) | ⏳ PENDENTE |
| Prosseguir com testes em dev? | Após aprovação | ⏳ AGUARDANDO |
| Reescrever código? | Após testes passarem | ⏳ AGUARDANDO |
| Migrar produção? | Após E2E completo | ⏳ AGUARDANDO |

---

## 📞 SUPORTE

**Dúvidas sobre o schema?**
- Consulte: [docs/COMPLETE_SCHEMA_ANALYSIS.md](../COMPLETE_SCHEMA_ANALYSIS.md)

**Problemas na migração?**
- Consulte: [docs/MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)

**Exemplos de código?**
- Consulte: [src/examples/queries-refactored.ts](../../src/examples/queries-refactored.ts)

**Como testar?**
- Consulte: [HOW_TO_TEST_NEW_SCHEMA.md](HOW_TO_TEST_NEW_SCHEMA.md)

---

**Última atualização**: 2026-02-28  
**Próxima revisão**: Quando você decidir prosseguir! 🚀
