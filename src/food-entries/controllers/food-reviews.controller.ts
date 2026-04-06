import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { UserGuard } from '../../users/guards/user.guard';
import { FoodReviewsService } from '../services/food-reviews.service';
import { QueryFoodReviewsDto } from '../dto/query-food-reviews.dto';
import { FoodReviewsPaginatedResponseDto } from '../dto/food-reviews-paginated-response.dto';
import { ErrorResponseDto } from '../../common/error/error-response.dto';
import { FoodReviewType } from '../enums/food-review-type.enum';

@ApiTags('Food Reviews')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard, UserGuard)
@Controller('food-reviews')
export class FoodReviewsController {
  constructor(private readonly foodReviewsService: FoodReviewsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated food reviews',
    description:
      'Returns paginated food reviews with embedded source entries. ' +
      'Filter by userId, review type, and period date range.',
  })
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the requesting user (UserGuard).' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user UUID.' })
  @ApiQuery({ name: 'type', required: false, enum: FoodReviewType, description: 'Filter by review type (DAILY, WEEKLY, MONTHLY).' })
  @ApiQuery({ name: 'dateFrom', required: false, type: Number, description: 'Return reviews whose periodStart is on or after this Unix ms timestamp.' })
  @ApiQuery({ name: 'dateTo', required: false, type: Number, description: 'Return reviews whose periodEnd is on or before this Unix ms timestamp.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1).' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20).' })
  @ApiResponse({ status: 200, description: 'Paginated list of food reviews.', type: FoodReviewsPaginatedResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid query parameters or missing tgId. errorCode: BAD_REQUEST | MISSING_TG_ID', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted. errorCode: USER_NOT_FOUND', type: ErrorResponseDto })
  async findMany(@Query() query: QueryFoodReviewsDto): Promise<FoodReviewsPaginatedResponseDto> {
    return this.foodReviewsService.findMany(query);
  }
}