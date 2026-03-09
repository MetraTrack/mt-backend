import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { AdminGuard } from '../guards/admin.guard';
import { UserGuard } from '../guards/user.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
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
  @ApiResponse({ status: 400, description: 'Validation error or bot registration attempt.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.restoreOrCreateFromTelegram(dto);
    return UserResponseDto.from(user);
  }

  @Get('by-tg-id/:tgId')
  @ApiOperation({ summary: 'Get active user by Telegram ID' })
  @ApiParam({ name: 'tgId', description: 'Telegram user ID', example: '123456789' })
  @ApiResponse({ status: 200, description: 'User found.', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted.', type: ErrorResponseDto })
  async findByTgId(@Param('tgId') tgId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByTgId(tgId);
    return UserResponseDto.from(user);
  }

  @Get(':id/is-admin')
  @ApiOperation({ summary: 'Check whether a user is an admin', description: 'Resolves admin status by comparing the user\'s tgId against TG_ADMIN_IDS.' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Admin status resolved.', type: IsAdminResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted.', type: ErrorResponseDto })
  async isAdmin(@Param('id') id: string): Promise<IsAdminResponseDto> {
    const user = await this.usersService.findById(id);
    return { tgId: user.tgId, isAdmin: this.usersService.isAdmin(user.tgId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get active user by UUID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found.', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted.', type: ErrorResponseDto })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return UserResponseDto.from(user);
  }

  @Patch(':id')
  @UseGuards(UserGuard)
  @ApiOperation({
    summary: 'Update user Telegram fields',
    description: 'Requires tgId query param. The requesting user must be active (UserGuard).',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or missing tgId query param.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted.', type: ErrorResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, dto);
    return UserResponseDto.from(user);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a user',
    description: 'Requires tgId query param of an admin user (AdminGuard). Sets deletedAt; does not remove the record.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Missing tgId query param.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Requester is not an admin.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found or deleted.', type: ErrorResponseDto })
  async delete(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}