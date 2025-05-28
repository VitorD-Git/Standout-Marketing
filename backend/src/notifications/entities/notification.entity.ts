import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

export enum NotificationType {
  POST_SUBMITTED = 'post_submitted',
  POST_APPROVED = 'post_approved',
  POST_REJECTED = 'post_rejected',
  APPROVAL_REMINDER = 'approval_reminder',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => Post, { nullable: true })
  post?: Post;

  @CreateDateColumn()
  createdAt: Date;
} 