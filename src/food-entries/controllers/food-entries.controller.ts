import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { UserGuard } from '../../users/guards/user.guard';
import { FoodEntriesService } from '../services/food-entries.service';
import { QueryFoodEntriesDto } from '../dto/query-food-entries.dto';
import { FoodEntryResponseDto } from '../dto/food-entry-response.dto';
import { FoodEntriesPaginatedResponseDto } from '../dto/food-entries-paginated-response.dto';
import { ErrorResponseDto } from '../../common/error/error-response.dto';

@ApiTags('Food Entries')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard, UserGuard)
@Controller('food-entries')
export class FoodEntriesController {
  constructor(private readonly foodEntriesService: FoodEntriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated food entries',
    description: 'Returns paginated food entries. Filter by userId, confirmation status, and date range.',
  })
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the requesting user (UserGuard).' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user UUID.' })
  @ApiQuery({ name: 'confirmedOnly', required: false, type: Boolean, description: 'Return only confirmed entries (eatenAt IS NOT NULL).' })
  @ApiQuery({ name: 'dateFrom', required: false, type: Number, description: 'Filter entries created on or after this Unix ms timestamp.' })
  @ApiQuery({ name: 'dateTo', required: false, type: Number, description: 'Filter entries created on or before this Unix ms timestamp.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1).' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20).' })
  @ApiResponse({ status: 200, description: 'Paginated list of food entries.', type: FoodEntriesPaginatedResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid query parameters or missing tgId.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted (UserGuard).', type: ErrorResponseDto })
  async findMany(@Query() query: QueryFoodEntriesDto): Promise<FoodEntriesPaginatedResponseDto> {
    return this.foodEntriesService.findMany(query);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm a food entry',
    description: 'Sets eatenAt to the current timestamp. The user identified by tgId must be active.',
  })
  @ApiParam({ name: 'id', description: 'Food entry UUID' })
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the requesting user (UserGuard).' })
  @ApiResponse({ status: 200, description: 'Entry confirmed. eatenAt is now set.', type: FoodEntryResponseDto })
  @ApiResponse({ status: 400, description: 'Missing tgId query param.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Food entry or user not found.', type: ErrorResponseDto })
  async confirm(@Param('id') id: string): Promise<FoodEntryResponseDto> {
    const entry = await this.foodEntriesService.confirm(id);
    return FoodEntryResponseDto.from(entry);
  }
}