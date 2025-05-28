import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { User, UserRole, ApproverRole } from '../src/users/entities/user.entity';
import { Post, PostStatus } from '../src/posts/entities/post.entity';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let postId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a test user and get auth token
    const testUser = {
      name: 'Test User',
      email: 'test@allowed-domain.com',
      role: UserRole.WRITER,
    };

    // Mock authentication for testing
    // In real tests, you would implement proper OAuth flow
    authToken = 'mock-jwt-token';
    userId = 'test-user-id';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/posts (POST)', () => {
    it('should create a new post', () => {
      const createPostDto = {
        title: 'Test Post',
        briefing: 'This is a test post briefing',
        publishDate: '2024-12-01',
      };

      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe(createPostDto.title);
          expect(res.body.briefing).toBe(createPostDto.briefing);
          expect(res.body.status).toBe(PostStatus.DRAFT);
          postId = res.body.id;
        });
    });

    it('should reject post creation without authentication', () => {
      const createPostDto = {
        title: 'Test Post',
        briefing: 'This is a test post briefing',
      };

      return request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto)
        .expect(401);
    });

    it('should reject post creation with invalid data', () => {
      const createPostDto = {
        briefing: 'Missing title',
      };

      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(400);
    });
  });

  describe('/posts (GET)', () => {
    it('should get all posts with pagination', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('posts');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.posts)).toBe(true);
        });
    });

    it('should filter posts by status', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: PostStatus.DRAFT })
        .expect(200)
        .expect((res) => {
          expect(res.body.posts.every((post: Post) => post.status === PostStatus.DRAFT)).toBe(true);
        });
    });

    it('should search posts by title and briefing', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Test' })
        .expect(200)
        .expect((res) => {
          expect(res.body.posts.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/posts/:id (GET)', () => {
    it('should get a specific post by ID', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(postId);
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('briefing');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('cards');
        });
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .get('/posts/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/posts/:id (PATCH)', () => {
    it('should update a post', () => {
      const updatePostDto = {
        title: 'Updated Test Post',
        briefing: 'Updated briefing',
      };

      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePostDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe(updatePostDto.title);
          expect(res.body.briefing).toBe(updatePostDto.briefing);
        });
    });

    it('should reject update from non-owner', () => {
      const otherUserToken = 'other-user-token';
      const updatePostDto = {
        title: 'Unauthorized Update',
      };

      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updatePostDto)
        .expect(403);
    });
  });

  describe('/posts/:id/submit (POST)', () => {
    it('should submit post for approval', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(PostStatus.IN_APPROVAL);
        });
    });

    it('should reject submission from non-owner', () => {
      const otherUserToken = 'other-user-token';

      return request(app.getHttpServer())
        .post(`/posts/${postId}/submit`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('/posts/:id/approve (POST)', () => {
    let approverToken: string;

    beforeAll(() => {
      // Mock approver token
      approverToken = 'approver-token';
    });

    it('should approve post by approver', () => {
      const approvalDto = {
        decision: 'APPROVED',
        comment: 'Content looks good',
      };

      return request(app.getHttpServer())
        .post(`/posts/${postId}/approve`)
        .set('Authorization', `Bearer ${approverToken}`)
        .send(approvalDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('approvals');
        });
    });

    it('should reject post by approver', () => {
      const approvalDto = {
        decision: 'REJECTED',
        comment: 'Needs more work',
      };

      return request(app.getHttpServer())
        .post(`/posts/${postId}/approve`)
        .set('Authorization', `Bearer ${approverToken}`)
        .send(approvalDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(PostStatus.NEEDS_ADJUSTMENT);
        });
    });

    it('should reject approval from non-approver', () => {
      const approvalDto = {
        decision: 'APPROVED',
        comment: 'Unauthorized approval',
      };

      return request(app.getHttpServer())
        .post(`/posts/${postId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalDto)
        .expect(403);
    });
  });

  describe('/posts/approval-tasks (GET)', () => {
    it('should get approval tasks for approver', () => {
      const approverToken = 'approver-token';

      return request(app.getHttpServer())
        .get('/posts/approval-tasks')
        .set('Authorization', `Bearer ${approverToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('posts');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.posts)).toBe(true);
        });
    });

    it('should reject approval tasks request from non-approver', () => {
      return request(app.getHttpServer())
        .get('/posts/approval-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('/posts/:postId/cards (POST)', () => {
    it('should add card to post', () => {
      const createCardDto = {
        textMain: 'Main text content',
        textArt: 'Art text content',
        explanationForDesigner: 'Design instructions',
      };

      return request(app.getHttpServer())
        .post(`/posts/${postId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createCardDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('versions');
          expect(res.body.versions[0].textMain).toBe(createCardDto.textMain);
        });
    });

    it('should reject card creation from non-owner', () => {
      const otherUserToken = 'other-user-token';
      const createCardDto = {
        textMain: 'Unauthorized card',
      };

      return request(app.getHttpServer())
        .post(`/posts/${postId}/cards`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(createCardDto)
        .expect(403);
    });
  });
});