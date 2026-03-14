import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Telegram user ID', example: '123456789' })
  @IsString()
  @IsNotEmpty()
  tgId: string;

  @ApiPropertyOptional({ description: 'Telegram username (without @)', example: 'johndoe', nullable: true })
  @IsOptional()
  @IsString()
  tgUsername?: string | null;

  @ApiProperty({ description: 'Telegram first name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  tgFirstName: string;

  @ApiPropertyOptional({ description: 'Telegram last name', example: 'Doe', nullable: true })
  @IsOptional()
  @IsString()
  tgLastName?: string | null;

  @ApiPropertyOptional({ description: 'Telegram language code (IETF)', example: 'en', nullable: true })
  @IsOptional()
  @IsString()
  tgLanguageCode?: string | null;

  @ApiPropertyOptional({ description: 'Whether the user has Telegram Premium', example: false })
  @IsOptional()
  @IsBoolean()
  tgIsPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this account is a Telegram bot. Bots are rejected with 400.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isBot?: boolean;
}