import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { UserGuard } from '../../users/guards/user.guard';
import { ErrorResponseDto } from '../../common/error/error-response.dto';
import { FoodTextAnalysisService } from '../services/food-text-analysis.service';
import { AnalyzeFoodQueryDto } from '../dto/analyze-food-query.dto';
import { AnalyzeTextFoodBodyDto } from '../dto/analyze-text-food-body.dto';
import { FoodAnalysisResultDto } from '../dto/food-analysis-result.dto';

@ApiTags('Food Analysis')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('food-analysis')
export class FoodTextAnalysisController {
  constructor(private readonly foodTextAnalysisService: FoodTextAnalysisService) {}

  @Post('analyze-text')
  @UseGuards(UserGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze a food text description',
    description:
      'Internal endpoint for the bot backend. Accepts a plain-text food description, runs OpenAI text analysis, saves the result to food-entries if food is detected, and fires a callback to the bot backend. Same pipeline as photo analysis but without image processing.',
  })
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the user who sent the message.' })
  @ApiBody({ type: AnalyzeTextFoodBodyDto })
  @ApiResponse({
    status: 200,
    description:
      'Analysis complete. status="food": entry saved, entry field populated. status="not_food": text does not describe food, entry is null.',
    type: FoodAnalysisResultDto,
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid fields. errorCode: BAD_REQUEST | MISSING_TG_ID', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found. errorCode: USER_NOT_FOUND', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'OpenAI rate limit reached. errorCode: OPENAI_RATE_LIMITED', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'OpenAI error or invalid AI response. errorCode: AI_PARSE_ERROR', type: ErrorResponseDto })
  async analyzeText(
    @Query() query: AnalyzeFoodQueryDto,
    @Body() body: AnalyzeTextFoodBodyDto,
  ): Promise<FoodAnalysisResultDto> {
    return this.foodTextAnalysisService.analyze(body.textDescription, query.tgId);
  }
}