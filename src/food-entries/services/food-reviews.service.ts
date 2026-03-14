import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FoodReview } from '../entities/food-review.entity';
import { FoodEntry } from '../entities/food-entry.entity';
import { CreateFoodReviewDto } from '../dto/create-food-review.dto';
import { UpdateFoodReviewDto } from '../dto/update-food-review.dto';
import { QueryFoodReviewsDto } from '../dto/query-food-reviews.dto';
import { FoodReviewsPaginatedResponseDto } from '../dto/food-reviews-paginated-response.dto';
import { FoodReviewResponseDto } from '../dto/food-review-response.dto';
import { validateFoodReviewCompleteness } from '../util/food-review.validator';
import { LoggingService } from '../../common/logging/logging.service';

@Injectable()
export class FoodReviewsService {
  constructor(
    @InjectRepository(FoodReview)
    private readonly reviewRepo: Repository<FoodReview>,
    @InjectRepository(FoodEntry)
    private readonly entryRepo: Repository<FoodEntry>,
    private readonly logger: LoggingService,
  ) {}

  async create(dto: CreateFoodReviewDto): Promise<FoodReview> {
    validateFoodReviewCompleteness(dto);

    const sourceFoodEntries =
      dto.sourceFoodEntryIds?.length
        ? await this.entryRepo.findBy({ id: In(dto.sourceFoodEntryIds) })
        : [];

    const now = Date.now();
    const review = this.reviewRepo.create({
      id: uuidv4(),
      userId: dto.userId,
      type: dto.type,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      sourceFoodEntries,
      sourceReviewIds: dto.sourceReviewIds ?? null,
      summaryText: dto.summaryText,
      recommendationsText: dto.recommendationsText,
      rawReviewData: dto.rawReviewData ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    const saved = await this.reviewRepo.save(review);
    this.logger.info('FoodReview created', { id: saved.id, userId: saved.userId, type: saved.type });
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateFoodReviewDto): Promise<FoodReview> {
    const review = await this.findById(id);

    if (dto.summaryText !== undefined) review.summaryText = dto.summaryText;
    if (dto.recommendationsText !== undefined) review.recommendationsText = dto.recommendationsText;
    if (dto.rawReviewData !== undefined) review.rawReviewData = dto.rawReviewData;
    review.updatedAt = Date.now();

    await this.reviewRepo.save(review);
    this.logger.info('FoodReview updated', { id });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const review = await this.findById(id);
    review.deletedAt = Date.now();
    review.updatedAt = Date.now();
    await this.reviewRepo.save(review);
    this.logger.info('FoodReview soft-deleted', { id });
  }

  async findById(id: string): Promise<FoodReview> {
    const review = await this.reviewRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['sourceFoodEntries'],
    });
    if (!review) {
      throw new NotFoundException(`FoodReview ${id} not found.`);
    }
    return review;
  }

  async findMany(query: QueryFoodReviewsDto): Promise<FoodReviewsPaginatedResponseDto> {
    const { userId, type, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.sourceFoodEntries', 'entry')
      .where('review.deletedAt IS NULL');

    if (userId) {
      qb.andWhere('review.userId = :userId', { userId });
    }
    if (type) {
      qb.andWhere('review.type = :type', { type });
    }
    if (dateFrom) {
      qb.andWhere('review.periodStart >= :dateFrom', { dateFrom: String(dateFrom) });
    }
    if (dateTo) {
      qb.andWhere('review.periodEnd <= :dateTo', { dateTo: String(dateTo) });
    }

    const [data, total] = await qb
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map(FoodReviewResponseDto.from),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}