import { z } from 'zod';

export const FoodAnalysisSchema = z.object({
  isFood: z.boolean(),
  mealSummary: z.string().nullable(),
  portionGrams: z.number().min(0).nullable(),
  caloriesKcal: z.number().min(0).nullable(),
  proteinsGrams: z.number().min(0).nullable(),
  fatsGrams: z.number().min(0).nullable(),
  carbsGrams: z.number().min(0).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  notes: z.string().nullable(),
});

export type FoodAnalysisSchemaType = z.infer<typeof FoodAnalysisSchema>;