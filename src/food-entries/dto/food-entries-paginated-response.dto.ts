import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { FoodEntryResponseDto } from './food-entry-response.dto';

export class FoodEntriesPaginatedResponseDto {
  @ApiProperty({ type: [FoodEntryResponseDto] })
  data: FoodEntryResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}