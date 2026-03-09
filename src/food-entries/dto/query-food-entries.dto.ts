import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class QueryFoodEntriesDto {
  @ApiProperty({ description: 'Telegram user ID of the requesting user — validated by UserGuard.', example: '123456789' })
  @IsString()
  @IsNotEmpty()
  tgId: string;

  @ApiPropertyOptional({ description: 'Filter by user UUID', example: 'uuid-of-user' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Return only confirmed entries (eatenAt IS NOT NULL)', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  confirmedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter entries created on or after this timestamp (Unix ms)', example: 1741440000000 })
  @IsOptional()
  @Type(() => Number)
  dateFrom?: number;

  @ApiPropertyOptional({ description: 'Filter entries created on or before this timestamp (Unix ms)', example: 1741526400000 })
  @IsOptional()
  @Type(() => Number)
  dateTo?: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}