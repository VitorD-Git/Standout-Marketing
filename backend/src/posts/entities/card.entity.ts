import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Post } from './post.entity';
import { CardVersion } from './card-version.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order: number;

  @ManyToOne(() => Post, post => post.cards)
  post: Post;

  @OneToMany(() => CardVersion, version => version.card)
  versions: CardVersion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 