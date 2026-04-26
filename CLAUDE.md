# CLAUDE.md — MetraTrack Backend

MetraTrack is a Telegram-first food tracking backend. It receives food photos and text descriptions from a Telegram bot, runs OpenAI analysis, stores nutrition data, and sends callbacks back to the bot. Follow established patterns; do not invent new ones.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Express) |
| Language | TypeScript 5.7 |
| Database | PostgreSQL + TypeORM 0.3 |
| Cache | Redis (ioredis) |
| Object Storage | S3-compatible (AWS SDK v3) |
| HTTP client | Native `fetch` wrapper (`HttpService`) |
| Validation | class-validator + class-transformer |
| Documentation | Swagger / OpenAPI (`/docs`) |
| Auth | API key (`X-API-KEY`) + tgId-based guards — no JWT |
| AI | OpenAI SDK (`OpenAIService` — image analysis + text generation) |

---

## Project Structure

```
src/
├── common/
│   ├── database/      # TypeORM module + DataSource files for migrations
│   ├── redis/         # Global RedisService
│   ├── s3/            # Global S3StorageService
│   ├── http/          # HttpService — fetch wrapper with retry/backoff
│   ├── openai/        # Global OpenAIService (analyzeImage, generateText)
│   ├── error/         # Global exception filter + ErrorResponseDto
│   ├── logging/       # LoggingService (thin NestJS Logger wrapper)
│   ├── guards/        # ApiKeyGuard (shared)
│   └── dto/           # Shared DTOs: PaginationMetaDto, PaginatedResponseDto
├── users/             # Users domain — full CRUD, UserGuard, AdminGuard
├── food-entries/      # FoodEntry + FoodReview storage and read endpoints
├── food-analysis/     # AI analysis orchestration (photo + text pipelines)
│   └── instructions/  # System prompts: food-analysis.instructions.md (photo),
│                      #                 food-text-analysis.instructions.md (text)
├── health/            # GET /health — no auth
├── migrations/        # TypeORM migration files
├── app.module.ts
└── main.ts
```

Domain modules: `controllers/`, `services/`, `dto/`, `entities/`.

---

## Auth Pattern

This project uses **no JWT**. All endpoints are machine-to-machine (bot backend → this API).

- **`ApiKeyGuard`** — validates `X-API-KEY` header against `API_KEY` env var. No DI deps. Applied at controller level on every protected controller.
- **`UserGuard`** — looks up an active user by `?tgId=` query param; throws `404` if not found. Exported from `UsersModule`.
- **`AdminGuard`** — same as UserGuard but also checks that `tgId` is in `TG_ADMIN_IDS`. Exported from `UsersModule`.

Apply guards in order: `@UseGuards(ApiKeyGuard)` on the controller, then `@UseGuards(UserGuard)` or `@UseGuards(AdminGuard)` per route.

`forbidNonWhitelisted: true` is enabled globally — any guarded endpoint that needs UserGuard must include `tgId` in its query DTO.

---

## Architectural Rules

- **No repository layer.** Inject TypeORM `Repository<Entity>` directly into services.
- **Entities in their domain module** at `src/<domain>/entities/`. Never in `common/`.
- **Migrations in `src/migrations/`** — shared root, not inside domain folders.
- **Controllers stay thin.** No business logic, no database access. Delegate to services.
- **Business logic belongs in services.**
- **Global modules** (`RedisModule`, `S3Module`, `OpenAIModule`) are available everywhere without importing. `HttpModule` must be imported per feature module.
- **`synchronize: false`** always. Schema changes via migrations only.
- Prefer existing patterns over new abstractions. Prefer minimal and local changes.

---

## OpenAI Integration Pattern

Use `OpenAIService` from `src/common/openai/` (global — no import needed). Two methods:
- `analyzeImage({ instructions, imageBase64, mimeType, userCaption })` — vision analysis
- `generateText({ instructions, payload })` — text generation; `payload` is JSON-serialized

Both return `{ raw: string, parsed: unknown }`. Always validate `parsed` against a Zod schema (`FoodAnalysisSchema` in `food-analysis/validation/`). Load instruction files from `food-analysis/instructions/` and cache them after first read.

---

## Food Analysis Pipeline

Two endpoints in `food-analysis/`, identical response shape (`FoodAnalysisResultDto`):
1. **Photo**: `POST /food-analysis/analyze` → image processing + S3 upload → `analyzeImage` → save entry
2. **Text**: `POST /food-analysis/analyze-text` → `generateText` → save entry (UUID used as `photoId`)

After every analysis, `BotCallbackService` POSTs the result to the bot backend asynchronously. Callback failures are logged but never affect the HTTP response.

---

## Timestamps and IDs

- All timestamps are Unix milliseconds stored as `bigint` in PG, converted via `BigintTransformer` / `NullableBigintTransformer` to `number` in TypeScript. Never use `Date` objects or `@CreateDateColumn`.
- PKs are UUIDs set manually via `uuidv4()` in the service. Use `@PrimaryColumn('uuid')`.
- Soft-delete: `deletedAt: number | null`. Always filter `deletedAt IS NULL` in queries.

---

## Migration Policy

Migrations are generated exclusively via the TypeORM CLI. Do not handwrite or manually edit migration files without explicit instruction. For the full workflow, use the `typeorm-migration-workflow` skill.

Dev commands use `src/common/database/data-source.ts`. Prod commands use `dist/common/database/data-source-prod.js`.

---

## Testing Philosophy

- Do not aim for 100% coverage. Tests must be minimal, sufficient, readable, and maintainable.
- Mock `UsersService`, `OpenAIService`, `FoodEntriesService`, `BotCallbackService`, and `LoggingService` in analysis service tests. Mock TypeORM repository in storage service tests. Do not mock the service under test.
- Tests live in `.spec.ts` files co-located with the file they test.

For test structure, use the `minimal-test-strategy` skill.

---

## Maintenance Rules

When you change the project:
- **`README.md`** — update when adding domains, changing behavior, or adding env variables.
- **`.env.example`** — add every new env variable with a description and a safe default.
- **`CLAUDE.md`** and relevant `.claude/agents/` or `.claude/skills/` files when a new pattern or convention is established.

---

## Dependency Policy

- Do not add dependencies automatically.
- Suggest a dependency only when it clearly solves a real problem better than a custom implementation. Do not install without explicit confirmation.
- Never alter `package.json`, infrastructure config (Docker, CI), or `package-lock.json` without explicit instruction.

---

## Clean Code

- Clear naming so code reads without explanation.
- Comments only where they add information the code cannot convey — non-obvious rules, important constraints.
- No multi-line comment blocks larger than the code they describe. No JSDoc on standard code.
- No error handling for scenarios the framework or internal contracts already prevent.

---

## Never Touch Without Explicit Request

- `.env` files and secrets
- Deployment configuration (Dockerfile, Docker Compose, CI pipelines)
- Infrastructure-critical settings (CORS, throttler, production data sources)

---

## Canonical Commands

```bash
npm run start:dev          # Development watch mode
npm run build              # Compile to dist/
npm run start:prod         # Run compiled build
npm run test               # Unit tests
npm run test:cov           # Coverage report
npm run test:e2e           # E2E tests
npm run lint               # ESLint with auto-fix
npm run format             # Prettier

npm run migration:generate -- src/migrations/Name
npm run migration:run
npm run migration:revert
npm run migration:show
```

Swagger UI: `http://localhost:3000/docs`
Health check: `GET /health`