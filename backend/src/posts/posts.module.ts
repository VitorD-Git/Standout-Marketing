import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostsService } from './posts.service';
import { CardsService } from './cards.service';
import { PostsController } from './posts.controller';
import { CardsController, PostCardsController } from './cards.controller';

import { Post } from './entities/post.entity';
import { Card } from './entities/card.entity';
import { CardVersion } from './entities/card-version.entity';
import { Approval } from './entities/approval.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Tag } from './entities/tag.entity';
import { Release } from './entities/release.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Card,
      CardVersion,
      Approval,
      AuditLog,
      Tag,
      Release,
    ]),
  ],
  controllers: [PostsController, CardsController, PostCardsController],
  providers: [PostsService, CardsService],
  exports: [PostsService, CardsService],
})
export class PostsModule {}