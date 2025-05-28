import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { CardsService } from './cards.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { User } from '../users/entities/user.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@ApiTags('Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get card by ID' })
  @ApiResponse({ status: 200, description: 'Card found' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update card content' })
  @ApiResponse({ status: 200, description: 'Card updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only edit cards in own posts' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCardDto: UpdateCardDto,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.update(id, updateCardDto, user);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|mov|avi)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload asset file for card' })
  @ApiResponse({ status: 200, description: 'Asset uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only upload to cards in own posts' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async uploadAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.uploadAsset(id, file, user);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate card' })
  @ApiResponse({ status: 201, description: 'Card duplicated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only duplicate cards in own posts' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.duplicate(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove card' })
  @ApiResponse({ status: 200, description: 'Card removed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot remove the last card from a post' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only remove cards from own posts' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.cardsService.remove(id, user);
    return { message: 'Card removed successfully' };
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get card version history' })
  @ApiResponse({ status: 200, description: 'Version history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async getVersionHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.getVersionHistory(id);
  }
}

// Additional endpoint for creating cards in posts
@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('posts')
export class PostCardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post(':postId/cards')
  @ApiOperation({ summary: 'Add card to post' })
  @ApiResponse({ status: 201, description: 'Card created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only add cards to own posts' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() createCardDto: CreateCardDto,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.create(postId, createCardDto, user);
  }
}