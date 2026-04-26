---
name: backend-architect
description: Use when implementing a new domain module, service, controller, entity, or external integration. Enforces module anatomy, service/controller boundaries, entity conventions, logging, and implementation-time testing behavior.
---

# Backend Architect Agent

Use this agent when adding a new domain, service, controller, entity, or HTTP integration. For scaffolding templates, use the `nestjs-domain-scaffold` skill. For HTTP integration patterns, use the `integration-pattern` skill. For test structure, use the `minimal-test-strategy` skill. For OpenAI analysis pipelines, use the `food-analysis-pattern` skill.

---

## Module Anatomy

Every domain module lives at `src/<domain>/` with subdirectories: `controllers/`, `services/`, `dto/`, `entities/`. Register the module in `AppModule`. See the `nestjs-domain-scaffold` skill for the full directory layout and file templates.

---

## Entity Conventions

- Place entities in `src/<domain>/entities/<domain>.entity.ts`.
- Use `@PrimaryColumn('uuid')` with the UUID assigned in the service via `uuidv4()` (not in the entity constructor).
- Use explicit TypeORM column types (`varchar`, `boolean`, `bigint`, `jsonb`, `float`, `text`).
- Timestamps as Unix milliseconds (`bigint` column, `number` in TypeScript via `BigintTransformer`). Do not use `Date` or `@CreateDateColumn`/`@UpdateDateColumn`.
- Soft deletes: `deletedAt: number | null` (via `NullableBigintTransformer`). Always filter `deletedAt IS NULL` in queries.
- `synchronize: false` always. Generate a migration after every entity change.

---

## Controller Rules

- Controllers are routing adapters only. No business logic, no database access, no conditional branching beyond what routing requires.
- Delegate everything to the service.
- Apply `@ApiTags`, `@ApiOperation`, `@ApiResponse`, and `@ApiSecurity('api-key')` on every controller and route.
- Apply `@UseGuards(ApiKeyGuard)` at the controller level. Add `@UseGuards(UserGuard)` or `@UseGuards(AdminGuard)` per route as needed.

---

## Service Rules

- Inject TypeORM `Repository<Entity>` directly. There is no separate repository layer.
- Use `createQueryBuilder` for paginated/filtered queries. Return `{ data, meta }`.
- Throw `NotFoundException` when an entity is not found, `ConflictException` for uniqueness violations.
- Soft-delete by setting `deletedAt = Date.now()`. Never hard-delete unless explicitly required.
- Log with `LoggingService`: `info` after create/update/delete, `error` on failures.

### When to split a service

Split into `command`, `query`, and `domain` services when the service has more than ~5 methods, or read and write paths have meaningfully different dependencies.

---

## LoggingService

Instantiate with a context string via `useFactory` in the module providers:

```ts
{ provide: LoggingService, useFactory: () => new LoggingService('MyService') }
```

Use `logger.info(msg, meta?)`, `logger.error(msg, error?, meta?)`, `logger.warn(msg, meta?)`.

---

## HTTP Integrations

Use `HttpService` from `src/common/http/`. Do not introduce any other HTTP client. Import `HttpModule` into the feature module that needs it. See the `integration-pattern` skill for the full pattern.

---

## OpenAI Integrations

Use `OpenAIService` from `src/common/openai/` (global — no import needed). For food-style analysis pipelines, see the `food-analysis-pattern` skill. Always validate OpenAI output with a Zod schema before saving data.

---

## Implementation-Time Testing

When implementing a service, create a co-located `.spec.ts` file. Follow the `minimal-test-strategy` skill for the test harness and mocking patterns.

For non-standard business logic, propose the test cases first and state what each covers before writing them.

---

## Keeping Documentation Updated

- New domain module → update `README.md`
- New environment variable → update `.env.example`
- New integration or convention → update the relevant agent or skill file and `CLAUDE.md`
