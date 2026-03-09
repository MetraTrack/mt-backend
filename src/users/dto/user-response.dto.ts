import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'User UUID', example: 'a3bb189e-8bf9-3888-9912-ace4e6543002' })
  id: string;

  @ApiProperty({ description: 'Telegram user ID', example: '123456789' })
  tgId: string;

  @ApiPropertyOptional({ description: 'Telegram username', example: 'johndoe', nullable: true })
  tgUsername: string | null;

  @ApiProperty({ description: 'Telegram first name', example: 'John' })
  tgFirstName: string;

  @ApiPropertyOptional({ description: 'Telegram last name', example: 'Doe', nullable: true })
  tgLastName: string | null;

  @ApiPropertyOptional({ description: 'Telegram language code', example: 'en', nullable: true })
  tgLanguageCode: string | null;

  @ApiProperty({ description: 'Has Telegram Premium', example: false })
  tgIsPremium: boolean;

  @ApiProperty({ description: 'Whether the account is a Telegram bot', example: false })
  isBot: boolean;

  @ApiProperty({ description: 'Created at (Unix ms)', example: 1741440000000 })
  createdAt: number;

  @ApiProperty({ description: 'Updated at (Unix ms)', example: 1741440000000 })
  updatedAt: number;

  @ApiPropertyOptional({
    description: 'Deleted at (Unix ms). Null means the user is active.',
    example: null,
    nullable: true,
  })
  deletedAt: number | null;

  static from(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.tgId = user.tgId;
    dto.tgUsername = user.tgUsername;
    dto.tgFirstName = user.tgFirstName;
    dto.tgLastName = user.tgLastName;
    dto.tgLanguageCode = user.tgLanguageCode;
    dto.tgIsPremium = user.tgIsPremium;
    dto.isBot = user.isBot;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    dto.deletedAt = user.deletedAt;
    return dto;
  }
}