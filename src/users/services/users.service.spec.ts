import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { LoggingService } from '../../common/logging/logging.service';

const mockUser: Partial<User> = {
  id: 'user-uuid',
  tgId: '123456',
  tgFirstName: 'John',
  tgIsPremium: false,
  isBot: false,
  deletedAt: null,
  createdAt: 1000,
  updatedAt: 1000,
};

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockLogger = { info: jest.fn(), error: jest.fn() };

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: LoggingService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('create', () => {
    it('throws BadRequestException for bots', async () => {
      await expect(
        service.create({ ...mockUser, isBot: true } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if tgId already exists', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockUser);
      await expect(
        service.create({ tgId: '123456', tgFirstName: 'John', isBot: false } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('restoreOrCreateFromTelegram', () => {
    it('throws BadRequestException for bots', async () => {
      await expect(
        service.restoreOrCreateFromTelegram({ ...mockUser, isBot: true } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('restores deleted user and clears deletedAt', async () => {
      const deleted = { ...mockUser, deletedAt: 999 };
      mockRepo.findOne.mockResolvedValueOnce(deleted);
      mockRepo.save.mockImplementation(async (u) => u);

      const result = await service.restoreOrCreateFromTelegram({
        tgId: '123456', tgFirstName: 'John', isBot: false,
      } as any);

      expect(result.deletedAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns user when found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockUser);
      const result = await service.findById('user-uuid');
      expect(result).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('sets deletedAt and saves', async () => {
      const user = { ...mockUser, deletedAt: null };
      mockRepo.findOne.mockResolvedValueOnce(user);
      mockRepo.save.mockImplementation(async (u) => u);

      await service.delete('user-uuid');

      expect(user.deletedAt).toBeGreaterThan(0);
    });
  });

  describe('isAdmin', () => {
    it('returns true when tgId is in TG_ADMIN_IDS', () => {
      process.env.TG_ADMIN_IDS = '123456,789';
      expect(service.isAdmin('123456')).toBe(true);
    });

    it('returns false when tgId is not in TG_ADMIN_IDS', () => {
      process.env.TG_ADMIN_IDS = '789';
      expect(service.isAdmin('123456')).toBe(false);
    });
  });
});