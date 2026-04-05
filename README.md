# MetraTrack Backend

NestJS REST API backend for the MetraTrack application.

---

## Tech Stack

| Layer            | Technology                       |
|------------------|----------------------------------|
| Framework | NestJS 11 (Express) |
| Language | TypeScript 5.7 |
| Database | PostgreSQL + TypeORM 0.3 |
| Cache | Redis (ioredis) |
| Object Storage | S3-compatible (MinIO locally) |
| Validation | class-validator + class-transformer |
| Documentation | Swagger / OpenAPI |
| Auth | API key + tgId-based guards (no JWT) |
| AI | OpenAI SDK (image analysis + text generation) |

---

## Project Structure

```
src/
├── common/
│   ├── database/      # TypeORM module + DataSource for CLI migrations
│   ├── redis/         # Redis client with get/set/del/smembers helpers
│   ├── s3/            # S3StorageService (upload, delete)
│   ├── http/          # HttpService — fetch wrapper with retry + backoff
│   ├── error/         # Global exception filter → { statusCode, path, message }
│   ├── logging/       # LoggingService wrapper over NestJS Logger
│   ├── openai/        # OpenAIService (image analysis, text generation)
│   ├── guards/        # ApiKeyGuard (shared)
│   └── util/          # secrets.util, bigint.transformer
├── users/             # Users domain
│   ├── controllers/   # UsersController
│   ├── services/      # UsersService
│   ├── guards/        # UserGuard, AdminGuard
│   ├── dto/           # Create/Update/Response DTOs
│   └── entities/      # User entity
├── food-entries/      # Food entries and reviews domain (storage + read)
│   ├── controllers/   # FoodEntriesController, FoodReviewsController (read + confirm only)
│   ├── services/      # FoodEntriesService, FoodReviewsService (full CRUD, internal)
│   ├── dto/
│   ├── entities/      # FoodEntry, FoodReview
│   ├── enums/         # FoodReviewType
│   └── util/          # Validators, day-range, daily/review aggregators
├── food-analysis/     # Food photo analysis orchestration
│   ├── controllers/   # FoodAnalysisController — POST /food-analysis/analyze
│   ├── services/      # FoodAnalysisService, FoodImageService, BotCallbackService
│   ├── dto/           # Request/response DTOs
│   ├── validation/    # Zod schema for OpenAI response
│   └── instructions/  # System prompt for OpenAI (food-analysis.instructions.md)
├── health/            # GET /health — app name, env, uptime
├── migrations/        # TypeORM migration files
├── app.module.ts
└── main.ts            # Bootstrap: CORS, ValidationPipe, Swagger
```

---

## Infrastructure Modules

### `DatabaseModule`
Connects to PostgreSQL via TypeORM. `autoLoadEntities: true`, `synchronize: false`.
Configured via `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

### `RedisModule` (global)
ioredis client with exponential retry strategy.
Exposes `RedisService` with `get`, `set`, `del`, `smembers`, `sadd`, `expire`, `isConnected`.
Configured via `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.

### `S3Module` (global)
AWS SDK v3 S3 client. Gracefully no-ops if credentials are missing.
Exposes `S3StorageService` with `uploadFile` and `deleteFile`.
Configured via `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_FORCE_PATH_STYLE`.

### `HttpModule`
fetch-based HTTP client with configurable retry and exponential backoff.
Import into any feature module that needs to call external services.
Configured via `HTTP_TIMEOUT_MS`, `HTTP_RETRIES`, `HTTP_RETRY_DELAY_MS`.

### `ErrorModule`
Global `APP_FILTER` that catches all exceptions and returns a consistent JSON error shape.

### `OpenAIModule` (global)
OpenAI SDK wrapper. Exposes `OpenAIService` with `analyzeImage` (base64 image → parsed JSON) and `generateText` (payload + instructions → parsed JSON).
Configured via `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_MAX_OUTPUT_TOKENS`, `OPENAI_RETRIES`, `OPENAI_TIMEOUT_MS`, `OPENAI_RATE_LIMIT_RPM`.

### `LoggingService`
Thin wrapper over NestJS `Logger`. Always instantiate with a context string via `useFactory`.

---

## Food Analysis Module

Orchestrates the full food photo analysis pipeline. Separate from `food-entries` (which is storage/read only).

**Flow:** bot backend → `POST /food-analysis/analyze` → image processing + S3 upload → OpenAI vision analysis → Zod schema validation → business completeness validation → save to food-entries → bot callback

### Endpoint

`POST /food-analysis/analyze?tgId=<telegram_user_id>` — `ApiKeyGuard + UserGuard`, `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `photo` | file | Food photo. JPEG / PNG / WebP. Max 10 MB. |
| `telegramFileId` | string | Telegram `file_id` for traceability. |
| `userCaption` | string (optional) | User-provided caption to clarify the meal (e.g. portion weight, ingredients). Forwarded to the AI model to improve accuracy. Max 500 chars. |

### Response

| `status` | `entry` | Meaning |
|---|---|---|
| `food` | `FoodEntryResponseDto` | Food detected, entry saved. |
| `not_food` | `null` | Image is not food, nothing saved. |

Errors return standard `ErrorResponseDto` with 4xx/5xx.

### Bot Callback

After a successful analysis (both `food` and `not_food`), the module POSTs the same `FoodAnalysisResultDto` to the bot backend asynchronously. Callback failures are logged but never affect the HTTP response.

Configured via `BOT_HOST`, `BOT_CALLBACK_ANALYSIS_PATH`. The callback uses the shared `API_KEY` (`X-API-KEY` header).

---

## Users Domain

### Entity: `User`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `tgId` | varchar (unique) | Telegram user ID |
| `tgUsername` | varchar, nullable | Telegram username |
| `tgFirstName` | varchar | Telegram first name |
| `tgLastName` | varchar, nullable | Telegram last name |
| `tgLanguageCode` | varchar, nullable | IETF language code |
| `tgIsPremium` | boolean | Has Telegram Premium |
| `isBot` | boolean | Whether account is a bot |
| `createdAt` | bigint | Unix ms |
| `updatedAt` | bigint | Unix ms |
| `deletedAt` | bigint, nullable | Soft-delete timestamp (null = active) |

### API Endpoints

All endpoints require `X-API-KEY` header.

| Method | Path | Guard | Description |
|---|---|---|---|
| `POST` | `/users` | ApiKey | Register or restore user from Telegram data |
| `GET` | `/users/by-tg-id/:tgId` | ApiKey | Get active user by Telegram ID |
| `GET` | `/users/:id` | ApiKey | Get active user by UUID |
| `GET` | `/users/:id/is-admin` | ApiKey | Check admin status by UUID |
| `PATCH` | `/users/:id` | ApiKey + User | Update Telegram fields |
| `DELETE` | `/users/:id` | ApiKey + Admin | Soft-delete user |

### Registration flow (`POST /users`)

Idempotent: creates, restores, or syncs. Bots (`isBot: true`) are rejected with `400`.

### Guards

- **`ApiKeyGuard`** — validates `X-API-KEY` header against `API_KEY` env var
- **`UserGuard`** — requires active user identified by `?tgId=` query param
- **`AdminGuard`** — requires active user whose `tgId` is in `TG_ADMIN_IDS`

---

## Food Entries Domain

### Entities

- **`FoodEntry`** — food analysis result. All nutrition fields (`portionGrams`, `caloriesKcal`, `proteinsGrams`, `fatsGrams`, `carbsGrams`, `confidence`) are required and non-negative. `photoId` is unique (one photo → one entry). `eatenAt` is null until the user confirms; confirmation sets it to the current timestamp. `userCaption` is an optional text field storing the caption the user sent alongside the photo.
- **`FoodReview`** — AI-generated review for a period (`DAILY` / `WEEKLY` / `MONTHLY`). DAILY reviews link source food entries via a join table (full objects). WEEKLY/MONTHLY reviews store source review UUIDs in a jsonb column.

### Write flow (internal only)

Create / update / delete operations are **not exposed** as HTTP endpoints. They are called by other internal modules (e.g., an AI pipeline). Services are exported from `FoodEntriesModule` for that purpose.

### Exposed API Endpoints

All endpoints require `X-API-KEY` + `?tgId=` (ApiKeyGuard + UserGuard).

| Method | Path | Description |
|---|---|---|
| `GET` | `/food-entries` | Paginated entries (userId, confirmedOnly, dateFrom, dateTo, page, limit) |
| `PATCH` | `/food-entries/:id/confirm` | Confirm entry — sets `eatenAt` to now |
| `GET` | `/food-reviews` | Paginated reviews with embedded source entries (userId, type, dateFrom, dateTo, page, limit) |

---

## Running Locally

### Prerequisites

- Node.js 22+
- PostgreSQL
- Redis
- MinIO (optional, for S3 functionality)

### Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env

# Run database migrations
npm run migration:run

# Start in development (watch) mode
npm run start:dev
```

### Swagger UI

Available at: [http://localhost:3000/docs](http://localhost:3000/docs)

### Health check

```
GET /health
```

---

## Database Migrations

```bash
# Generate a new migration after changing entities
npm run migration:generate -- src/migrations/MigrationName

# Apply pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

---

## Testing

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

---

## Environment Variables

See `.env.example` for all required variables with descriptions.

---

## Deployment

Deployment is automated via GitHub Actions (`.github/workflows/deploy-prod.yml`). The workflow is triggered manually via `workflow_dispatch`.

### Pipeline

1. **Test** — runs `npm test`
2. **Build & Push** — builds the Docker image and pushes two tags to Docker Hub:
   - `<IMAGE_NAME>:prod` — mutable, always latest production
   - `<IMAGE_NAME>:sha-<commit-sha>` — immutable, for rollback
3. **Deploy** — triggers two Dokploy webhooks in sequence:
   - Migration webhook → waits 10 seconds
   - Backend deployment webhook

### GitHub Actions Secrets

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub account username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `IMAGE_NAME` | Full Docker Hub image name (e.g. `myorg/mt-backend`) |
| `DOKPLOY_BACKEND_MIGRATE_WEBHOOK_URL` | Dokploy webhook URL for the `backend-migrate` service |
| `DOKPLOY_BACKEND_WEBHOOK_URL` | Dokploy webhook URL for the `backend` service |

### Docker Swarm Stack

Two stack files live at the project root, deployed as separate Dokploy stacks:

- **`docker-stack.migrate.yml`** — one-shot TypeORM migration runner. Deploy first before each release. Set the Dokploy app type to "Run once". Aliased as `backend-migrate` on `dokploy-network`.
- **`docker-stack.yml`** — the NestJS API. Aliased as `backend` on `dokploy-network`.

Both pull from `${BACKEND_IMAGE}` and connect to the external `dokploy-network`.