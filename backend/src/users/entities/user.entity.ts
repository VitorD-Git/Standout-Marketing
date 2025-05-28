import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  WRITER = 'writer',
  APPROVER = 'approver',
}

export enum ApproverRole {
  CEO = 'ceo',
  COO = 'coo',
  CMO = 'cmo',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WRITER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: ApproverRole,
    nullable: true,
  })
  approverRole?: ApproverRole;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ type: 'json', nullable: true })
  notificationPreferences?: {
    receiveInAppNewSubmissions: boolean;
    receiveInAppApprovalDecisions: boolean;
    receiveEmailNotifications: boolean;
    receiveDailyDigest: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 