import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { PostsService } from './posts.service';
import { Post, PostStatus } from './entities/post.entity';
import { Card } from './entities/card.entity';
import { CardVersion } from './entities/card-version.entity';
import { Approval } from './entities/approval.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Tag } from './entities/tag.entity';
import { Release } from './entities/release.entity';
import { User, UserRole, ApproverRole } from '../users/entities/user.entity';

describe('PostsService', () => {
  let service: PostsService;
  let postsRepository: jest.Mocked<Repository<Post>>;
  let cardsRepository: jest.Mocked<Repository<Card>>;
  let cardVersionsRepository: jest.Mocked<Repository<CardVersion>>;
  let approvalsRepository: jest.Mocked<Repository<Approval>>;
  let auditLogsRepository: jest.Mocked<Repository<AuditLog>>;
  let tagsRepository: jest.Mocked<Repository<Tag>>;
  let releasesRepository: jest.Mocked<Repository<Release>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.WRITER,
    notificationPreferences: {
      receiveInAppNewSubmissions: true,
      receiveInAppApprovalDecisions: true,
      receiveEmailNotifications: false,
      receiveDailyDigest: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApprover: User = {
    id: 'approver-1',
    name: 'Test Approver',
    email: 'approver@example.com',
    role: UserRole.APPROVER,
    approverRole: ApproverRole.CEO,
    notificationPreferences: {
      receiveInAppNewSubmissions: true,
      receiveInAppApprovalDecisions: true,
      receiveEmailNotifications: false,
      receiveDailyDigest: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
              getMany: jest.fn(),
              getCount: jest.fn(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Card),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CardVersion),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Approval),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: {
            findByIds: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Release),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postsRepository = module.get(getRepositoryToken(Post));
    cardsRepository = module.get(getRepositoryToken(Card));
    cardVersionsRepository = module.get(getRepositoryToken(CardVersion));
    approvalsRepository = module.get(getRepositoryToken(Approval));
    auditLogsRepository = module.get(getRepositoryToken(AuditLog));
    tagsRepository = module.get(getRepositoryToken(Tag));
    releasesRepository = module.get(getRepositoryToken(Release));
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post with valid data', async () => {
      const createPostDto = {
        title: 'Test Post',
        briefing: 'Test briefing',
        publishDate: '2024-12-01',
      };

      const mockPost = {
        id: 'post-1',
        title: createPostDto.title,
        briefing: createPostDto.briefing,
        status: PostStatus.DRAFT,
        createdBy: mockUser,
      };

      const mockCard = { id: 'card-1', post: mockPost, order: 1 };
      const mockCardVersion = {
        id: 'version-1',
        card: mockCard,
        versionNumber: 1,
        textMain: '',
        textArt: '',
        explanationForDesigner: '',
        createdBy: mockUser,
        isActive: true,
      };

      postsRepository.create.mockReturnValue(mockPost as any);
      postsRepository.save.mockResolvedValue(mockPost as any);
      cardsRepository.create.mockReturnValue(mockCard as any);
      cardsRepository.save.mockResolvedValue(mockCard as any);
      cardVersionsRepository.create.mockReturnValue(mockCardVersion as any);
      cardVersionsRepository.save.mockResolvedValue(mockCardVersion as any);
      auditLogsRepository.create.mockReturnValue({} as any);
      auditLogsRepository.save.mockResolvedValue({} as any);

      // Mock findById method
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };
      postsRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.create(createPostDto, mockUser);

      expect(postsRepository.create).toHaveBeenCalledWith({
        title: createPostDto.title,
        briefing: createPostDto.briefing,
        publishDate: new Date(createPostDto.publishDate),
        approvalDeadline: null,
        createdBy: mockUser,
        tags: [],
        release: null,
        status: PostStatus.DRAFT,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('post.created', {
        post: mockPost,
        author: mockUser,
      });
    });

    it('should throw BadRequestException when tags not found', async () => {
      const createPostDto = {
        title: 'Test Post',
        briefing: 'Test briefing',
        tagIds: ['non-existent-tag'],
      };

      tagsRepository.findByIds.mockResolvedValue([]);

      await expect(service.create(createPostDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('submitForApproval', () => {
    it('should submit post for approval when user is owner', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        status: PostStatus.DRAFT,
        createdBy: mockUser,
        cards: [{ id: 'card-1' }],
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };
      postsRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      postsRepository.save.mockResolvedValue({ ...mockPost, status: PostStatus.IN_APPROVAL } as any);
      approvalsRepository.delete.mockResolvedValue({} as any);
      approvalsRepository.create.mockReturnValue({} as any);
      approvalsRepository.save.mockResolvedValue({} as any);
      auditLogsRepository.create.mockReturnValue({} as any);
      auditLogsRepository.save.mockResolvedValue({} as any);

      const result = await service.submitForApproval('post-1', mockUser);

      expect(postsRepository.save).toHaveBeenCalledWith({
        ...mockPost,
        status: PostStatus.IN_APPROVAL,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('post.submitted', {
        post: mockPost,
        user: mockUser,
      });
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      const mockPost = {
        id: 'post-1',
        status: PostStatus.DRAFT,
        createdBy: mockUser,
        cards: [{ id: 'card-1' }],
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };
      postsRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await expect(service.submitForApproval('post-1', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when post has no cards', async () => {
      const mockPost = {
        id: 'post-1',
        status: PostStatus.DRAFT,
        createdBy: mockUser,
        cards: [],
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };
      postsRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await expect(service.submitForApproval('post-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approvePost', () => {
    it('should approve post when approver has valid role', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        status: PostStatus.IN_APPROVAL,
        createdBy: mockUser,
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };
      postsRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      approvalsRepository.findOne.mockResolvedValue(null);
      approvalsRepository.create.mockReturnValue({} as any);
      approvalsRepository.save.mockResolvedValue({} as any);
      approvalsRepository.find.mockResolvedValue([
        { status: 'APPROVED', user: mockApprover },
      ] as any);
      auditLogsRepository.create.mockReturnValue({} as any);
      auditLogsRepository.save.mockResolvedValue({} as any);

      const approvalDto = {
        decision: 'APPROVED' as any,
        comment: 'Looks good',
      };

      await service.approvePost('post-1', approvalDto, mockApprover);

      expect(approvalsRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('post.partial_approval', {
        post: mockPost,
        approver: mockApprover,
      });
    });

    it('should throw ForbiddenException when user is not approver', async () => {
      const mockPost = {
        id: 'post-1',
        status: PostStatus.IN_APPROVAL,
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };
      postsRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const approvalDto = {
        decision: 'APPROVED' as any,
        comment: 'Looks good',
      };

      await expect(service.approvePost('post-1', approvalDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});