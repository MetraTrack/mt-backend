import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FoodReviewType } from '../enums/food-review-type.enum';
import { FoodReview } from '../entities/food-review.entity';
import { FoodEntryResponseDto } from './food-entry-response.dto';

export class FoodReviewResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid-of-user' })
  userId: string;

  @ApiProperty({ enum: FoodReviewType, example: FoodReviewType.DAILY })
  type: FoodReviewType;

  @ApiProperty({ example: 1741392000000 })
  periodStart: number;

  @ApiProperty({ example: 1741478400000 })
  periodEnd: number;

  @ApiProperty({ type: [FoodEntryResponseDto], description: 'Source food entries (mainly for DAILY reviews).' })
  sourceFoodEntries: FoodEntryResponseDto[];

  @ApiProperty({ type: [String], description: 'Source review UUIDs (mainly for WEEKLY/MONTHLY reviews).' })
  sourceReviewIds: string[];

  @ApiProperty({ example: 'You had a balanced day with adequate protein intake.' })
  summaryText: string;

  @ApiProperty({ example: 'Consider adding more vegetables to your evening meals.' })
  recommendationsText: string;

  @ApiPropertyOptional({ nullable: true })
  rawReviewData: Record<string, any> | null;

  @ApiProperty({ example: 1741440000000 })
  createdAt: number;

  @ApiProperty({ example: 1741440000000 })
  updatedAt: number;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: number | null;

  static from(review: FoodReview): FoodReviewResponseDto {
    const dto = new FoodReviewResponseDto();
    dto.id = review.id;
    dto.userId = review.userId;
    dto.type = review.type;
    dto.periodStart = review.periodStart;
    dto.periodEnd = review.periodEnd;
    dto.sourceFoodEntries = (review.sourceFoodEntries ?? []).map(FoodEntryResponseDto.from);
    dto.sourceReviewIds = review.sourceReviewIds ?? [];
    dto.summaryText = review.summaryText;
    dto.recommendationsText = review.recommendationsText;
    dto.rawReviewData = review.rawReviewData;
    dto.createdAt = review.createdAt;
    dto.updatedAt = review.updatedAt;
    dto.deletedAt = review.deletedAt;
    return dto;
  }
}