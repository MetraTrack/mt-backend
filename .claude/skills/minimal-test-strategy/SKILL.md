# Skill: minimal-test-strategy

Use this skill when writing tests for services or guards. It defines the default test set, test harness structure, mocking conventions, and guidance for non-standard logic.

---

## Philosophy

- Do not aim for 100% coverage.
- Write tests that are minimal, sufficient, readable, and maintainable.
- Test service behavior, not framework behavior. Do not test what `ValidationPipe` or TypeORM already guarantee.
- Mock only what is necessary.

---

## Default CRUD Test Set

For storage services (those with a TypeORM repository):

| Method | Scenario | Assert |
|---|---|---|
| `findById` | Happy path | Returns correct entity |
| `findById` | Not found | Throws `NotFoundException` |
| `findMany` | Default params | Correct `skip`/`take`, correct `meta` shape |
| `create` | Happy path | Entity saved, correct fields set |
| `create` | Conflict (if applicable) | Throws `ConflictException` |
| `update` | Happy path | Fields updated and saved |
| `delete` | Happy path | `deletedAt` set, repo saved |
| `confirm` | Happy path (food entries) | `eatenAt` set, repo saved |

Omit scenarios that genuinely do not apply to the domain.

---

## Test Harness Template — Storage Service

```ts
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MyService } from './my.service';
import { MyEntity } from '../entities/my.entity';
import { LoggingService } from '../../common/logging/logging.service';

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: getRepositoryToken(MyEntity), useValue: mockRepo },
        { provide: LoggingService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(MyService);
  });

  // test groups here
});
```

---

## Test Harness Template — Analysis Service (OpenAI pipeline)

For services like `FoodTextAnalysisService` that orchestrate multiple dependencies:

```ts
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FoodTextAnalysisService } from './food-text-analysis.service';
import { OpenAIService } from '../../common/openai/openai.service';
import { UsersService } from '../../users/services/users.service';
import { FoodEntriesService } from '../../food-entries/services/food-entries.service';
import { BotCallbackService } from './bot-callback.service';
import { LoggingService } from '../../common/logging/logging.service';

const mockOpenAI = { generateText: jest.fn() };
const mockUsersService = { findByTgId: jest.fn() };
const mockFoodEntriesService = { create: jest.fn() };
const mockBotCallback = { sendAnalysisResult: jest.fn().mockResolvedValue(undefined) };
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('FoodTextAnalysisService', () => {
  let service: FoodTextAnalysisService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Note: do NOT spy on fs.readFileSync — CJS module properties are not configurable.
    // Analysis services read real instruction files from disk; let them do so in tests.

    const module = await Test.createTestingModule({
      providers: [
        FoodTextAnalysisService,
        { provide: OpenAIService, useValue: mockOpenAI },
        { provide: UsersService, useValue: mockUsersService },
        { provide: FoodEntriesService, useValue: mockFoodEntriesService },
        { provide: BotCallbackService, useValue: mockBotCallback },
        { provide: LoggingService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(FoodTextAnalysisService);
  });

  // test groups here
});
```

---

## QueryBuilder Mock Pattern

For paginated queries using `createQueryBuilder`:

```ts
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([mockItems, 25]),
};

mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
```

---

## Non-Standard Business Logic

When implementing a service with non-standard business logic:

1. **Propose the test cases first** — list each scenario and one sentence on what it covers.
2. **Wait for implicit or explicit approval** before writing the tests.
3. Write the minimal set that covers the distinct outcomes of each branch.

Example proposal format:
```
Proposed tests for FoodTextAnalysisService.analyze:
- Food detected → entry created, callback sent, 'food' result returned
- Not-food detected → no entry created, callback sent, 'not_food' result returned
- OpenAI returns null parsed → InternalServerErrorException (AI_PARSE_ERROR)
- OpenAI response fails Zod schema → InternalServerErrorException (AI_PARSE_ERROR)
- User not found → NotFoundException propagated
```

---

## What Not to Test

- `ValidationPipe` rejecting malformed request bodies — that is framework behavior.
- TypeORM connection or query behavior — that is infrastructure.
- Private methods directly — test them through public method behavior.
- Console/log output unless the logging behavior itself is the feature under test.
- The bot callback result — only verify it was called, not its internal behavior.
