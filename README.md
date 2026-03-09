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
| Auth (planned) | JWT + Passport |

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
│   ├── guards/        # ApiKeyGuard (shared)
│   └── util/          # secrets.util, bigint.transformer
├── users/             # Users domain
│   ├── controllers/   # UsersController
│   ├── services/      # UsersService
│   ├── guards/        # UserGuard, AdminGuard
│   ├── dto/           # Create/Update/Response DTOs
│   └── entities/      # User entity
├── food-entries/      # Food entries and reviews domain
│   ├── controllers/   # FoodEntriesController, FoodReviewsController (read + confirm only)
│   ├── services/      # FoodEntriesService, FoodReviewsService (full CRUD, internal)
│   ├── dto/
│   ├── entities/      # FoodEntry, FoodReview
│   ├── enums/         # FoodReviewType
│   └── util/          # Validators, day-range, daily/review aggregators
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

### `LoggingService`
Thin wrapper over NestJS `Logger`. Always instantiate with a context string via `useFactory`.

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

- **`FoodEntry`** — food analysis result. All nutrition fields (`portionGrams`, `caloriesKcal`, `proteinsGrams`, `fatsGrams`, `carbsGrams`, `confidence`) are required and non-negative. `photoId` is unique (one photo → one entry). `eatenAt` is null until the user confirms; confirmation sets it to the current timestamp.
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