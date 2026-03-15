import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { S3Module } from './common/s3/s3.module';
import { ErrorModule } from './common/error/error.module';
import { OpenAIModule } from './common/openai/openai.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { FoodEntriesModule } from './food-entries/food-entries.module';
import { FoodAnalysisModule } from './food-analysis/food-analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule,
    RedisModule,
    S3Module,
    ErrorModule,
    OpenAIModule,
    HealthModule,
    UsersModule,
    FoodEntriesModule,
    FoodAnalysisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}