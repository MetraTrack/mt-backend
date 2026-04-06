import { Injectable, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from 'openai';
import { LoggingService } from '../logging/logging.service';
import {
  OpenAIAnalyzeImageInput,
  OpenAIGenerateTextInput,
  OpenAIResult,
} from './types/openai.types';

@Injectable()
export class OpenAIService {
  private client: OpenAI | null = null;
  // Timestamps of recent calls for sliding-window rate limiting
  private callTimestamps: number[] = [];

  constructor(private readonly logger: LoggingService) {}

  private getClient(): OpenAI {
    if (this.client) return this.client;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({
      apiKey,
      // SDK handles retries for network errors, 408, 409, 429, 5xx with exponential backoff
      maxRetries: parseInt(process.env.OPENAI_RETRIES || '2', 10),
      timeout: parseInt(process.env.OPENAI_TIMEOUT_MS || '60000', 10),
    });

    return this.client;
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const rpm = parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '60', 10);
    const windowMs = 60 * 1000;

    this.callTimestamps = this.callTimestamps.filter((t) => now - t < windowMs);

    if (this.callTimestamps.length >= rpm) {
      this.logger.error('OpenAI rate limit reached', null, { rpm, window: '60s' });
      throw new HttpException({ message: 'OpenAI rate limit reached. Try again later.', errorCode: 'OPENAI_RATE_LIMITED' }, HttpStatus.TOO_MANY_REQUESTS);
    }

    this.callTimestamps.push(now);
  }

  async analyzeImage(input: OpenAIAnalyzeImageInput): Promise<OpenAIResult> {
    this.checkRateLimit();

    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const maxOutputTokens = parseInt(process.env.OPENAI_MAX_OUTPUT_TOKENS || '2048', 10);

    this.logger.info('Calling OpenAI image analysis', { model, maxOutputTokens });

    try {
      const userContent: OpenAI.Responses.ResponseInputContent[] = [
        {
          type: 'input_image',
          image_url: `data:${input.mimeType};base64,${input.imageBase64}`,
          detail: 'auto',
        },
      ];

      if (input.userCaption) {
        userContent.push({ type: 'input_text', text: `User note: ${input.userCaption}` });
      }

      const response = await this.getClient().responses.create({
        model,
        instructions: input.instructions,
        input: [
          {
            role: 'user',
            content: userContent,
          },
        ],
        max_output_tokens: maxOutputTokens,
      });

      return this.parseResponse(response);
    } catch (error) {
      this.handleError(error, 'Image analysis failed');
    }
  }

  async generateText(input: OpenAIGenerateTextInput): Promise<OpenAIResult> {
    this.checkRateLimit();

    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const maxOutputTokens = parseInt(process.env.OPENAI_MAX_OUTPUT_TOKENS || '2048', 10);

    this.logger.info('Calling OpenAI text generation', { model, maxOutputTokens });

    try {
      const response = await this.getClient().responses.create({
        model,
        instructions: input.instructions,
        input: JSON.stringify(input.payload),
        max_output_tokens: maxOutputTokens,
      });

      return this.parseResponse(response);
    } catch (error) {
      this.handleError(error, 'Text generation failed');
    }
  }

  private parseResponse(response: OpenAI.Responses.Response): OpenAIResult {
    if (response.status && response.status !== 'completed') {
      this.logger.error('OpenAI response not completed', null, { status: response.status, error: response.error });
      throw new InternalServerErrorException({ message: 'OpenAI request did not complete', errorCode: 'AI_PARSE_ERROR' });
    }

    const rawText = response.output_text;
    if (!rawText) {
      throw new InternalServerErrorException({ message: 'No output from OpenAI', errorCode: 'AI_PARSE_ERROR' });
    }

    // Strip markdown code fences if present (defensive)
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*\n?/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*\n?/, '');
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.replace(/\n?```\s*$/, '');
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(cleanText);
      this.logger.info('OpenAI response parsed', { rawLength: rawText.length });
    } catch {
      this.logger.error('Failed to parse OpenAI JSON response', null, { rawText: rawText.slice(0, 200) });
    }

    return { raw: rawText, parsed };
  }

  private handleError(error: unknown, fallbackMessage: string): never {
    if (error instanceof HttpException) throw error;

    this.logger.error('OpenAI API error', error);

    const status = (error as any)?.status;
    if (status === 401) throw new InternalServerErrorException({ message: 'OpenAI authentication failed', errorCode: 'AI_PARSE_ERROR' });
    if (status === 429) throw new HttpException({ message: 'OpenAI rate limit exceeded', errorCode: 'OPENAI_RATE_LIMITED' }, HttpStatus.TOO_MANY_REQUESTS);
    if (status >= 500) throw new InternalServerErrorException({ message: 'OpenAI service unavailable', errorCode: 'AI_PARSE_ERROR' });

    throw new InternalServerErrorException({ message: fallbackMessage, errorCode: 'AI_PARSE_ERROR' });
  }
}