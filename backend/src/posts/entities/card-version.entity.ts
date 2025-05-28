import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Card } from './card.entity';
import { User } from '../../users/entities/user.entity';

@Entity('card_versions')
export class CardVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  versionNumber: number;

  @Column('text')
  textMain: string;

  @Column('text')
  textArt: string;

  @Column('text')
  explanationForDesigner: string;

  @Column({ nullable: true })
  assetFileUrl?: string;

  @Column({ nullable: true })
  assetFileName?: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Card, card => card.versions)
  card: Card;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
} 