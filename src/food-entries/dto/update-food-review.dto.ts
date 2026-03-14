import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFoodReviewDto {
  @ApiPropertyOptional({ example: 'Updated summary after re-analysis.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  summaryText?: string;

  @ApiPropertyOptional({ example: 'Updated recommendations.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  recommendationsText?: string;

  @ApiPropertyOptional({ description: 'Updated raw AI/provider response.' })
  @IsOptional()
  rawReviewData?: Record<string, any>;
}