import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FoodEntryResponseDto } from '../../food-entries/dto/food-entry-response.dto';

export class FoodAnalysisResultDto {
  @ApiProperty({
    enum: ['food', 'not_food'],
    description: '"food" — image is food, entry saved. "not_food" — image is not food, no entry created.',
  })
  status: 'food' | 'not_food';

  @ApiProperty({ description: 'Telegram user ID from the original request.', example: '123456789' })
  tgId: string;

  @ApiPropertyOptional({
    type: FoodEntryResponseDto,
    nullable: true,
    description: 'The saved food entry. Populated only when status is "food".',
  })
  entry: FoodEntryResponseDto | null;
}