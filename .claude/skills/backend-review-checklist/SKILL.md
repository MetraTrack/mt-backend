# Skill: backend-review-checklist

Use this skill as the review checklist when running the `code-reviewer` agent. Work through each section and report only actual violations.

---

## Architecture

- [ ] Entities are in `src/<domain>/entities/`. Not in `common/`, not inline.
- [ ] Migrations are in `src/migrations/`. Not inside domain folders.
- [ ] No `synchronize: true` anywhere in any environment.
- [ ] No repository layer. TypeORM `Repository<Entity>` injected directly into services.
- [ ] No business logic in controllers. Controllers delegate to services only.
- [ ] Paginated queries use `createQueryBuilder` with `.skip()`, `.take()`, `.getManyAndCount()`.
- [ ] Paginated results returned as `{ data, meta }` with the fixed `meta` shape.
- [ ] Soft deletes via `deletedAt: number | null`. All queries filter `deletedAt IS NULL`.
- [ ] Timestamps are Unix milliseconds (`number`), not `Date` objects.
- [ ] `LoggingService` instantiated via `useFactory: () => new LoggingService('ContextName')` in module providers.

---

## Controller Thinness

- [ ] Controller methods contain no `if`/`else` beyond routing needs.
- [ ] No database imports or TypeORM usage in controllers.
- [ ] No env variable reads in controllers (except top-level module-scope constants like `MAX_PHOTO_SIZE`).
- [ ] No inline validation or business rule evaluation in controllers.

---

## Auth Guards

- [ ] `@UseGuards(ApiKeyGuard)` applied at the controller class level on every protected controller.
- [ ] `@UseGuards(UserGuard)` or `@UseGuards(AdminGuard)` applied at the route level where user context is required.
- [ ] `@ApiSecurity('api-key')` present on every protected controller.
- [ ] Every route using `UserGuard`/`AdminGuard` has `tgId` in its query DTO with `@ApiQuery` declared on the route.

---

## API Contract Consistency

- [ ] Input DTOs use `class-validator` decorators with correct types.
- [ ] Numeric query params use `@Type(() => Number)` and `@IsInt()`.
- [ ] All DTO fields have `@ApiProperty` or `@ApiPropertyOptional` with `description` and `example`.
- [ ] All controller routes have `@ApiOperation`, `@ApiResponse` for each success and error status.
- [ ] Error responses use `ErrorResponseDto` as the Swagger type.
- [ ] No breaking changes: no removed fields, no renamed fields, no changed field types, no changed routes.

---

## Dependency Hygiene

- [ ] No new packages in `package.json` without explicit instruction.
- [ ] No alternative HTTP client introduced (axios, got, node-fetch). Only `HttpService`.
- [ ] No alternative AI client introduced. Only `OpenAIService`.
- [ ] No new global module-level side effects outside established `common/` modules.

---

## Migration Discipline

- [ ] No handwritten migration files without explicit instruction.
- [ ] No manually edited generated migration files without explicit instruction.
- [ ] All new entities have a corresponding migration in `src/migrations/`.
- [ ] Entity file and migration file committed together.

---

## Documentation Freshness

- [ ] `README.md` updated if: new domain added, behavior changed, new env variable introduced.
- [ ] `.env.example` updated for every new environment variable, with description and safe default.
- [ ] `CLAUDE.md` or relevant agent/skill file updated if a new pattern or convention was established.

---

## Comment Quality

- [ ] No multi-line comment blocks that exceed the code they describe.
- [ ] No JSDoc or docstrings on standard CRUD methods.
- [ ] Comments present only where code alone cannot convey intent.
- [ ] No commented-out code.

---

## Test Coverage

- [ ] New service has a co-located `.spec.ts` file.
- [ ] Standard CRUD scenarios covered: happy path, not-found, conflict (if applicable), soft-delete.
- [ ] For analysis services: food detected, not-food, parse error, schema validation error paths tested.
- [ ] Mocks are minimal: repository / external service dependencies + logging service only.
- [ ] No tests for behavior the framework guarantees (e.g., `ValidationPipe` input rejection).

---

## Output Format

```
VIOLATIONS:
- <file>:<line> — <what is wrong and why>

OK: <categories with no issues>
```

Report only violations. If none, write: `No violations found.`
