import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, ApproverRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.WRITER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: ApproverRole })
  @IsOptional()
  @IsEnum(ApproverRole)
  approverRole?: ApproverRole;

  @ApiPropertyOptional({ example: 'google-user-id' })
  @IsOptional()
  googleId?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  notificationPreferences?: {
    receiveInAppNewSubmissions: boolean;
    receiveInAppApprovalDecisions: boolean;
    receiveEmailNotifications: boolean;
    receiveDailyDigest: boolean;
  };
}