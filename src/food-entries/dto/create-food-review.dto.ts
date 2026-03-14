import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { FoodReviewType } from '../enums/food-review-type.enum';

export class CreateFoodReviewDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: FoodReviewType, example: FoodReviewType.DAILY })
  @IsEnum(FoodReviewType)
  type: FoodReviewType;

  @ApiProperty({ description: 'Period start (Unix ms)', example: 1741392000000 })
  @IsNumber()
  periodStart: number;

  @ApiProperty({ description: 'Period end (Unix ms)', example: 1741478400000 })
  @IsNumber()
  periodEnd: number;

  @ApiPropertyOptional({ description: 'UUIDs of food entries that are source for this review (mainly for DAILY).', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sourceFoodEntryIds?: string[];

  @ApiPropertyOptional({ description: 'UUIDs of reviews that are source for this review (mainly for WEEKLY/MONTHLY).', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sourceReviewIds?: string[];

  @ApiProperty({ example: 'You had a balanced day with adequate protein intake.' })
  @IsString()
  @IsNotEmpty()
  summaryText: string;

  @ApiProperty({ example: 'Consider adding more vegetables to your evening meals.' })
  @IsString()
  @IsNotEmpty()
  recommendationsText: string;

  @ApiPropertyOptional({ description: 'Raw AI/provider response stored for debugging and re-processing.' })
  @IsOptional()
  rawReviewData?: Record<string, any>;
}