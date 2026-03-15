import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AnalyzeFoodQueryDto {
  @ApiProperty({ description: 'Telegram user ID of the user who sent the photo (required by UserGuard).' })
  @IsString()
  @IsNotEmpty()
  tgId: string;
}