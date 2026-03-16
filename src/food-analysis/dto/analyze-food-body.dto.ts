import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AnalyzeFoodBodyDto {
  @ApiProperty({
    description: "Telegram's file_id for this photo. Used for traceability and deduplication.",
    example: 'AgACAgIAAxkBAAIBz...',
  })
  @IsString()
  @IsNotEmpty()
  telegramFileId: string;

  @ApiPropertyOptional({
    description: 'Optional caption from the user to clarify the meal (e.g. portion sizes, ingredients). Forwarded to the AI model to improve accuracy.',
    example: '200g chicken breast, no sauce',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userCaption?: string | null;
}