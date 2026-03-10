# Blood Stock Service (NestJS Migration)

Implementação incremental da migração do serviço Java para NestJS, com foco em retrocompatibilidade de contrato.

## Rodando localmente

1. Copie `.env.example` para `.env`.
2. Instale dependências:

```bash
npm install
```

3. Rode migrações:

```bash
npm run migration:run
```

4. Suba a API:

```bash
npm run start:dev
```

Swagger: `/swagger-ui/index.html`

## Estado atual

- Endpoints do domínio de estoque portados para `api/stock` com contrato legado de resposta.
- Regras centrais de negócio e fluxos de lote portados para o serviço Nest.
- Operações de lote com transação para manter atomicidade de gravação.
- Filtro global de exceções e interceptor de contexto de requisição ativos.
- Próxima etapa: expandir suíte de testes de paridade endpoint a endpoint (Java x Nest).