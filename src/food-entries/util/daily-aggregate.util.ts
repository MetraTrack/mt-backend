import { FoodEntry } from '../entities/food-entry.entity';

export interface DailyAggregateEntry {
  id: string;
  mealSummary: string;
  portionGrams: number;
  caloriesKcal: number;
  proteinsGrams: number;
  fatsGrams: number;
  carbsGrams: number;
  confidence: number;
  notes: string | null;
  eatenAt: number;
}

export interface DailyAggregate {
  entryCount: number;
  totalPortionGrams: number;
  totalCaloriesKcal: number;
  totalProteinsGrams: number;
  totalFatsGrams: number;
  totalCarbsGrams: number;
  entries: DailyAggregateEntry[];
}

export function aggregateDailyEntries(entries: FoodEntry[]): DailyAggregate {
  const totals = entries.reduce(
    (acc, e) => ({
      totalPortionGrams: acc.totalPortionGrams + e.portionGrams,
      totalCaloriesKcal: acc.totalCaloriesKcal + e.caloriesKcal,
      totalProteinsGrams: acc.totalProteinsGrams + e.proteinsGrams,
      totalFatsGrams: acc.totalFatsGrams + e.fatsGrams,
      totalCarbsGrams: acc.totalCarbsGrams + e.carbsGrams,
    }),
    {
      totalPortionGrams: 0,
      totalCaloriesKcal: 0,
      totalProteinsGrams: 0,
      totalFatsGrams: 0,
      totalCarbsGrams: 0,
    },
  );

  return {
    entryCount: entries.length,
    ...totals,
    entries: entries.map((e) => ({
      id: e.id,
      mealSummary: e.mealSummary,
      portionGrams: e.portionGrams,
      caloriesKcal: e.caloriesKcal,
      proteinsGrams: e.proteinsGrams,
      fatsGrams: e.fatsGrams,
      carbsGrams: e.carbsGrams,
      confidence: e.confidence,
      notes: e.notes,
      eatenAt: e.eatenAt!,
    })),
  };
}