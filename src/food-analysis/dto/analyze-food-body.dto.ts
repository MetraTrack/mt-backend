import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AnalyzeFoodBodyDto {
  @ApiProperty({
    description: "Telegram's file_id for this photo. Used for traceability and deduplication.",
    example: 'AgACAgIAAxkBAAIBz...',
  })
  @IsString()
  @IsNotEmpty()
  telegramFileId: string;
}