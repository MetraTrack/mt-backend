import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BigintTransformer, NullableBigintTransformer } from '../../common/util/bigint.transformer';

@Entity('food_entries')
export class FoodEntry {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  photoId: string;

  @Column()
  analysisProvider: string;

  @Column()
  analysisModel: string;

  @Column({ type: 'text' })
  mealSummary: string;

  @Column({ type: 'float' })
  portionGrams: number;

  @Column({ type: 'float' })
  caloriesKcal: number;

  @Column({ type: 'float' })
  proteinsGrams: number;

  @Column({ type: 'float' })
  fatsGrams: number;

  @Column({ type: 'float' })
  carbsGrams: number;

  // Analysis confidence score: 0..1
  @Column({ type: 'float' })
  confidence: number;

  // Model notes about confidence 
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'bigint', nullable: true, transformer: NullableBigintTransformer })
  eatenAt: number | null;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  createdAt: number;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  updatedAt: number;

  @Column({ type: 'bigint', nullable: true, transformer: NullableBigintTransformer })
  deletedAt: number | null;
}