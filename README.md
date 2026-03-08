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
│   └── util/          # secrets.util (Docker secrets loader)
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