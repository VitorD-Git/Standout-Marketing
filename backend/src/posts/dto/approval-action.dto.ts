import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStatus } from '../entities/approval.entity';

export class ApprovalActionDto {
  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.APPROVED })
  @IsEnum(ApprovalStatus)
  decision: ApprovalStatus;

  @ApiPropertyOptional({ example: 'Content looks good, approved for publication' })
  @IsOptional()
  @IsString()
  comment?: string;
}