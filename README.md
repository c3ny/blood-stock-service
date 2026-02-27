# Blood Stock Service (NestJS)

Complete reimplementation of the blood stock management system using NestJS + Hexagonal Architecture.

## Initial status

This first delivery includes:

- Project skeleton in NestJS + TypeScript
- Domain layer fully implemented (pure TypeScript)
- Domain tests for stock adjustment and batch rules

## Hexagonal structure

```
src/
  domain/
    entities/
    value-objects/
    services/
    errors/
  application/
  adapters/
```

## Run

```bash
npm install
npm test
npm run start:dev
```
