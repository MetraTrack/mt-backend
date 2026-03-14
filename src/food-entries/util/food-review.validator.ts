import { BadRequestException } from '@nestjs/common';
import { CreateFoodReviewDto } from '../dto/create-food-review.dto';

export function validateFoodReviewCompleteness(dto: CreateFoodReviewDto): void {
  if (!dto.summaryText?.trim()) {
    throw new BadRequestException('summaryText is required and must not be empty.');
  }
  if (!dto.recommendationsText?.trim()) {
    throw new BadRequestException('recommendationsText is required and must not be empty.');
  }
  if (dto.periodStart >= dto.periodEnd) {
    throw new BadRequestException('periodStart must be before periodEnd.');
  }
}