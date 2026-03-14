import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { FoodReviewType } from '../enums/food-review-type.enum';

export class QueryFoodReviewsDto {
  @ApiProperty({ description: 'Telegram user ID of the requesting user — validated by UserGuard.', example: '123456789' })
  @IsString()
  @IsNotEmpty()
  tgId: string;

  @ApiPropertyOptional({ description: 'Filter by user UUID', example: 'uuid-of-user' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: FoodReviewType, description: 'Filter by review type' })
  @IsOptional()
  @IsEnum(FoodReviewType)
  type?: FoodReviewType;

  @ApiPropertyOptional({ description: 'Filter reviews whose periodStart is on or after this timestamp (Unix ms)', example: 1741392000000 })
  @IsOptional()
  @Type(() => Number)
  dateFrom?: number;

  @ApiPropertyOptional({ description: 'Filter reviews whose periodEnd is on or before this timestamp (Unix ms)', example: 1741478400000 })
  @IsOptional()
  @Type(() => Number)
  dateTo?: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}