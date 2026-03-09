import { FoodReview } from '../entities/food-review.entity';
import { FoodReviewType } from '../enums/food-review-type.enum';

export interface ReviewAggregateItem {
  id: string;
  type: FoodReviewType;
  periodStart: number;
  periodEnd: number;
  summaryText: string;
  recommendationsText: string;
}

export interface ReviewAggregate {
  reviewCount: number;
  reviews: ReviewAggregateItem[];
}

// Builds a structured aggregate for weekly/monthly review generation.
// Each source review is included in full so the AI model can reason over individual period summaries.
export function aggregateSourceReviews(reviews: FoodReview[]): ReviewAggregate {
  return {
    reviewCount: reviews.length,
    reviews: reviews.map((r) => ({
      id: r.id,
      type: r.type,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      summaryText: r.summaryText,
      recommendationsText: r.recommendationsText,
    })),
  };
}