import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateFoodEntryDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Unique photo identifier. One photo maps to exactly one entry.', example: 'photo-uuid' })
  @IsString()
  @IsNotEmpty()
  photoId: string;

  @ApiProperty({ example: 'openai' })
  @IsString()
  @IsNotEmpty()
  analysisProvider: string;

  @ApiProperty({ example: 'gpt-4o' })
  @IsString()
  @IsNotEmpty()
  analysisModel: string;

  @ApiProperty({ example: 'Grilled chicken with rice and vegetables' })
  @IsString()
  @IsNotEmpty()
  mealSummary: string;

  @ApiProperty({ example: 350 })
  @IsNumber()
  @Min(0)
  portionGrams: number;

  @ApiProperty({ example: 520 })
  @IsNumber()
  @Min(0)
  caloriesKcal: number;

  @ApiProperty({ example: 45 })
  @IsNumber()
  @Min(0)
  proteinsGrams: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  fatsGrams: number;

  @ApiProperty({ example: 55 })
  @IsNumber()
  @Min(0)
  carbsGrams: number;

  @ApiProperty({ description: 'Analysis confidence score: 0..1', example: 0.92 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiPropertyOptional({ description: 'Optional caption provided by the user alongside the photo (e.g. "200g chicken, no sauce").', example: '200g chicken breast, no sauce', nullable: true })
  @IsOptional()
  @IsString()
  userCaption?: string | null;

  @ApiPropertyOptional({ description: 'Optional notes from the analysis model, e.g. low-confidence warnings.', example: 'Could not distinguish between white and brown rice.', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}