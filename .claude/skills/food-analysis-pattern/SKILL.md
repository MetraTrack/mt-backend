# Skill: food-analysis-pattern

Use this skill when adding a new AI analysis pipeline to the `food-analysis` module, or when reviewing an existing one. It covers service structure, OpenAI integration, Zod validation, entry persistence, and bot callback.

---

## Two Pipelines, One Module

The `food-analysis` module contains two analysis pipelines with identical response shapes:

| Pipeline | Endpoint | OpenAI method | Entry ID source |
|---|---|---|---|
| Photo | `POST /food-analysis/analyze` | `analyzeImage()` | UUID from S3 upload (`FoodImageService`) |
| Text | `POST /food-analysis/analyze-text` | `generateText()` | `uuidv4()` directly |

Both use the same `FoodAnalysisSchema` (Zod), `FoodAnalysisResultDto`, and `BotCallbackService`.

---

## Service Structure

Each pipeline has its own service. A new pipeline follows this pattern:

```ts
@Injectable()
export class FoodXxxAnalysisService {
  private instructions: string | null = null;

  constructor(
    private readonly openai: OpenAIService,
    private readonly usersService: UsersService,
    private readonly foodEntriesService: FoodEntriesService,
    private readonly botCallback: BotCallbackService,
    private readonly logger: LoggingService,
  ) {}

  async analyze(...): Promise<FoodAnalysisResultDto> {
    // 1. Resolve user via usersService.findByTgId(tgId)
    // 2. Load instructions (cache in this.instructions)
    // 3. Call openai.analyzeImage() or openai.generateText()
    // 4. Validate parsed against FoodAnalysisSchema.safeParse()
    // 5. If not food: callback + return { status: 'not_food', tgId, entry: null }
    // 6. validateFoodEntryCompleteness() on the parsed values
    // 7. foodEntriesService.create({ ... })
    // 8. void this.botCallback.sendAnalysisResult(result)
    // 9. Return { status: 'food', tgId, entry: FoodEntryResponseDto.from(entry) }
  }

  private getInstructions(): string {
    if (this.instructions) return this.instructions;
    const filePath = join(__dirname, '../instructions/my-analysis.instructions.md');
    this.instructions = readFileSync(filePath, 'utf-8');
    return this.instructions;
  }
}
```

---

## Zod Validation

Always validate OpenAI output with `FoodAnalysisSchema.safeParse(parsed)` before touching the data. On failure, throw:

```ts
throw new InternalServerErrorException({
  message: 'OpenAI response did not match the expected schema.',
  errorCode: 'AI_PARSE_ERROR',
});
```

---

## Entry Persistence

For photo pipelines — `photoId` comes from `FoodImageService.processAndUpload()`.
For text pipelines — generate `photoId: uuidv4()` directly. The field name is reused as a unique analysis ID; there is no actual photo.

Store `textDescription` as `userCaption` on the food entry so it is visible in the response and queryable.

---

## Bot Callback

Always fire-and-forget:

```ts
void this.botCallback.sendAnalysisResult(result);
return result;
```

Never await the callback in the main path. `BotCallbackService` handles errors internally and logs them.

---

## Instruction Files

Every pipeline needs its own `.md` instruction file in `src/food-analysis/instructions/`. Naming convention: `<pipeline-name>.instructions.md`.

The instructions file must specify:
- Output format (identical JSON schema for all pipelines)
- When to detect food vs. not-food
- Estimation guidelines tailored to the input type (image vs. text vs. other)
- How to handle ambiguous input

---

## Module Registration

Register new services and controllers in `food-analysis.module.ts`:

```ts
controllers: [FoodAnalysisController, FoodTextAnalysisController, /* new */],
providers: [FoodAnalysisService, FoodTextAnalysisService, /* new */, FoodImageService, BotCallbackService, ...],
```

No new module needed — all analysis pipelines live in `FoodAnalysisModule`.

---

## Error Codes

| Scenario | Status | errorCode |
|---|---|---|
| OpenAI returns null/non-object | 500 | `AI_PARSE_ERROR` |
| Zod schema validation fails | 500 | `AI_PARSE_ERROR` |
| OpenAI rate limit | 429 | `OPENAI_RATE_LIMITED` |
| S3 upload failure (photo only) | 500 | `S3_ERROR` |
| User not found | 404 | `USER_NOT_FOUND` |
