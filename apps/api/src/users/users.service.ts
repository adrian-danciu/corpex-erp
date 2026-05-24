import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { User as PrismaUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   * @param createUserInput - User data from frontend
   * @returns Created user (without password)
   */
  async create(createUserInput: CreateUserInput): Promise<PrismaUser> {
    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserInput.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${createUserInput.email} already exists`,
      );
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(
      createUserInput.password,
      this.SALT_ROUNDS,
    );

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        firstName: createUserInput.firstName,
        lastName: createUserInput.lastName,
        email: createUserInput.email,
        password: hashedPassword,
        role: createUserInput.role,
      },
    });

    return user;
  }

  /**
   * Find all users
   * @returns Array of all users
   */
  async findAll(): Promise<PrismaUser[]> {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find a user by ID
   * @param id - User ID
   * @returns User or null
   */
  async findOne(id: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by email
   * @param email - User email
   * @returns User or null
   */
  async findByEmail(email: string): Promise<PrismaUser | null> {
    if (!email) {
      return null;
    }

    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Verify a password against a hashed password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if password matches, false otherwise
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Updated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<PrismaUser> {
    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await this.verifyPassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Update user profile picture
   * @param userId - User ID
   * @param profilePicture - Profile picture URL (optional)
   * @returns Updated user
   */
  async updateProfilePicture(
    userId: string,
    profilePicture?: string,
  ): Promise<PrismaUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePicture },
    });
  }
}
