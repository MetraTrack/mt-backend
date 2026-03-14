import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FoodEntriesService } from './food-entries.service';
import { FoodEntry } from '../entities/food-entry.entity';
import { LoggingService } from '../../common/logging/logging.service';

const mockEntry: Partial<FoodEntry> = {
  id: 'entry-uuid',
  userId: 'user-uuid',
  photoId: 'photo-1',
  eatenAt: null,
  deletedAt: null,
  createdAt: 1000,
  updatedAt: 1000,
};

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockLogger = { info: jest.fn(), error: jest.fn() };

describe('FoodEntriesService', () => {
  let service: FoodEntriesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FoodEntriesService,
        { provide: getRepositoryToken(FoodEntry), useValue: mockRepo },
        { provide: LoggingService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(FoodEntriesService);
  });

  describe('create', () => {
    it('throws ConflictException if photoId already exists', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockEntry);
      await expect(
        service.create({
          userId: 'u', photoId: 'photo-1', analysisProvider: 'p', analysisModel: 'm',
          mealSummary: 's', portionGrams: 100, caloriesKcal: 200, proteinsGrams: 10,
          fatsGrams: 5, carbsGrams: 30, confidence: 0.9,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when entry does not exist', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns entry when found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockEntry);
      const result = await service.findById('entry-uuid');
      expect(result).toEqual(mockEntry);
    });
  });

  describe('confirm', () => {
    it('sets eatenAt and saves', async () => {
      const entry = { ...mockEntry, eatenAt: null };
      mockRepo.findOne.mockResolvedValueOnce(entry);
      mockRepo.save.mockImplementation(async (e) => e);

      const result = await service.confirm('entry-uuid');

      expect(result.eatenAt).toBeGreaterThan(0);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('sets deletedAt and saves', async () => {
      const entry = { ...mockEntry, deletedAt: null };
      mockRepo.findOne.mockResolvedValueOnce(entry);
      mockRepo.save.mockImplementation(async (e) => e);

      await service.delete('entry-uuid');

      expect(entry.deletedAt).toBeGreaterThan(0);
    });
  });
});