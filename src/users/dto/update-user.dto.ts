import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Telegram username (without @)', example: 'johndoe', nullable: true })
  @IsOptional()
  @IsString()
  tgUsername?: string | null;

  @ApiPropertyOptional({ description: 'Telegram first name', example: 'John' })
  @IsOptional()
  @IsString()
  tgFirstName?: string;

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
}