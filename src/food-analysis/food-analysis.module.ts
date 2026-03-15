import { Module } from '@nestjs/common';
import { HttpModule } from '../common/http/http.module';
import { UsersModule } from '../users/users.module';
import { FoodEntriesModule } from '../food-entries/food-entries.module';
import { LoggingService } from '../common/logging/logging.service';
import { FoodAnalysisController } from './controllers/food-analysis.controller';
import { FoodAnalysisService } from './services/food-analysis.service';
import { FoodImageService } from './services/food-image.service';
import { BotCallbackService } from './services/bot-callback.service';

@Module({
  imports: [
    HttpModule,
    UsersModule,
    FoodEntriesModule,
  ],
  controllers: [FoodAnalysisController],
  providers: [
    FoodAnalysisService,
    FoodImageService,
    BotCallbackService,
    {
      provide: LoggingService,
      useFactory: () => new LoggingService('FoodAnalysisModule'),
    },
  ],
})
export class FoodAnalysisModule {}