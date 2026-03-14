import { ApiProperty } from '@nestjs/swagger';

export class IsAdminResponseDto {
  @ApiProperty({ description: 'Telegram user ID of the queried user', example: '123456789' })
  tgId: string;

  @ApiProperty({ description: 'Whether the user is listed as an admin in TG_ADMIN_IDS', example: false })
  isAdmin: boolean;
}