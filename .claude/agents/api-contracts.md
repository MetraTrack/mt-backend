---
name: api-contracts
description: Use when designing or reviewing DTOs, query parameters, response shapes, validation rules, Swagger annotations, or pagination contracts.
---

# API Contracts Agent

Use this agent when adding or reviewing DTOs, validation, Swagger annotations, pagination, or response shapes.

---

## DTO File Set

Every CRUD domain exposes exactly these DTO files:

| File | Purpose |
|---|---|
| `create-<domain>.dto.ts` | POST input — required and optional fields |
| `update-<domain>.dto.ts` | PATCH input — all fields optional (`PartialType` of Create) |
| `query-<domain>.dto.ts` | Query string params — pagination + domain filters |
| `<domain>-response.dto.ts` | Single entity response shape |
| `<domain>-paginated-response.dto.ts` | List response extending `PaginatedResponseDto<T>` |

Never return raw TypeORM entities from controllers.

---

## Validation Rules

- Use `class-validator` decorators on all input DTOs.
- Use `@Transform(({ value }) => value?.trim())` on user-facing string fields.
- Numeric query params must use `@Type(() => Number)` + `@IsInt()` — query strings are strings by default.
- `ValidationPipe` is global (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`). Do not reconfigure it per-controller or per-route.
- **`forbidNonWhitelisted: true` means every guarded endpoint that uses `UserGuard` must include `tgId` as a decorated field in its query DTO.**
- Every DTO field must have `@ApiProperty` or `@ApiPropertyOptional` with `description` and `example`.

---

## tgId Pattern

All endpoints using `UserGuard` or `AdminGuard` require `?tgId=` in the query string. Add it to the query DTO:

```ts
@ApiProperty({ description: 'Telegram user ID (required by UserGuard).' })
@IsString()
@IsNotEmpty()
tgId: string;
```

---

## Pagination Contract

Query DTOs must include `page` (default `1`, min `1`) and `limit` (default `20`, min `1`), both decorated with `@IsOptional`, `@Type(() => Number)`, `@IsInt`, `@Min(1)`. Add domain-specific filters below.

The paginated response shape is fixed:

```json
{
  "data": [...],
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

Extend `PaginatedResponseDto<T>` from `src/common/dto/paginated-response.dto.ts` for all list responses.

---

## Error Response Shape

`AppExceptionFilter` always returns:

```json
{ "statusCode": 404, "path": "/food-entries/abc", "message": "...", "errorCode": "NOT_FOUND" }
```

`errorCode` is optional but strongly preferred for machine-readable codes. Use `ErrorResponseDto` as the Swagger type on all error `@ApiResponse` declarations.

---

## Swagger Requirements

- Controller: `@ApiTags`, `@ApiSecurity('api-key')` on every protected controller.
- Every route: `@ApiOperation({ summary: '...' })`, `@ApiResponse` for every success status, `@ApiResponse` for every error status (400, 401, 404, 409, 429, 500).
- `@ApiQuery({ name: 'tgId', required: true, ... })` on every route that uses `UserGuard` or `AdminGuard`.

---

## Backward Compatibility

- Do not remove or rename DTO fields.
- Do not change the type of a field in a breaking way.
- Do not change route paths or HTTP methods without explicit instruction.
- Adding new optional fields to requests or new fields to responses is safe.
- Flag any breaking change explicitly before proceeding.