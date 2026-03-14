import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { FoodReviewType } from '../enums/food-review-type.enum';
import { FoodEntry } from './food-entry.entity';
import { BigintTransformer, NullableBigintTransformer } from '../../common/util/bigint.transformer';

@Entity('food_reviews')
export class FoodReview {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: FoodReviewType })
  type: FoodReviewType;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  periodStart: number;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  periodEnd: number;

  // mainly for DAILY reviews — full entries embedded via join table
  @ManyToMany(() => FoodEntry, { eager: false })
  @JoinTable({
    name: 'food_review_source_entries',
    joinColumn: { name: 'review_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'entry_id', referencedColumnName: 'id' },
  })
  sourceFoodEntries: FoodEntry[];

  // mainly for WEEKLY/MONTHLY reviews — stored as plain UUIDs
  @Column({ type: 'jsonb', nullable: true })
  sourceReviewIds: string[] | null;

  @Column({ type: 'text' })
  summaryText: string;

  @Column({ type: 'text' })
  recommendationsText: string;

  // raw AI/provider response
  @Column({ type: 'jsonb', nullable: true })
  rawReviewData: Record<string, any> | null;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  createdAt: number;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  updatedAt: number;

  @Column({ type: 'bigint', nullable: true, transformer: NullableBigintTransformer })
  deletedAt: number | null;
}