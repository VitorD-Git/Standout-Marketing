import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Card } from './entities/card.entity';
import { CardVersion } from './entities/card-version.entity';
import { Post, PostStatus } from './entities/post.entity';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';

import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
    
    @InjectRepository(CardVersion)
    private cardVersionsRepository: Repository<CardVersion>,
    
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
    
    private eventEmitter: EventEmitter2,
  ) {}

  async create(postId: string, createCardDto: CreateCardDto, user: User): Promise<Card> {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['createdBy', 'cards']
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check permissions
    if (post.createdBy.id !== user.id && user.role !== 'ADMIN' && user.role !== 'APPROVER') {
      throw new ForbiddenException('You can only add cards to your own posts or as an approver');
    }

    // Calculate order if not provided
    if (!createCardDto.order) {
      const maxOrder = Math.max(...post.cards.map(c => c.order), 0);
      createCardDto.order = maxOrder + 1;
    }

    // Create card
    const card = this.cardsRepository.create({
      post,
      order: createCardDto.order,
    });

    const savedCard = await this.cardsRepository.save(card);

    // Create initial version
    const version = this.cardVersionsRepository.create({
      card: savedCard,
      versionNumber: 1,
      textMain: createCardDto.textMain || '',
      textArt: createCardDto.textArt || '',
      explanationForDesigner: createCardDto.explanationForDesigner || '',
      createdBy: user,
      isActive: true,
    });

    await this.cardVersionsRepository.save(version);

    // Create audit log
    await this.createAuditLog(post, user, AuditAction.CREATE, `Card ${savedCard.id} created`, savedCard.id);

    // Emit event
    this.eventEmitter.emit('card.created', { card: savedCard, post, user });

    return this.findById(savedCard.id);
  }

  async findById(id: string): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id },
      relations: ['post', 'versions', 'versions.createdBy'],
      order: { versions: { createdAt: 'DESC' } }
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto, user: User): Promise<Card> {
    const card = await this.findById(id);
    const post = card.post;

    // Check permissions
    if (post.createdBy.id !== user.id && user.role !== 'ADMIN' && user.role !== 'APPROVER') {
      throw new ForbiddenException('You can only edit cards in your own posts or as an approver');
    }

    // Get current active version
    const currentVersion = card.versions.find(v => v.isActive);
    if (!currentVersion) {
      throw new BadRequestException('Card has no active version');
    }

    // Check if content actually changed
    const hasContentChanges = 
      (updateCardDto.textMain !== undefined && updateCardDto.textMain !== currentVersion.textMain) ||
      (updateCardDto.textArt !== undefined && updateCardDto.textArt !== currentVersion.textArt) ||
      (updateCardDto.explanationForDesigner !== undefined && updateCardDto.explanationForDesigner !== currentVersion.explanationForDesigner);

    // Update card order if provided
    if (updateCardDto.order !== undefined && updateCardDto.order !== card.order) {
      card.order = updateCardDto.order;
      await this.cardsRepository.save(card);
    }

    // Create new version if content changed
    if (hasContentChanges) {
      // Deactivate current version
      currentVersion.isActive = false;
      await this.cardVersionsRepository.save(currentVersion);

      // Create new version
      const newVersion = this.cardVersionsRepository.create({
        card,
        versionNumber: currentVersion.versionNumber + 1,
        textMain: updateCardDto.textMain ?? currentVersion.textMain,
        textArt: updateCardDto.textArt ?? currentVersion.textArt,
        explanationForDesigner: updateCardDto.explanationForDesigner ?? currentVersion.explanationForDesigner,
        assetFileUrl: currentVersion.assetFileUrl,
        assetFileName: currentVersion.assetFileName,
        createdBy: user,
        isActive: true,
      });

      await this.cardVersionsRepository.save(newVersion);

      // Handle approval reset (RF029)
      await this.handleApprovalReset(post, user, card.id);

      // Create audit log
      await this.createAuditLog(post, user, AuditAction.UPDATE, `Card ${card.id} content updated`, card.id);

      // Emit event
      this.eventEmitter.emit('card.updated', { card, post, user, hasContentChanges: true });
    }

    return this.findById(id);
  }

  async uploadAsset(cardId: string, file: Express.Multer.File, user: User): Promise<Card> {
    const card = await this.findById(cardId);
    const post = card.post;

    // Check permissions
    if (post.createdBy.id !== user.id && user.role !== 'ADMIN' && user.role !== 'APPROVER') {
      throw new ForbiddenException('You can only upload assets to cards in your own posts or as an approver');
    }

    // Get current active version
    const currentVersion = card.versions.find(v => v.isActive);
    if (!currentVersion) {
      throw new BadRequestException('Card has no active version');
    }

    // Deactivate current version
    currentVersion.isActive = false;
    await this.cardVersionsRepository.save(currentVersion);

    // Create new version with asset
    const newVersion = this.cardVersionsRepository.create({
      card,
      versionNumber: currentVersion.versionNumber + 1,
      textMain: currentVersion.textMain,
      textArt: currentVersion.textArt,
      explanationForDesigner: currentVersion.explanationForDesigner,
      assetFileUrl: `/uploads/${file.filename}`,
      assetFileName: file.originalname,
      createdBy: user,
      isActive: true,
    });

    await this.cardVersionsRepository.save(newVersion);

    // Handle approval reset (RF029)
    await this.handleApprovalReset(post, user, card.id);

    // Create audit log
    await this.createAuditLog(post, user, AuditAction.UPDATE, `Asset uploaded to card ${card.id}`, card.id);

    // Emit event
    this.eventEmitter.emit('card.asset_uploaded', { card, post, user, fileName: file.originalname });

    return this.findById(cardId);
  }

  async duplicate(id: string, user: User): Promise<Card> {
    const originalCard = await this.findById(id);
    const post = originalCard.post;

    // Check permissions
    if (post.createdBy.id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only duplicate cards in your own posts');
    }

    const activeVersion = originalCard.versions.find(v => v.isActive);
    if (!activeVersion) {
      throw new BadRequestException('Original card has no active version');
    }

    // Create new card
    const newCard = this.cardsRepository.create({
      post,
      order: originalCard.order + 1,
    });

    const savedCard = await this.cardsRepository.save(newCard);

    // Create version for new card
    const newVersion = this.cardVersionsRepository.create({
      card: savedCard,
      versionNumber: 1,
      textMain: activeVersion.textMain,
      textArt: activeVersion.textArt,
      explanationForDesigner: activeVersion.explanationForDesigner,
      assetFileUrl: activeVersion.assetFileUrl,
      assetFileName: activeVersion.assetFileName,
      createdBy: user,
      isActive: true,
    });

    await this.cardVersionsRepository.save(newVersion);

    // Update order of subsequent cards
    await this.reorderCardsAfter(post.id, originalCard.order);

    // Create audit log
    await this.createAuditLog(post, user, AuditAction.CREATE, `Card ${savedCard.id} duplicated from ${originalCard.id}`, savedCard.id);

    // Emit event
    this.eventEmitter.emit('card.duplicated', { originalCard, newCard: savedCard, post, user });

    return this.findById(savedCard.id);
  }

  async remove(id: string, user: User): Promise<void> {
    const card = await this.findById(id);
    const post = card.post;

    // Check permissions
    if (post.createdBy.id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only remove cards from your own posts');
    }

    // Can't remove if it's the only card
    const cardCount = await this.cardsRepository.count({ where: { post: { id: post.id } } });
    if (cardCount <= 1) {
      throw new BadRequestException('Cannot remove the last card from a post');
    }

    // Remove card and its versions (cascade)
    await this.cardsRepository.remove(card);

    // Reorder remaining cards
    await this.reorderCardsAfter(post.id, 0);

    // Create audit log
    await this.createAuditLog(post, user, AuditAction.UPDATE, `Card ${card.id} removed`, card.id);

    // Emit event
    this.eventEmitter.emit('card.removed', { card, post, user });
  }

  async getVersionHistory(cardId: string): Promise<CardVersion[]> {
    const card = await this.findById(cardId);
    
    return this.cardVersionsRepository.find({
      where: { card: { id: cardId } },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' }
    });
  }

  private async reorderCardsAfter(postId: string, afterOrder: number): Promise<void> {
    const cards = await this.cardsRepository.find({
      where: { post: { id: postId } },
      order: { order: 'ASC' }
    });

    for (let i = 0; i < cards.length; i++) {
      cards[i].order = i + 1;
    }

    await this.cardsRepository.save(cards);
  }

  private async handleApprovalReset(post: Post, user: User, cardId: string): Promise<void> {
    // Only reset if post is in approval or needs adjustment status
    if (post.status === PostStatus.IN_APPROVAL || post.status === PostStatus.NEEDS_ADJUSTMENT) {
      // This will be handled by the PostsService via event
      this.eventEmitter.emit('card.content_changed', { post, user, cardId });
    }
  }

  private async createAuditLog(
    post: Post,
    user: User,
    action: AuditAction,
    details: string,
    cardId?: string
  ): Promise<void> {
    const auditLog = this.auditLogsRepository.create({
      post,
      user,
      action,
      details,
      cardId,
    });

    await this.auditLogsRepository.save(auditLog);
  }
}