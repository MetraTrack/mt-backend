import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { FoodReviewResponseDto } from './food-review-response.dto';

export class FoodReviewsPaginatedResponseDto {
  @ApiProperty({ type: [FoodReviewResponseDto] })
  data: FoodReviewResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}