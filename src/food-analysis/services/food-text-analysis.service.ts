import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { OpenAIService } from '../../common/openai/openai.service';
import { UsersService } from '../../users/services/users.service';
import { FoodEntriesService } from '../../food-entries/services/food-entries.service';
import { FoodEntryResponseDto } from '../../food-entries/dto/food-entry-response.dto';
import { validateFoodEntryCompleteness } from '../../food-entries/util/food-entry.validator';
import { AnalysisSource } from '../../food-entries/enums/analysis-source.enum';
import { LoggingService } from '../../common/logging/logging.service';
import { BotCallbackService } from './bot-callback.service';
import { FoodAnalysisResultDto } from '../dto/food-analysis-result.dto';
import { FoodAnalysisSchema } from '../validation/food-analysis.schema';

@Injectable()
export class FoodTextAnalysisService {
  private instructions: string | null = null;

  constructor(
    private readonly openai: OpenAIService,
    private readonly usersService: UsersService,
    private readonly foodEntriesService: FoodEntriesService,
    private readonly botCallback: BotCallbackService,
    private readonly logger: LoggingService,
  ) {}

  async analyze(textDescription: string, tgId: string): Promise<FoodAnalysisResultDto> {
    this.logger.info('Text food analysis started', { tgId, descriptionLength: textDescription.length });

    // 1. Resolve user
    const user = await this.usersService.findByTgId(tgId);

    // 2. Load instructions (cached after first read)
    const instructions = this.getInstructions();

    // 3. Send to OpenAI
    this.logger.info('Sending text description to OpenAI', { tgId });
    const { parsed } = await this.openai.generateText({
      instructions,
      payload: { textDescription },
    });

    if (!parsed || typeof parsed !== 'object') {
      this.logger.error('OpenAI returned unparseable response', null, { tgId });
      throw new InternalServerErrorException({ message: 'OpenAI returned an unreadable response.', errorCode: 'AI_PARSE_ERROR' });
    }

    // 4. Zod schema validation
    const parseResult = FoodAnalysisSchema.safeParse(parsed);
    if (!parseResult.success) {
      this.logger.error('OpenAI response failed schema validation', null, {
        tgId,
        issues: parseResult.error.issues,
        parsed,
      });
      throw new InternalServerErrorException({ message: 'OpenAI response did not match the expected schema.', errorCode: 'AI_PARSE_ERROR' });
    }

    const analysis = parseResult.data;
    this.logger.info('OpenAI text analysis result', { tgId, isFood: analysis.isFood, confidence: analysis.confidence });

    // 5. Non-food path
    if (!analysis.isFood) {
      this.logger.info('Non-food text detected', { tgId });
      const result: FoodAnalysisResultDto = { status: 'not_food', tgId, entry: null };
      void this.botCallback.sendAnalysisResult(result);
      return result;
    }

    // 6. Food data validation
    validateFoodEntryCompleteness({
      portionGrams: analysis.portionGrams!,
      caloriesKcal: analysis.caloriesKcal!,
      proteinsGrams: analysis.proteinsGrams!,
      fatsGrams: analysis.fatsGrams!,
      carbsGrams: analysis.carbsGrams!,
      confidence: analysis.confidence!,
    });

    // 7. Save food entry
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const entry = await this.foodEntriesService.create({
      userId: user.id,
      photoId: null,
      analysisSource: AnalysisSource.TEXT,
      analysisProvider: 'openai',
      analysisModel: model,
      mealSummary: analysis.mealSummary!,
      portionGrams: analysis.portionGrams!,
      caloriesKcal: analysis.caloriesKcal!,
      proteinsGrams: analysis.proteinsGrams!,
      fatsGrams: analysis.fatsGrams!,
      carbsGrams: analysis.carbsGrams!,
      confidence: analysis.confidence!,
      userCaption: textDescription,
      notes: analysis.notes ?? null,
    });

    this.logger.info('Text food entry saved', { entryId: entry.id, userId: user.id, tgId });

    // 8. Send callback and return
    const result: FoodAnalysisResultDto = {
      status: 'food',
      tgId,
      entry: FoodEntryResponseDto.from(entry),
    };
    void this.botCallback.sendAnalysisResult(result);
    return result;
  }

  private getInstructions(): string {
    if (this.instructions) return this.instructions;
    const filePath = join(__dirname, '../instructions/food-text-analysis.instructions.md');
    this.instructions = readFileSync(filePath, 'utf-8');
    return this.instructions;
  }
}