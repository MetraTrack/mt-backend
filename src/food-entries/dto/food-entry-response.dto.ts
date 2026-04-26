import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FoodEntry } from '../entities/food-entry.entity';
import { AnalysisSource } from '../enums/analysis-source.enum';

export class FoodEntryResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid-of-user' })
  userId: string;

  @ApiPropertyOptional({ example: 'photo-uuid', nullable: true, description: 'Null for text/voice entries.' })
  photoId: string | null;

  @ApiProperty({ enum: AnalysisSource, description: 'How the entry was analyzed.' })
  analysisSource: AnalysisSource;

  @ApiProperty({ example: 'openai' })
  analysisProvider: string;

  @ApiProperty({ example: 'gpt-4o' })
  analysisModel: string;

  @ApiProperty({ example: 'Grilled chicken with rice and vegetables' })
  mealSummary: string;

  @ApiProperty({ example: 350 })
  portionGrams: number;

  @ApiProperty({ example: 520 })
  caloriesKcal: number;

  @ApiProperty({ example: 45 })
  proteinsGrams: number;

  @ApiProperty({ example: 12 })
  fatsGrams: number;

  @ApiProperty({ example: 55 })
  carbsGrams: number;

  @ApiProperty({ example: 0.92 })
  confidence: number;

  @ApiPropertyOptional({ description: 'Caption provided by the user alongside the photo.', nullable: true })
  userCaption: string | null;

  @ApiPropertyOptional({ description: 'Notes from the analysis model.', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'Null until confirmed by the user.', example: 1741440000000, nullable: true })
  eatenAt: number | null;

  @ApiProperty({ example: 1741440000000 })
  createdAt: number;

  @ApiProperty({ example: 1741440000000 })
  updatedAt: number;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: number | null;

  static from(entry: FoodEntry): FoodEntryResponseDto {
    const dto = new FoodEntryResponseDto();
    dto.id = entry.id;
    dto.userId = entry.userId;
    dto.photoId = entry.photoId;
    dto.analysisSource = entry.analysisSource;
    dto.analysisProvider = entry.analysisProvider;
    dto.analysisModel = entry.analysisModel;
    dto.mealSummary = entry.mealSummary;
    dto.portionGrams = entry.portionGrams;
    dto.caloriesKcal = entry.caloriesKcal;
    dto.proteinsGrams = entry.proteinsGrams;
    dto.fatsGrams = entry.fatsGrams;
    dto.carbsGrams = entry.carbsGrams;
    dto.confidence = entry.confidence;
    dto.userCaption = entry.userCaption;
    dto.notes = entry.notes;
    dto.eatenAt = entry.eatenAt;
    dto.createdAt = entry.createdAt;
    dto.updatedAt = entry.updatedAt;
    dto.deletedAt = entry.deletedAt;
    return dto;
  }
}