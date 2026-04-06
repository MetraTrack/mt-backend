import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { AdminGuard } from '../guards/admin.guard';
import { UserGuard } from '../guards/user.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersPaginatedResponseDto } from '../dto/users-paginated-response.dto';
import { IsAdminResponseDto } from '../dto/is-admin-response.dto';
import { ErrorResponseDto } from '../../common/error/error-response.dto';
import { UsersService } from '../services/users.service';

@ApiTags('Users')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Register or restore a Telegram user',
    description:
      'Idempotent registration endpoint. Creates the user if they do not exist. ' +
      'If the user was previously deleted, restores them and syncs Telegram data. ' +
      'If the user is active, updates their Telegram data. Bots are rejected.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created or restored.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or bot registration attempt. errorCode: BAD_REQUEST', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.restoreOrCreateFromTelegram(dto);
    return UserResponseDto.from(user);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'List all users (admin)',
    description: 'Paginated list of all users. Requires admin tgId via query param. Optionally includes soft-deleted users.',
  })
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the requesting admin (AdminGuard).' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, description: 'Include soft-deleted users (default: false).' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1).' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20).' })
  @ApiResponse({ status: 200, description: 'Paginated list of users.', type: UsersPaginatedResponseDto })
  @ApiResponse({ status: 400, description: 'Missing tgId query param. errorCode: MISSING_TG_ID', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Requester is not an admin. errorCode: ADMIN_REQUIRED', type: ErrorResponseDto })
  async findAll(@Query() query: QueryUsersDto): Promise<UsersPaginatedResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get('tg/:tgId')
  @ApiOperation({
    summary: 'Get active user by Telegram ID',
    description: 'Internal lookup used by the bot to resolve a user from their Telegram ID. ApiKeyGuard only — open to any internal caller.',
  })
  @ApiParam({ name: 'tgId', description: 'Telegram user ID', example: '123456789' })
  @ApiResponse({ status: 200, description: 'User found.', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted. errorCode: USER_NOT_FOUND', type: ErrorResponseDto })
  async findByTgId(@Param('tgId') tgId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByTgId(tgId);
    return UserResponseDto.from(user);
  }

  @Get(':id/is-admin')
  @ApiOperation({
    summary: 'Check whether a user is an admin',
    description: 'Resolves admin status by comparing the user\'s tgId against TG_ADMIN_IDS. ApiKeyGuard only — open to any internal caller.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Admin status resolved.', type: IsAdminResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted. errorCode: USER_NOT_FOUND', type: ErrorResponseDto })
  async isAdmin(@Param('id') id: string): Promise<IsAdminResponseDto> {
    const user = await this.usersService.findById(id);
    return { tgId: user.tgId, isAdmin: this.usersService.isAdmin(user.tgId) };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get active user by UUID',
    description: 'Internal lookup by UUID. ApiKeyGuard only — open to any internal caller.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found.', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted. errorCode: USER_NOT_FOUND', type: ErrorResponseDto })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return UserResponseDto.from(user);
  }

  @Patch(':id')
  @UseGuards(UserGuard)
  @ApiOperation({
    summary: 'Update user Telegram fields',
    description: 'Self-update only. The tgId query param must resolve to the same user as :id.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the requesting user. Must match the target user.' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or missing tgId. errorCode: BAD_REQUEST | MISSING_TG_ID', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Requester is not the target user. errorCode: FORBIDDEN', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted. errorCode: USER_NOT_FOUND', type: ErrorResponseDto })
  async update(
    @Param('id') id: string,
    @Query('tgId') tgId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const requester = await this.usersService.findByTgId(tgId);
    if (requester.id !== id) {
      throw new ForbiddenException({ message: 'You can only update your own account.', errorCode: 'FORBIDDEN' });
    }
    const user = await this.usersService.update(id, dto);
    return UserResponseDto.from(user);
  }

  @Post(':id/restore')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore a soft-deleted user (admin)',
    description: 'Reinstates a deleted user by clearing deletedAt. No-op if the user is already active.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the requesting admin (AdminGuard).' })
  @ApiResponse({ status: 200, description: 'User restored.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Missing tgId query param. errorCode: MISSING_TG_ID', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Requester is not an admin. errorCode: ADMIN_REQUIRED', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found. errorCode: USER_NOT_FOUND', type: ErrorResponseDto })
  async restore(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.restore(id);
    return UserResponseDto.from(user);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a user (admin)',
    description: 'Sets deletedAt to the current timestamp. Does not remove the row. Reversible via POST /users/:id/restore.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiQuery({ name: 'tgId', required: true, description: 'Telegram user ID of the requesting admin (AdminGuard).' })
  @ApiResponse({ status: 204, description: 'User deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Missing tgId query param. errorCode: MISSING_TG_ID', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key. errorCode: INVALID_API_KEY', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Requester is not an admin. errorCode: ADMIN_REQUIRED', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted. errorCode: USER_NOT_FOUND', type: ErrorResponseDto })
  async delete(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}
