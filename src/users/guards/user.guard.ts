import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../services/users.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const tgId = request.query['tgId'] as string | undefined;

    if (!tgId) {
      throw new BadRequestException('tgId query parameter is required.');
    }

    await this.usersService.findByTgId(tgId);
    return true;
  }
}