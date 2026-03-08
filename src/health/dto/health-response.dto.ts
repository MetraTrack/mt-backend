import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'MetraTrack-Backend' })
  appName: string;

  @ApiProperty({ example: 'production' })
  environment: string;

  @ApiProperty({ example: 123.456 })
  uptime: number;
}