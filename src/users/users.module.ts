import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { UserGuard } from './guards/user.guard';
import { AdminGuard } from './guards/admin.guard';
import { LoggingService } from '../common/logging/logging.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserGuard,
    AdminGuard,
    {
      provide: LoggingService,
      useFactory: () => new LoggingService('UsersService'),
    },
  ],
  exports: [UsersService, UserGuard, AdminGuard],
})
export class UsersModule {}