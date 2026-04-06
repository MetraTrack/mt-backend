import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { LoggingService } from '../../common/logging/logging.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly logger: LoggingService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    if (dto.isBot) {
      throw new BadRequestException('Bots are not allowed to register.');
    }

    const existing = await this.repo.findOne({ where: { tgId: dto.tgId } });
    if (existing) {
      throw new ConflictException(`User with tgId ${dto.tgId} already exists.`);
    }

    const now = Date.now();
    const user = this.repo.create({
      id: uuidv4(),
      tgId: dto.tgId,
      tgUsername: dto.tgUsername ?? null,
      tgFirstName: dto.tgFirstName,
      tgLastName: dto.tgLastName ?? null,
      tgLanguageCode: dto.tgLanguageCode ?? null,
      tgIsPremium: dto.tgIsPremium ?? false,
      isBot: dto.isBot ?? false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    const saved = await this.repo.save(user);
    this.logger.info('User created', { id: saved.id, tgId: saved.tgId });
    return saved;
  }

  // Idempotent registration: restores deleted user or updates existing, creates if new.
  async restoreOrCreateFromTelegram(dto: CreateUserDto): Promise<User> {
    if (dto.isBot) {
      throw new BadRequestException('Bots are not allowed to register.');
    }

    const existing = await this.repo.findOne({ where: { tgId: dto.tgId } });

    if (!existing) {
      return this.create(dto);
    }

    const wasDeleted = existing.deletedAt !== null;
    existing.tgUsername = dto.tgUsername ?? null;
    existing.tgFirstName = dto.tgFirstName;
    existing.tgLastName = dto.tgLastName ?? null;
    existing.tgLanguageCode = dto.tgLanguageCode ?? null;
    existing.tgIsPremium = dto.tgIsPremium ?? false;
    existing.updatedAt = Date.now();
    existing.deletedAt = null;

    const saved = await this.repo.save(existing);
    this.logger.info(wasDeleted ? 'User restored' : 'User synced from Telegram', {
      id: saved.id,
      tgId: saved.tgId,
    });
    return saved;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.tgUsername !== undefined) user.tgUsername = dto.tgUsername ?? null;
    if (dto.tgFirstName !== undefined) user.tgFirstName = dto.tgFirstName;
    if (dto.tgLastName !== undefined) user.tgLastName = dto.tgLastName ?? null;
    if (dto.tgLanguageCode !== undefined) user.tgLanguageCode = dto.tgLanguageCode ?? null;
    if (dto.tgIsPremium !== undefined) user.tgIsPremium = dto.tgIsPremium;
    user.updatedAt = Date.now();

    const saved = await this.repo.save(user);
    this.logger.info('User updated', { id: saved.id });
    return saved;
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    user.deletedAt = Date.now();
    user.updatedAt = Date.now();
    await this.repo.save(user);
    this.logger.info('User soft-deleted', { id });
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!user) {
      throw new NotFoundException({ message: `User ${id} not found.`, errorCode: 'USER_NOT_FOUND' });
    }
    return user;
  }

  async findByTgId(tgId: string): Promise<User> {
    const user = await this.repo.findOne({ where: { tgId, deletedAt: IsNull() } });
    if (!user) {
      throw new NotFoundException({ message: `User with tgId ${tgId} not found.`, errorCode: 'USER_NOT_FOUND' });
    }
    return user;
  }

  isAdmin(tgId: string): boolean {
    const raw = process.env.TG_ADMIN_IDS ?? '';
    return raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .includes(tgId);
  }
}