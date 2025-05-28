import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    
    private usersService: UsersService,
  ) {}

  async create(
    type: NotificationType,
    title: string,
    message: string,
    user: User,
    post?: Post
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      type,
      title,
      message,
      user,
      post,
      isRead: false,
    });

    return this.notificationsRepository.save(notification);
  }

  async findUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['post'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationsRepository.count({
      where: { user: { id: userId }, isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true }
    );
  }

  // Event Listeners

  @OnEvent('post.submitted')
  async handlePostSubmitted(payload: { post: Post; user: User }) {
    const { post, user } = payload;
    
    // Notify all approvers
    const approvers = await this.usersService.findApprovers();
    
    for (const approver of approvers) {
      if (approver.notificationPreferences?.receiveInAppNewSubmissions) {
        await this.create(
          NotificationType.POST_SUBMITTED,
          'New Post Submitted for Approval',
          `${user.name} submitted "${post.title}" for approval`,
          approver,
          post
        );
      }
    }
  }

  @OnEvent('post.approved')
  async handlePostApproved(payload: { post: Post; approver: User }) {
    const { post, approver } = payload;
    
    const author = post.createdBy;
    if (author.notificationPreferences?.receiveInAppApprovalDecisions) {
      await this.create(
        NotificationType.POST_APPROVED,
        'Post Approved',
        `Your post "${post.title}" has been fully approved and is ready for publishing`,
        author,
        post
      );
    }
  }

  @OnEvent('post.partial_approval')
  async handlePostPartialApproval(payload: { post: Post; approver: User }) {
    const { post, approver } = payload;
    
    const author = post.createdBy;
    if (author.notificationPreferences?.receiveInAppApprovalDecisions) {
      await this.create(
        NotificationType.POST_APPROVED,
        'Partial Approval Received',
        `${approver.name} (${approver.approverRole}) approved your post "${post.title}"`,
        author,
        post
      );
    }
  }

  @OnEvent('post.rejected')
  async handlePostRejected(payload: { post: Post; approver: User; comment?: string }) {
    const { post, approver, comment } = payload;
    
    const author = post.createdBy;
    if (author.notificationPreferences?.receiveInAppApprovalDecisions) {
      const message = comment 
        ? `${approver.name} (${approver.approverRole}) rejected your post "${post.title}": ${comment}`
        : `${approver.name} (${approver.approverRole}) rejected your post "${post.title}"`;
      
      await this.create(
        NotificationType.POST_REJECTED,
        'Post Rejected',
        message,
        author,
        post
      );
    }
  }

  @OnEvent('card.content_changed')
  async handleCardContentChanged(payload: { post: Post; user: User; cardId: string }) {
    const { post, user } = payload;
    
    // Notify approvers about approval reset
    const approvers = await this.usersService.findApprovers();
    
    for (const approver of approvers) {
      if (approver.notificationPreferences?.receiveInAppNewSubmissions) {
        await this.create(
          NotificationType.POST_SUBMITTED,
          'Post Content Changed - Approvals Reset',
          `Content in "${post.title}" was modified by ${user.name}. All approvals have been reset.`,
          approver,
          post
        );
      }
    }
  }

  @OnEvent('post.published')
  async handlePostPublished(payload: { post: Post; user: User }) {
    const { post, user } = payload;
    
    // Notify relevant stakeholders about publication
    const approvers = await this.usersService.findApprovers();
    
    for (const approver of approvers) {
      if (approver.notificationPreferences?.receiveInAppApprovalDecisions) {
        await this.create(
          NotificationType.POST_APPROVED,
          'Post Published',
          `"${post.title}" has been published by ${user.name}`,
          approver,
          post
        );
      }
    }
  }

  // Scheduled Tasks

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendApprovalReminders() {
    // Find posts approaching deadline (24 hours before)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const postsNearDeadline = await this.notificationsRepository.manager
      .getRepository(Post)
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.approvals', 'approvals')
      .leftJoinAndSelect('approvals.user', 'approver')
      .where('post.status = :status', { status: 'IN_APPROVAL' })
      .andWhere('post.approvalDeadline >= :tomorrow', { tomorrow })
      .andWhere('post.approvalDeadline < :dayAfter', { dayAfter: dayAfterTomorrow })
      .getMany();

    for (const post of postsNearDeadline) {
      const pendingApprovals = post.approvals?.filter(a => a.status === 'PENDING') || [];
      
      for (const approval of pendingApprovals) {
        if (approval.user?.notificationPreferences?.receiveInAppNewSubmissions) {
          await this.create(
            NotificationType.APPROVAL_REMINDER,
            'Approval Deadline Approaching',
            `The post "${post.title}" requires your approval by tomorrow`,
            approval.user,
            post
          );
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async sendDailyDigest() {
    // Send daily digest to users who have enabled it
    const users = await this.usersService.findAll();
    
    for (const user of users) {
      if (user.notificationPreferences?.receiveDailyDigest) {
        await this.createDailyDigest(user);
      }
    }
  }

  private async createDailyDigest(user: User): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's notifications
    const todaysNotifications = await this.notificationsRepository.find({
      where: {
        user: { id: user.id },
        createdAt: MoreThan(today),
      },
      relations: ['post'],
      order: { createdAt: 'DESC' },
    });

    if (todaysNotifications.length === 0) {
      return; // No notifications today
    }

    // Group notifications by type
    const groupedNotifications = todaysNotifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = [];
      }
      acc[notification.type].push(notification);
      return acc;
    }, {} as Record<NotificationType, Notification[]>);

    // Create digest message
    const digestLines = [];
    digestLines.push(`Daily Activity Summary for ${today.toDateString()}:`);
    digestLines.push('');

    Object.entries(groupedNotifications).forEach(([type, notifications]) => {
      digestLines.push(`${type.replace('_', ' ').toUpperCase()}: ${notifications.length}`);
      notifications.slice(0, 3).forEach(n => {
        digestLines.push(`  • ${n.title}`);
      });
      if (notifications.length > 3) {
        digestLines.push(`  • ... and ${notifications.length - 3} more`);
      }
      digestLines.push('');
    });

    await this.create(
      NotificationType.POST_APPROVED, // Using as generic type for digest
      'Daily Activity Digest',
      digestLines.join('\n'),
      user
    );
  }
}