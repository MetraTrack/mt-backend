import { BadRequestException } from '@nestjs/common';
import { CreateFoodEntryDto } from '../dto/create-food-entry.dto';

type NutritionFields = Pick<
  CreateFoodEntryDto,
  'portionGrams' | 'caloriesKcal' | 'proteinsGrams' | 'fatsGrams' | 'carbsGrams' | 'confidence'
>;

export function validateFoodEntryCompleteness(dto: NutritionFields): void {
  const fields: Array<keyof NutritionFields> = [
    'portionGrams',
    'caloriesKcal',
    'proteinsGrams',
    'fatsGrams',
    'carbsGrams',
    'confidence',
  ];

  for (const field of fields) {
    const value = dto[field];
    if (value === null || value === undefined) {
      throw new BadRequestException(`${field} is required and must not be null.`);
    }
    if (value < 0) {
      throw new BadRequestException(`${field} must be non-negative.`);
    }
  }

  if (dto.confidence < 0 || dto.confidence > 1) {
    throw new BadRequestException('confidence must be between 0 and 1.');
  }
}