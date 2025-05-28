import { IsString, IsOptional, IsDateString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({ example: 'Summer Campaign 2024' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Main campaign for summer season targeting millennials' })
  @IsString()
  briefing: string;

  @ApiPropertyOptional({ example: '2024-07-15' })
  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @ApiPropertyOptional({ example: '2024-07-10' })
  @IsOptional()
  @IsDateString()
  approvalDeadline?: string;

  @ApiPropertyOptional({ example: ['tag-id-1', 'tag-id-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ example: 'release-id' })
  @IsOptional()
  @IsUUID()
  releaseId?: string;
}