import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AnalysisSource } from '../../food-entries/enums/analysis-source.enum';
import { FoodTextAnalysisService } from './food-text-analysis.service';
import { OpenAIService } from '../../common/openai/openai.service';
import { UsersService } from '../../users/services/users.service';
import { FoodEntriesService } from '../../food-entries/services/food-entries.service';
import { BotCallbackService } from './bot-callback.service';
import { LoggingService } from '../../common/logging/logging.service';

const mockUser = { id: 'user-uuid', tgId: '123456789' };

const mockFoodEntry = {
  id: 'entry-uuid',
  userId: 'user-uuid',
  photoId: null,
  analysisSource: AnalysisSource.TEXT,
  analysisProvider: 'openai',
  analysisModel: 'gpt-4o',
  mealSummary: '200g grilled chicken breast',
  portionGrams: 200,
  caloriesKcal: 330,
  proteinsGrams: 62,
  fatsGrams: 7,
  carbsGrams: 0,
  confidence: 0.92,
  userCaption: '200g grilled chicken breast',
  notes: null,
  eatenAt: null,
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
};

const validFoodParsed = {
  isFood: true,
  mealSummary: '200g grilled chicken breast',
  portionGrams: 200,
  caloriesKcal: 330,
  proteinsGrams: 62,
  fatsGrams: 7,
  carbsGrams: 0,
  confidence: 0.92,
  notes: null,
};

const notFoodParsed = {
  isFood: false,
  mealSummary: null,
  portionGrams: null,
  caloriesKcal: null,
  proteinsGrams: null,
  fatsGrams: null,
  carbsGrams: null,
  confidence: null,
  notes: null,
};

const mockOpenAI = { generateText: jest.fn() };
const mockUsersService = { findByTgId: jest.fn() };
const mockFoodEntriesService = { create: jest.fn() };
const mockBotCallback = { sendAnalysisResult: jest.fn().mockResolvedValue(undefined) };
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('FoodTextAnalysisService', () => {
  let service: FoodTextAnalysisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        FoodTextAnalysisService,
        { provide: OpenAIService, useValue: mockOpenAI },
        { provide: UsersService, useValue: mockUsersService },
        { provide: FoodEntriesService, useValue: mockFoodEntriesService },
        { provide: BotCallbackService, useValue: mockBotCallback },
        { provide: LoggingService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get(FoodTextAnalysisService);
  });

  describe('analyze — food detected', () => {
    it('creates entry and returns food result', async () => {
      mockUsersService.findByTgId.mockResolvedValue(mockUser);
      mockOpenAI.generateText.mockResolvedValue({ parsed: validFoodParsed });
      mockFoodEntriesService.create.mockResolvedValue(mockFoodEntry);

      const result = await service.analyze('200g grilled chicken breast', '123456789');

      expect(result.status).toBe('food');
      expect(result.tgId).toBe('123456789');
      expect(result.entry).not.toBeNull();
      expect(mockFoodEntriesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid',
          userCaption: '200g grilled chicken breast',
          mealSummary: validFoodParsed.mealSummary,
          caloriesKcal: validFoodParsed.caloriesKcal,
        }),
      );
    });

    it('fires bot callback after saving entry', async () => {
      mockUsersService.findByTgId.mockResolvedValue(mockUser);
      mockOpenAI.generateText.mockResolvedValue({ parsed: validFoodParsed });
      mockFoodEntriesService.create.mockResolvedValue(mockFoodEntry);

      await service.analyze('200g grilled chicken breast', '123456789');

      expect(mockBotCallback.sendAnalysisResult).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'food', tgId: '123456789' }),
      );
    });
  });

  describe('analyze — not food', () => {
    it('returns not_food result without creating an entry', async () => {
      mockUsersService.findByTgId.mockResolvedValue(mockUser);
      mockOpenAI.generateText.mockResolvedValue({ parsed: notFoodParsed });

      const result = await service.analyze('hello world', '123456789');

      expect(result.status).toBe('not_food');
      expect(result.entry).toBeNull();
      expect(mockFoodEntriesService.create).not.toHaveBeenCalled();
    });

    it('fires bot callback even for not_food', async () => {
      mockUsersService.findByTgId.mockResolvedValue(mockUser);
      mockOpenAI.generateText.mockResolvedValue({ parsed: notFoodParsed });

      await service.analyze('hello world', '123456789');

      expect(mockBotCallback.sendAnalysisResult).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'not_food', tgId: '123456789' }),
      );
    });
  });

  describe('analyze — OpenAI errors', () => {
    it('throws InternalServerErrorException when parsed is null', async () => {
      mockUsersService.findByTgId.mockResolvedValue(mockUser);
      mockOpenAI.generateText.mockResolvedValue({ parsed: null });

      await expect(service.analyze('chicken', '123456789')).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockFoodEntriesService.create).not.toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when parsed is not an object', async () => {
      mockUsersService.findByTgId.mockResolvedValue(mockUser);
      mockOpenAI.generateText.mockResolvedValue({ parsed: 'not an object' });

      await expect(service.analyze('chicken', '123456789')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when Zod schema validation fails', async () => {
      mockUsersService.findByTgId.mockResolvedValue(mockUser);
      mockOpenAI.generateText.mockResolvedValue({ parsed: { isFood: 'yes', caloriesKcal: -1 } });

      await expect(service.analyze('chicken', '123456789')).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockFoodEntriesService.create).not.toHaveBeenCalled();
    });
  });

  describe('analyze — user not found', () => {
    it('propagates NotFoundException from UsersService', async () => {
      mockUsersService.findByTgId.mockRejectedValue(new NotFoundException('User not found'));

      await expect(service.analyze('chicken', '999')).rejects.toThrow(NotFoundException);
      expect(mockOpenAI.generateText).not.toHaveBeenCalled();
    });
  });
});