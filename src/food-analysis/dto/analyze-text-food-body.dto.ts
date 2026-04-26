import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnalyzeTextFoodBodyDto {
  @ApiProperty({
    description: 'Text description of the food or meal to analyze (e.g. "200g grilled chicken breast with rice").',
    example: '200g grilled chicken breast with brown rice and steamed broccoli',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  textDescription: string;
}