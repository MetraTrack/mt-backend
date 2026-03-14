import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode: number;

  @ApiProperty({ description: 'Request path where the error occurred', example: '/api/resource' })
  path: string;

  @ApiProperty({ description: 'Error message describing what went wrong', example: 'Validation failed' })
  message: string;
}