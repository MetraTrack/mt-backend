import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateFoodEntryDto {
  @ApiPropertyOptional({ example: 'Grilled chicken with rice' })
  @IsOptional()
  @IsString()
  mealSummary?: string;

  @ApiPropertyOptional({ example: 350 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  portionGrams?: number;

  @ApiPropertyOptional({ example: 520 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caloriesKcal?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinsGrams?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fatsGrams?: number;

  @ApiPropertyOptional({ example: 55 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbsGrams?: number;

  @ApiPropertyOptional({ example: 0.95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiPropertyOptional({ description: 'Updated model notes (e.g. after re-analysis).', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}