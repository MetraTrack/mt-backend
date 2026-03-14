import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BigintTransformer, NullableBigintTransformer } from '../../common/util/bigint.transformer';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  /** Telegram user ID — immutable after creation */
  @Column({ unique: true })
  tgId: string;

  @Column({ nullable: true, type: 'varchar' })
  tgUsername: string | null;

  @Column()
  tgFirstName: string;

  @Column({ nullable: true, type: 'varchar' })
  tgLastName: string | null;

  @Column({ nullable: true, type: 'varchar' })
  tgLanguageCode: string | null;

  @Column({ default: false })
  tgIsPremium: boolean;

  @Column({ default: false })
  isBot: boolean;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  createdAt: number;

  @Column({ type: 'bigint', transformer: BigintTransformer })
  updatedAt: number;

  /** Null means active. Non-null means soft-deleted (value = deletion timestamp in ms). */
  @Column({ type: 'bigint', nullable: true, transformer: NullableBigintTransformer })
  deletedAt: number | null;
}