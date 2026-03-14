import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodEntry } from './entities/food-entry.entity';
import { FoodReview } from './entities/food-review.entity';
import { FoodEntriesService } from './services/food-entries.service';
import { FoodReviewsService } from './services/food-reviews.service';
import { FoodEntriesController } from './controllers/food-entries.controller';
import { FoodReviewsController } from './controllers/food-reviews.controller';
import { LoggingService } from '../common/logging/logging.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoodEntry, FoodReview]),
    UsersModule, // provides UserGuard
  ],
  controllers: [FoodEntriesController, FoodReviewsController],
  providers: [
    FoodEntriesService,
    FoodReviewsService,
    {
      provide: LoggingService,
      useFactory: () => new LoggingService('FoodEntriesModule'),
    },
  ],
  exports: [FoodEntriesService, FoodReviewsService],
})
export class FoodEntriesModule {}