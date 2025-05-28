import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCardDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number = 1;

  @ApiPropertyOptional({ example: 'Main post content goes here...' })
  @IsOptional()
  @IsString()
  textMain?: string = '';

  @ApiPropertyOptional({ example: 'Text to appear on the image' })
  @IsOptional()
  @IsString()
  textArt?: string = '';

  @ApiPropertyOptional({ example: 'Instructions for the designer about the visual concept' })
  @IsOptional()
  @IsString()
  explanationForDesigner?: string = '';
}