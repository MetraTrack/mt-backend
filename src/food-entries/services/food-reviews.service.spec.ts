import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FoodReviewsService } from './food-reviews.service';
import { FoodReview } from '../entities/food-review.entity';
import { FoodEntry } from '../entities/food-entry.entity';
import { FoodReviewType } from '../enums/food-review-type.enum';
import { LoggingService } from '../../common/logging/logging.service';

const mockReview: Partial<FoodReview> = {
  id: 'review-uuid',
  userId: 'user-uuid',
  type: FoodReviewType.DAILY,
  sourceFoodEntries: [],
  sourceReviewIds: null,
  deletedAt: null,
};

const mockReviewRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockEntryRepo = { findBy: jest.fn() };
const mockLogger = { info: jest.fn(), error: jest.fn() };

describe('FoodReviewsService', () => {
  let service: FoodReviewsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FoodReviewsService,
        { provide: getRepositoryToken(FoodReview), useValue: mockReviewRepo },
        { provide: getRepositoryToken(FoodEntry), useValue: mockEntryRepo },
        { provide: LoggingService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(FoodReviewsService);
  });

  describe('findById', () => {
    it('throws NotFoundException when review does not exist', async () => {
      mockReviewRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns review when found', async () => {
      mockReviewRepo.findOne.mockResolvedValueOnce(mockReview);
      const result = await service.findById('review-uuid');
      expect(result).toEqual(mockReview);
    });
  });

  describe('delete', () => {
    it('sets deletedAt and saves', async () => {
      const review = { ...mockReview, deletedAt: null };
      mockReviewRepo.findOne.mockResolvedValueOnce(review);
      mockReviewRepo.save.mockImplementation(async (r) => r);

      await service.delete('review-uuid');

      expect(review.deletedAt).toBeGreaterThan(0);
    });
  });
});