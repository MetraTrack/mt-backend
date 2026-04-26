# Skill: nestjs-domain-scaffold

Use this skill when scaffolding a new domain module. It provides the canonical directory layout, file templates, and a documentation update checklist.

---

## Directory Layout

```
src/<domain>/
├── <domain>.module.ts
├── controllers/
│   └── <domain>.controller.ts
├── services/
│   └── <domain>.service.ts
├── dto/
│   ├── create-<domain>.dto.ts
│   ├── update-<domain>.dto.ts
│   ├── query-<domain>.dto.ts
│   ├── <domain>-response.dto.ts
│   └── <domain>-paginated-response.dto.ts
└── entities/
    └── <domain>.entity.ts
```

Register the module in `AppModule`.

---

## Entity Template

```ts
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BigintTransformer, NullableBigintTransformer } from '../../common/util/bigint.transformer';

@Entity('<domain>s')
export class DomainEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  createdAt: number;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  updatedAt: number;

  @Column({ type: 'bigint', nullable: true, transformer: NullableBigintTransformer })
  deletedAt: number | null;
}
```

Key rules:
- `@PrimaryColumn('uuid')` — UUID assigned via `uuidv4()` in the service, not the constructor.
- Timestamps as Unix milliseconds (`bigint` column, `number` in TypeScript via transformers from `src/common/util/bigint.transformer.ts`).
- `deletedAt: number | null` for soft deletes. Never `@DeleteDateColumn`.
- Explicit column types always.

---

## Controller Template

```ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { UserGuard } from '../../users/guards/user.guard';
import { ErrorResponseDto } from '../../common/error/error-response.dto';
import { DomainService } from '../services/domain.service';

@ApiTags('Domain')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('domain')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get()
  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'List with pagination' })
  @ApiQuery({ name: 'tgId', required: true })
  @ApiResponse({ status: 200, type: DomainPaginatedResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  findAll(@Query() query: QueryDomainDto) {
    return this.domainService.findAll(query);
  }
}
```

---

## DTO Templates

**Query DTO with tgId:**

```ts
import { IsInt, IsOptional, IsString, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryDomainDto {
  @ApiProperty({ description: 'Telegram user ID (required by UserGuard).' })
  @IsString()
  @IsNotEmpty()
  tgId: string;

  @ApiProperty({ description: 'Page number', example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', example: 20, required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
```

**Paginated Response DTO:**

```ts
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { DomainResponseDto } from './domain-response.dto';

export class DomainPaginatedResponseDto extends PaginatedResponseDto<DomainResponseDto> {
  @ApiProperty({ type: [DomainResponseDto] })
  data: DomainResponseDto[];
}
```

---

## Service Template

```ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DomainEntity } from '../entities/domain.entity';
import { LoggingService } from '../../common/logging/logging.service';

@Injectable()
export class DomainService {
  constructor(
    @InjectRepository(DomainEntity)
    private readonly repo: Repository<DomainEntity>,
    private readonly logger: LoggingService,
  ) {}

  async create(dto: CreateDomainDto): Promise<DomainEntity> {
    const now = Date.now();
    const entity = this.repo.create({
      id: uuidv4(),
      ...dto,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    const saved = await this.repo.save(entity);
    this.logger.info('Domain item created', { id: saved.id });
    return saved;
  }

  async findById(id: string): Promise<DomainEntity> {
    const entity = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!entity) throw new NotFoundException(`Domain item ${id} not found`);
    return entity;
  }

  async findMany(query: QueryDomainDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.createQueryBuilder('d')
      .where('d.deletedAt IS NULL')
      .orderBy('d.createdAt', 'DESC')
      .skip(skip).take(limit).getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
```

---

## Module Template

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { DomainEntity } from './entities/domain.entity';
import { DomainController } from './controllers/domain.controller';
import { DomainService } from './services/domain.service';
import { LoggingService } from '../common/logging/logging.service';

@Module({
  imports: [TypeOrmModule.forFeature([DomainEntity]), UsersModule],
  controllers: [DomainController],
  providers: [
    DomainService,
    { provide: LoggingService, useFactory: () => new LoggingService('DomainService') },
  ],
  exports: [DomainService],
})
export class DomainModule {}
```

Import `UsersModule` whenever `UserGuard` or `AdminGuard` are needed.

---

## Post-Scaffold Checklist

- [ ] Module registered in `AppModule`
- [ ] Entity file created in `src/<domain>/entities/`
- [ ] Migration generated: `npm run migration:generate -- src/migrations/CreateDomainTable`
- [ ] Service spec file created (see `minimal-test-strategy` skill)
- [ ] `README.md` updated (add domain to structure and feature list)
- [ ] `.env.example` updated if new env variables are needed
