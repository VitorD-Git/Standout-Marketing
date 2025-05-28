import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Card } from './card.entity';
import { Release } from './release.entity';
import { Tag } from './tag.entity';

export enum PostStatus {
  DRAFT = 'draft',
  IN_APPROVAL = 'in_approval',
  NEEDS_ADJUSTMENT = 'needs_adjustment',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  briefing: string;

  @Column({ type: 'date' })
  publishDate: Date;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Column({ type: 'date', nullable: true })
  approvalDeadline?: Date;

  @ManyToOne(() => User)
  createdBy: User;

  @OneToMany(() => Card, card => card.post)
  cards: Card[];

  @ManyToOne(() => Release, { nullable: true })
  release?: Release;

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 