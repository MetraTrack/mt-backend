import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FoodEntry } from '../entities/food-entry.entity';
import { CreateFoodEntryDto } from '../dto/create-food-entry.dto';
import { UpdateFoodEntryDto } from '../dto/update-food-entry.dto';
import { QueryFoodEntriesDto } from '../dto/query-food-entries.dto';
import { FoodEntriesPaginatedResponseDto } from '../dto/food-entries-paginated-response.dto';
import { FoodEntryResponseDto } from '../dto/food-entry-response.dto';
import { validateFoodEntryCompleteness } from '../util/food-entry.validator';
import { buildDayRange } from '../util/day-range.util';
import { aggregateDailyEntries, DailyAggregate } from '../util/daily-aggregate.util';
import { LoggingService } from '../../common/logging/logging.service';

@Injectable()
export class FoodEntriesService {
  constructor(
    @InjectRepository(FoodEntry)
    private readonly repo: Repository<FoodEntry>,
    private readonly logger: LoggingService,
  ) {}

  async create(dto: CreateFoodEntryDto): Promise<FoodEntry> {
    validateFoodEntryCompleteness(dto);

    const photoExists = await this.repo.findOne({ where: { photoId: dto.photoId } });
    if (photoExists) {
      throw new ConflictException(`A food entry for photo ${dto.photoId} already exists.`);
    }

    const now = Date.now();
    const entry = this.repo.create({
      id: uuidv4(),
      userId: dto.userId,
      photoId: dto.photoId,
      analysisProvider: dto.analysisProvider,
      analysisModel: dto.analysisModel,
      mealSummary: dto.mealSummary,
      portionGrams: dto.portionGrams,
      caloriesKcal: dto.caloriesKcal,
      proteinsGrams: dto.proteinsGrams,
      fatsGrams: dto.fatsGrams,
      carbsGrams: dto.carbsGrams,
      confidence: dto.confidence,
      userCaption: dto.userCaption ?? null,
      notes: dto.notes ?? null,
      eatenAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    const saved = await this.repo.save(entry);
    this.logger.info('FoodEntry created', { id: saved.id, userId: saved.userId });
    return saved;
  }

  async update(id: string, dto: UpdateFoodEntryDto): Promise<FoodEntry> {
    const entry = await this.findById(id);

    if (dto.mealSummary !== undefined) entry.mealSummary = dto.mealSummary;
    if (dto.portionGrams !== undefined) entry.portionGrams = dto.portionGrams;
    if (dto.caloriesKcal !== undefined) entry.caloriesKcal = dto.caloriesKcal;
    if (dto.proteinsGrams !== undefined) entry.proteinsGrams = dto.proteinsGrams;
    if (dto.fatsGrams !== undefined) entry.fatsGrams = dto.fatsGrams;
    if (dto.carbsGrams !== undefined) entry.carbsGrams = dto.carbsGrams;
    if (dto.confidence !== undefined) entry.confidence = dto.confidence;
    if (dto.notes !== undefined) entry.notes = dto.notes ?? null;
    entry.updatedAt = Date.now();

    const saved = await this.repo.save(entry);
    this.logger.info('FoodEntry updated', { id: saved.id });
    return saved;
  }

  async delete(id: string): Promise<void> {
    const entry = await this.findById(id);
    entry.deletedAt = Date.now();
    entry.updatedAt = Date.now();
    await this.repo.save(entry);
    this.logger.info('FoodEntry soft-deleted', { id });
  }

  async findById(id: string): Promise<FoodEntry> {
    const entry = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!entry) {
      throw new NotFoundException(`FoodEntry ${id} not found.`);
    }
    return entry;
  }

  async findMany(query: QueryFoodEntriesDto): Promise<FoodEntriesPaginatedResponseDto> {
    const { userId, confirmedOnly, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('entry').where('entry.deletedAt IS NULL');

    if (userId) {
      qb.andWhere('entry.userId = :userId', { userId });
    }
    if (confirmedOnly) {
      qb.andWhere('entry.eatenAt IS NOT NULL');
    }
    if (dateFrom) {
      qb.andWhere('entry.createdAt >= :dateFrom', { dateFrom: String(dateFrom) });
    }
    if (dateTo) {
      qb.andWhere('entry.createdAt <= :dateTo', { dateTo: String(dateTo) });
    }

    const [data, total] = await qb
      .orderBy('entry.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map(FoodEntryResponseDto.from),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async confirm(id: string): Promise<FoodEntry> {
    const entry = await this.findById(id);
    entry.eatenAt = Date.now();
    entry.updatedAt = Date.now();
    const saved = await this.repo.save(entry);
    this.logger.info('FoodEntry confirmed', { id: saved.id });
    return saved;
  }

  async getDailyEntries(userId: string, timestampMs: number): Promise<FoodEntry[]> {
    const { start, end } = buildDayRange(timestampMs);
    return this.repo
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.deletedAt IS NULL')
      .andWhere('entry.eatenAt IS NOT NULL')
      .andWhere('entry.eatenAt >= :start AND entry.eatenAt <= :end', {
        start: String(start),
        end: String(end),
      })
      .orderBy('entry.eatenAt', 'ASC')
      .getMany();
  }

  async getDailyAggregate(userId: string, timestampMs: number): Promise<DailyAggregate> {
    const entries = await this.getDailyEntries(userId, timestampMs);
    return aggregateDailyEntries(entries);
  }
}