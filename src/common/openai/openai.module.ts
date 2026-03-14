import { Global, Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { LoggingService } from '../logging/logging.service';

@Global()
@Module({
  providers: [
    OpenAIService,
    {
      provide: LoggingService,
      useFactory: () => new LoggingService('OpenAIService'),
    },
  ],
  exports: [OpenAIService],
})
export class OpenAIModule {}