# Skill: telegram-auth-pattern

Use this skill when adding or reviewing authentication and authorization. This project uses API key + Telegram ID-based guards — no JWT.

---

## Auth Model

This backend is Telegram-first and machine-to-machine. There are no human login flows. All requests come from the Telegram bot backend which holds the shared API key.

| Guard | What it checks | Where to apply |
|---|---|---|
| `ApiKeyGuard` | `X-API-KEY` header vs `API_KEY` env var | `@UseGuards(ApiKeyGuard)` at controller class level |
| `UserGuard` | `?tgId=` query param resolves to an active user | `@UseGuards(UserGuard)` at route level |
| `AdminGuard` | Same as UserGuard + `tgId` is in `TG_ADMIN_IDS` | `@UseGuards(AdminGuard)` at route level |

---

## Guard Files

- `src/common/guards/api-key.guard.ts` — `ApiKeyGuard`. No DI deps. Safe to use everywhere.
- `src/users/guards/user.guard.ts` — `UserGuard`. Depends on `UsersService`.
- `src/users/guards/admin.guard.ts` — `AdminGuard`. Depends on `UsersService`.
- Both user-domain guards are exported from `UsersModule`. Import `UsersModule` in any module that needs them.

---

## Applying Guards

```ts
@ApiTags('My Domain')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)          // API key on every request
@Controller('my-domain')
export class MyController {

  @Get()
  @UseGuards(UserGuard)           // User context required
  @ApiQuery({ name: 'tgId', required: true })
  findAll(@Query() query: QueryMyDomainDto) { ... }

  @Delete(':id')
  @UseGuards(AdminGuard)          // Admin only
  @ApiQuery({ name: 'tgId', required: true })
  remove(@Param('id') id: string, @Query() query: QueryMyDomainDto) { ... }

  @Get('public')
  // No extra guard — ApiKeyGuard only
  getPublicInfo() { ... }
}
```

---

## tgId in Query DTOs

`forbidNonWhitelisted: true` is enabled globally. Every route using `UserGuard` or `AdminGuard` needs `tgId` explicitly declared in its query DTO:

```ts
export class QueryMyDomainDto {
  @ApiProperty({ description: 'Telegram user ID (required by UserGuard).' })
  @IsString()
  @IsNotEmpty()
  tgId: string;

  // ... other filters, pagination
}
```

Also declare `@ApiQuery({ name: 'tgId', required: true, description: '...' })` on the route for Swagger.

---

## TG_ADMIN_IDS

Admin check uses the `TG_ADMIN_IDS` environment variable — a comma-separated list of Telegram user IDs. `AdminGuard` reads it directly via `process.env`. Add new admin IDs in the env config, not in code.

---

## Module Wiring

When a module needs `UserGuard` or `AdminGuard`, import `UsersModule`:

```ts
@Module({
  imports: [TypeOrmModule.forFeature([MyEntity]), UsersModule],
  controllers: [MyController],
  providers: [MyService, { provide: LoggingService, useFactory: () => new LoggingService('MyService') }],
})
export class MyModule {}
```

`ApiKeyGuard` needs no module import.

---

## Swagger Security Scheme

`main.ts` registers the `api-key` security scheme globally. Apply `@ApiSecurity('api-key')` to every protected controller. Routes behind `UserGuard`/`AdminGuard` additionally need `@ApiQuery({ name: 'tgId', ... })`.

---

## Error Codes

| Scenario | Status | errorCode |
|---|---|---|
| Missing/invalid `X-API-KEY` | 401 | `INVALID_API_KEY` |
| `tgId` not found or user deleted | 404 | `USER_NOT_FOUND` |
| `tgId` not in `TG_ADMIN_IDS` | 403 | `FORBIDDEN` |
