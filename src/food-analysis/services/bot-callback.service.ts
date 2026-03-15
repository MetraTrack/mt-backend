import { Injectable } from '@nestjs/common';
import { HttpService } from '../../common/http/http.service';
import { LoggingService } from '../../common/logging/logging.service';
import { FoodAnalysisResultDto } from '../dto/food-analysis-result.dto';

@Injectable()
export class BotCallbackService {
  constructor(
    private readonly http: HttpService,
    private readonly logger: LoggingService,
  ) {}

  async sendAnalysisResult(result: FoodAnalysisResultDto): Promise<void> {
    const host = process.env.BOT_HOST;
    const path = process.env.BOT_CALLBACK_ANALYSIS_PATH;
    const apiKey = process.env.BOT_API_KEY;

    if (!host || !path || !apiKey) {
      this.logger.error('Bot callback is not configured. Skipping.', null, { host, path });
      return;
    }

    this.logger.info('Sending bot callback', {
      url: `${host}${path}`,
      status: result.status,
      tgId: result.tgId,
      entryId: result.entry?.id ?? null,
    });

    const url = `${host}${path}`;
    try {
      await this.http.post(url, result, { 'X-API-KEY': apiKey });
      this.logger.info('Bot callback delivered', { url, tgId: result.tgId });
    } catch (error) {
      this.logger.error('Bot callback failed', error, { url, status: result.status, tgId: result.tgId });
    }
  }
}