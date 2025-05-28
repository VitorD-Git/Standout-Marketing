import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { PostsService } from './posts.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { User, UserRole } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostFiltersDto } from './dto/post-filters.dto';
import { ApprovalActionDto } from './dto/approval-action.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.create(createPostDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async findAll(@Query() filters: PostFiltersDto) {
    return this.postsService.findAll(filters);
  }

  @Get('approval-tasks')
  @Roles(UserRole.APPROVER)
  @ApiOperation({ summary: 'Get approval tasks for current approver' })
  @ApiResponse({ status: 200, description: 'Approval tasks retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Only approvers can access this endpoint' })
  async getApprovalTasks(
    @CurrentUser() user: User,
    @Query() filters: PostFiltersDto,
  ) {
    return this.postsService.getApprovalTasks(user, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, description: 'Post found' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only edit own posts' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.update(id, updatePostDto, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit post for approval' })
  @ApiResponse({ status: 200, description: 'Post submitted for approval' })
  @ApiResponse({ status: 400, description: 'Post cannot be submitted in current status' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only submit own posts' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async submitForApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.postsService.submitForApproval(id, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.APPROVER)
  @ApiOperation({ summary: 'Approve or reject post' })
  @ApiResponse({ status: 200, description: 'Approval decision recorded' })
  @ApiResponse({ status: 400, description: 'Invalid approval action' })
  @ApiResponse({ status: 403, description: 'Only approvers can approve posts' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async approvePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: ApprovalActionDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.approvePost(id, approvalDto, user);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish approved post' })
  @ApiResponse({ status: 200, description: 'Post published successfully' })
  @ApiResponse({ status: 400, description: 'Post must be approved before publishing' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only publish own posts' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async publishPost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.postsService.publishPost(id, user);
  }
}