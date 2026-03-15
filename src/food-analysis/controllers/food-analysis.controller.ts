import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { UserGuard } from '../../users/guards/user.guard';
import { ErrorResponseDto } from '../../common/error/error-response.dto';
import { FoodAnalysisService } from '../services/food-analysis.service';
import { AnalyzeFoodQueryDto } from '../dto/analyze-food-query.dto';
import { AnalyzeFoodBodyDto } from '../dto/analyze-food-body.dto';
import { FoodAnalysisResultDto } from '../dto/food-analysis-result.dto';

const MAX_PHOTO_SIZE = parseInt(process.env.FOOD_PHOTO_MAX_SIZE_BYTES || '10485760', 10);

@ApiTags('Food Analysis')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard, UserGuard)
@Controller('food-analysis')
export class FoodAnalysisController {
  constructor(private readonly foodAnalysisService: FoodAnalysisService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({
    summary: 'Analyze a food photo',
    description:
      'Internal endpoint for the bot backend. Accepts a food photo via multipart/form-data, runs OpenAI vision analysis, saves the result to food-entries if food is detected, and fires a callback to the bot backend.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the user who sent the photo.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo', 'telegramFileId'],
      properties: {
        photo: { type: 'string', format: 'binary', description: 'Food photo. Supported: JPEG, PNG, WebP. Max 10 MB.' },
        telegramFileId: { type: 'string', description: "Telegram file_id for the photo (used for traceability)." },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Analysis complete. status="food": entry saved, entry field populated. status="not_food": image is not food, entry is null.',
    type: FoodAnalysisResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file, unsupported format, file too large, or missing fields.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found (UserGuard).', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'OpenAI rate limit reached.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'OpenAI error, invalid AI response, or S3 upload failure.', type: ErrorResponseDto })
  async analyze(
    @Query() query: AnalyzeFoodQueryDto,
    @Body() body: AnalyzeFoodBodyDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PHOTO_SIZE }),
          new FileTypeValidator({ fileType: /(image\/jpeg|image\/png|image\/webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<FoodAnalysisResultDto> {
    return this.foodAnalysisService.analyze(file, body.telegramFileId, query.tgId);
  }
}