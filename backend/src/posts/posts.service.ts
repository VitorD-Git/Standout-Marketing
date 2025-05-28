import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Post, PostStatus } from './entities/post.entity';
import { Card } from './entities/card.entity';
import { CardVersion } from './entities/card-version.entity';
import { Approval, ApprovalStatus } from './entities/approval.entity';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { Tag } from './entities/tag.entity';
import { Release } from './entities/release.entity';
import { User, ApproverRole } from '../users/entities/user.entity';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostFiltersDto } from './dto/post-filters.dto';
import { ApprovalActionDto } from './dto/approval-action.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
    
    @InjectRepository(CardVersion)
    private cardVersionsRepository: Repository<CardVersion>,
    
    @InjectRepository(Approval)
    private approvalsRepository: Repository<Approval>,
    
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
    
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    
    @InjectRepository(Release)
    private releasesRepository: Repository<Release>,
    
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    // Validate tags exist
    let tags = [];
    if (createPostDto.tagIds?.length) {
      tags = await this.tagsRepository.findByIds(createPostDto.tagIds);
      if (tags.length !== createPostDto.tagIds.length) {
        throw new BadRequestException('One or more tags not found');
      }
    }

    // Validate release exists
    let release = null;
    if (createPostDto.releaseId) {
      release = await this.releasesRepository.findOne({ where: { id: createPostDto.releaseId } });
      if (!release) {
        throw new BadRequestException('Release not found');
      }
    }

    // Create post
    const post = this.postsRepository.create({
      title: createPostDto.title,
      briefing: createPostDto.briefing,
      publishDate: createPostDto.publishDate ? new Date(createPostDto.publishDate) : null,
      approvalDeadline: createPostDto.approvalDeadline ? new Date(createPostDto.approvalDeadline) : null,
      createdBy: author,
      tags,
      release,
      status: PostStatus.DRAFT,
    });

    const savedPost = await this.postsRepository.save(post);

    // Create initial card
    await this.createInitialCard(savedPost, author);

    // Create audit log
    await this.createAuditLog(savedPost, author, AuditAction.CREATE, 'Post created');

    // Emit event
    this.eventEmitter.emit('post.created', { post: savedPost, author });

    return this.findById(savedPost.id);
  }

  async findAll(filters: PostFiltersDto): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.createPostQueryBuilder();
    
    this.applyFilters(queryBuilder, filters);
    
    const total = await queryBuilder.getCount();
    
    queryBuilder
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .orderBy('post.updatedAt', 'DESC');

    const posts = await queryBuilder.getMany();

    return {
      posts,
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string): Promise<Post> {
    const post = await this.createPostQueryBuilder()
      .where('post.id = :id', { id })
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, user: User): Promise<Post> {
    const post = await this.findById(id);
    
    // Check permissions
    if (post.createdBy.id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only edit your own posts');
    }

    // Validate tags and release if provided
    if (updatePostDto.tagIds) {
      const tags = await this.tagsRepository.findByIds(updatePostDto.tagIds);
      if (tags.length !== updatePostDto.tagIds.length) {
        throw new BadRequestException('One or more tags not found');
      }
      post.tags = tags;
    }

    if (updatePostDto.releaseId) {
      const release = await this.releasesRepository.findOne({ where: { id: updatePostDto.releaseId } });
      if (!release) {
        throw new BadRequestException('Release not found');
      }
      post.release = release;
    }

    // Update fields
    Object.assign(post, {
      ...updatePostDto,
      publishDate: updatePostDto.publishDate ? new Date(updatePostDto.publishDate) : post.publishDate,
      approvalDeadline: updatePostDto.approvalDeadline ? new Date(updatePostDto.approvalDeadline) : post.approvalDeadline,
    });

    await this.postsRepository.save(post);

    // Create audit log
    await this.createAuditLog(post, user, AuditAction.UPDATE, 'Post updated');

    // Emit event
    this.eventEmitter.emit('post.updated', { post, user });

    return this.findById(id);
  }

  async submitForApproval(id: string, user: User): Promise<Post> {
    const post = await this.findById(id);
    
    // Validate permissions and status
    if (post.createdBy.id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only submit your own posts');
    }

    if (post.status !== PostStatus.DRAFT && post.status !== PostStatus.NEEDS_ADJUSTMENT) {
      throw new BadRequestException('Post can only be submitted from Draft or Needs Adjustment status');
    }

    // Validate post has cards with content
    if (!post.cards?.length) {
      throw new BadRequestException('Post must have at least one card to submit for approval');
    }

    // Update status
    post.status = PostStatus.IN_APPROVAL;
    await this.postsRepository.save(post);

    // Create/reset approvals for all approver roles
    await this.resetApprovals(post);

    // Create audit log
    await this.createAuditLog(post, user, AuditAction.SUBMIT, 'Post submitted for approval');

    // Emit event for notifications
    this.eventEmitter.emit('post.submitted', { post, user });

    return this.findById(id);
  }

  async approvePost(id: string, approvalDto: ApprovalActionDto, approver: User): Promise<Post> {
    const post = await this.findById(id);
    
    // Validate approver permissions
    if (approver.role !== 'APPROVER') {
      throw new ForbiddenException('Only approvers can approve posts');
    }

    if (post.status !== PostStatus.IN_APPROVAL) {
      throw new BadRequestException('Post must be in approval status');
    }

    // Find or create approval
    let approval = await this.approvalsRepository.findOne({
      where: { post: { id }, user: { id: approver.id } }
    });

    if (!approval) {
      approval = this.approvalsRepository.create({
        post,
        user: approver,
        role: approver.approverRole,
        status: approvalDto.decision,
        comment: approvalDto.comment,
      });
    } else {
      approval.status = approvalDto.decision;
      approval.comment = approvalDto.comment;
    }

    await this.approvalsRepository.save(approval);

    // Handle rejection
    if (approvalDto.decision === ApprovalStatus.REJECTED) {
      post.status = PostStatus.NEEDS_ADJUSTMENT;
      await this.postsRepository.save(post);
      
      await this.createAuditLog(post, approver, AuditAction.REJECT, 
        `Post rejected by ${approver.approverRole}: ${approvalDto.comment || 'No comment'}`);
      
      this.eventEmitter.emit('post.rejected', { post, approver, comment: approvalDto.comment });
      
      return this.findById(id);
    }

    // Check if all approvals are complete
    const allApprovals = await this.approvalsRepository.find({
      where: { post: { id } },
      relations: ['user']
    });

    const approvedCount = allApprovals.filter(a => a.status === ApprovalStatus.APPROVED).length;
    const totalApprovers = Object.values(ApproverRole).length;

    // Handle approval completion
    if (approvedCount === totalApprovers) {
      post.status = PostStatus.APPROVED;
      await this.postsRepository.save(post);
      
      await this.createAuditLog(post, approver, AuditAction.APPROVE, 'Post fully approved');
      
      this.eventEmitter.emit('post.approved', { post, approver });
    } else {
      await this.createAuditLog(post, approver, AuditAction.APPROVE, 
        `Post approved by ${approver.approverRole}`);
      
      this.eventEmitter.emit('post.partial_approval', { post, approver });
    }

    return this.findById(id);
  }

  async getApprovalTasks(approver: User, filters: PostFiltersDto): Promise<{ posts: Post[]; total: number }> {
    if (approver.role !== 'APPROVER') {
      throw new ForbiddenException('Only approvers can view approval tasks');
    }

    const queryBuilder = this.createPostQueryBuilder()
      .where('post.status = :status', { status: PostStatus.IN_APPROVAL })
      .leftJoin('post.approvals', 'approval', 'approval.userId = :userId', { userId: approver.id })
      .andWhere('(approval.status IS NULL OR approval.status = :pending)', { pending: ApprovalStatus.PENDING });

    this.applyFilters(queryBuilder, filters);

    const total = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .orderBy('post.approvalDeadline', 'ASC')
      .getMany();

    return { posts, total };
  }

  async publishPost(id: string, user: User): Promise<Post> {
    const post = await this.findById(id);
    
    if (post.status !== PostStatus.APPROVED) {
      throw new BadRequestException('Post must be approved before publishing');
    }

    if (post.createdBy.id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only publish your own posts');
    }

    post.status = PostStatus.PUBLISHED;
    await this.postsRepository.save(post);

    await this.createAuditLog(post, user, AuditAction.PUBLISH, 'Post published');
    
    this.eventEmitter.emit('post.published', { post, user });

    return this.findById(id);
  }

  private async createInitialCard(post: Post, author: User): Promise<Card> {
    const card = this.cardsRepository.create({
      post,
      order: 1,
    });

    const savedCard = await this.cardsRepository.save(card);

    // Create initial version
    const version = this.cardVersionsRepository.create({
      card: savedCard,
      versionNumber: 1,
      textMain: '',
      textArt: '',
      explanationForDesigner: '',
      createdBy: author,
      isActive: true,
    });

    await this.cardVersionsRepository.save(version);

    return savedCard;
  }

  private async resetApprovals(post: Post): Promise<void> {
    // Remove existing approvals
    await this.approvalsRepository.delete({ post: { id: post.id } });

    // Create new pending approvals for all approver roles
    const approverRoles = Object.values(ApproverRole);
    const approvals = approverRoles.map(role => 
      this.approvalsRepository.create({
        post,
        role,
        status: ApprovalStatus.PENDING,
      })
    );

    await this.approvalsRepository.save(approvals);
  }

  private createPostQueryBuilder(): SelectQueryBuilder<Post> {
    return this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.createdBy', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.release', 'release')
      .leftJoinAndSelect('post.cards', 'cards')
      .leftJoinAndSelect('cards.versions', 'versions', 'versions.isActive = true')
      .leftJoinAndSelect('post.approvals', 'approvals')
      .leftJoinAndSelect('approvals.user', 'approver');
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Post>, filters: PostFiltersDto): void {
    if (filters.status) {
      queryBuilder.andWhere('post.status = :status', { status: filters.status });
    }

    if (filters.authorId) {
      queryBuilder.andWhere('post.createdBy.id = :authorId', { authorId: filters.authorId });
    }

    if (filters.releaseId) {
      queryBuilder.andWhere('post.release.id = :releaseId', { releaseId: filters.releaseId });
    }

    if (filters.tagIds?.length) {
      queryBuilder.andWhere('tags.id IN (:...tagIds)', { tagIds: filters.tagIds });
    }

    if (filters.publishDateFrom) {
      queryBuilder.andWhere('post.publishDate >= :publishDateFrom', { 
        publishDateFrom: new Date(filters.publishDateFrom) 
      });
    }

    if (filters.publishDateTo) {
      queryBuilder.andWhere('post.publishDate <= :publishDateTo', { 
        publishDateTo: new Date(filters.publishDateTo) 
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.briefing ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
  }

  private async createAuditLog(
    post: Post, 
    user: User, 
    action: AuditAction, 
    details: string
  ): Promise<void> {
    const auditLog = this.auditLogsRepository.create({
      post,
      user,
      action,
      details,
    });

    await this.auditLogsRepository.save(auditLog);
  }
}