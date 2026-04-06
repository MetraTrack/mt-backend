import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { OpenAIService } from '../../common/openai/openai.service';
import { UsersService } from '../../users/services/users.service';
import { FoodEntriesService } from '../../food-entries/services/food-entries.service';
import { FoodEntryResponseDto } from '../../food-entries/dto/food-entry-response.dto';
import { validateFoodEntryCompleteness } from '../../food-entries/util/food-entry.validator';
import { LoggingService } from '../../common/logging/logging.service';
import { FoodImageService } from './food-image.service';
import { BotCallbackService } from './bot-callback.service';
import { FoodAnalysisResultDto } from '../dto/food-analysis-result.dto';
import { FoodAnalysisSchema } from '../validation/food-analysis.schema';

@Injectable()
export class FoodAnalysisService {
  private instructions: string | null = null;

  constructor(
    private readonly openai: OpenAIService,
    private readonly usersService: UsersService,
    private readonly foodEntriesService: FoodEntriesService,
    private readonly foodImageService: FoodImageService,
    private readonly botCallback: BotCallbackService,
    private readonly logger: LoggingService,
  ) {}

  async analyze(
    file: Express.Multer.File,
    telegramFileId: string,
    tgId: string,
    userCaption?: string | null,
  ): Promise<FoodAnalysisResultDto> {
    this.logger.info('Food analysis started', { tgId, telegramFileId, fileSize: file.size });

    // 1. Resolve user
    const user = await this.usersService.findByTgId(tgId);

    // 2. Process image and upload to S3
    const { photoId, buffer, mimeType } = await this.foodImageService.processAndUpload(file);

    // 3. Load instructions (cached after first read)
    const instructions = this.getInstructions();

    // 4. Send to OpenAI
    this.logger.info('Sending image to OpenAI', { photoId, tgId });
    const { parsed } = await this.openai.analyzeImage({
      instructions,
      imageBase64: buffer.toString('base64'),
      mimeType,
      userCaption: userCaption ?? null,
    });

    if (!parsed || typeof parsed !== 'object') {
      this.logger.error('OpenAI returned unparseable response', null, { tgId, photoId });
      throw new InternalServerErrorException({ message: 'OpenAI returned an unreadable response.', errorCode: 'AI_PARSE_ERROR' });
    }

    // 5. Zod schema validation
    const parseResult = FoodAnalysisSchema.safeParse(parsed);
    if (!parseResult.success) {
      this.logger.error('OpenAI response failed schema validation', null, {
        tgId,
        photoId,
        issues: parseResult.error.issues,
        parsed,
      });
      throw new InternalServerErrorException({ message: 'OpenAI response did not match the expected schema.', errorCode: 'AI_PARSE_ERROR' });
    }

    const analysis = parseResult.data;
    this.logger.info('OpenAI analysis result', { tgId, photoId, isFood: analysis.isFood, confidence: analysis.confidence });

    // 6. Non-food path
    if (!analysis.isFood) {
      this.logger.info('Non-food image detected', { tgId, photoId });
      const result: FoodAnalysisResultDto = { status: 'not_food', tgId, entry: null };
      void this.botCallback.sendAnalysisResult(result);
      return result;
    }

    // 7. Food data validation
    validateFoodEntryCompleteness({
      portionGrams: analysis.portionGrams!,
      caloriesKcal: analysis.caloriesKcal!,
      proteinsGrams: analysis.proteinsGrams!,
      fatsGrams: analysis.fatsGrams!,
      carbsGrams: analysis.carbsGrams!,
      confidence: analysis.confidence!,
    });

    // 8. Save food entry
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const entry = await this.foodEntriesService.create({
      userId: user.id,
      photoId,
      analysisProvider: 'openai',
      analysisModel: model,
      mealSummary: analysis.mealSummary!,
      portionGrams: analysis.portionGrams!,
      caloriesKcal: analysis.caloriesKcal!,
      proteinsGrams: analysis.proteinsGrams!,
      fatsGrams: analysis.fatsGrams!,
      carbsGrams: analysis.carbsGrams!,
      confidence: analysis.confidence!,
      userCaption: userCaption ?? null,
      notes: analysis.notes ?? null,
    });

    this.logger.info('Food entry saved', { entryId: entry.id, userId: user.id, tgId, photoId });

    // 9. Send callback and return
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
    const filePath = join(__dirname, '../instructions/food-analysis.instructions.md');
    this.instructions = readFileSync(filePath, 'utf-8');
    return this.instructions;
  }
}