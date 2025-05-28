import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, ApproverRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const defaultNotificationPreferences = {
      receiveInAppNewSubmissions: true,
      receiveInAppApprovalDecisions: true,
      receiveEmailNotifications: false,
      receiveDailyDigest: false,
    };

    const user = this.usersRepository.create({
      ...createUserDto,
      notificationPreferences: createUserDto.notificationPreferences || defaultNotificationPreferences,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Keep this for backward compatibility
  async findOne(id: string): Promise<User> {
    return this.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findApprovers(): Promise<User[]> {
    return this.usersRepository.find({ 
      where: { role: UserRole.APPROVER },
      order: { approverRole: 'ASC' }
    });
  }

  async findByApproverRole(approverRole: ApproverRole): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { role: UserRole.APPROVER, approverRole }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async updateNotificationPreferences(
    id: string, 
    preferences: Partial<User['notificationPreferences']>
  ): Promise<User> {
    const user = await this.findById(id);
    const updatedPreferences = {
      ...user.notificationPreferences,
      ...preferences,
    };

    await this.usersRepository.update(id, { 
      notificationPreferences: updatedPreferences 
    });
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async setApproverRole(userId: string, approverRole: ApproverRole): Promise<User> {
    const existingApprover = await this.findByApproverRole(approverRole);
    if (existingApprover && existingApprover.id !== userId) {
      throw new ConflictException(`Another user already has the ${approverRole} role`);
    }

    const user = await this.findById(userId);
    user.approverRole = approverRole;
    user.role = UserRole.APPROVER;
    return this.usersRepository.save(user);
  }

  async removeApproverRole(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.approverRole = null;
    user.role = UserRole.WRITER;
    return this.usersRepository.save(user);
  }
} 