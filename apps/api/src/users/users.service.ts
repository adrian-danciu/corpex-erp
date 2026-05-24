import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { Role, User as PrismaUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EmployeeAccountGenerationResult } from './dto/employee-account-generation-result';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;
  private readonly EMAIL_DOMAIN = 'corpex.com';

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

  async generateEmployeeAccount(
    employeeId: string,
  ): Promise<EmployeeAccountGenerationResult> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.userId) {
      throw new ConflictException('Employee already has an account');
    }

    const { email, initialPassword } = await this.generateCredentials(
      employee.firstName,
      employee.lastName,
    );
    const hashedPassword = await bcrypt.hash(initialPassword, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email,
        password: hashedPassword,
        role: Role.USER,
        mustChangePassword: true,
      },
    });

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { userId: user.id },
    });

    return {
      employeeId: employee.id,
      employeeName: this.formatEmployeeName(
        employee.firstName,
        employee.lastName,
      ),
      email,
      initialPassword,
      created: true,
      message: 'Account created',
    };
  }

  async generateEmployeeAccounts(
    employeeIds: string[],
  ): Promise<EmployeeAccountGenerationResult[]> {
    const results: EmployeeAccountGenerationResult[] = [];

    for (const employeeId of employeeIds) {
      try {
        results.push(await this.generateEmployeeAccount(employeeId));
      } catch (error) {
        if (
          error instanceof ConflictException ||
          error instanceof NotFoundException
        ) {
          results.push({
            employeeId,
            employeeName: null,
            email: null,
            initialPassword: null,
            created: false,
            message: error.message,
          });
          continue;
        }

        throw error;
      }
    }

    return results;
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
      data: { password: hashedPassword, mustChangePassword: false },
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

  private async generateCredentials(
    firstName: string,
    lastName: string,
  ): Promise<{ email: string; initialPassword: string }> {
    const baseLocalPart = this.buildLocalPart(firstName, lastName);
    let localPart = baseLocalPart;
    let suffix = 1;

    while (
      await this.prisma.user.findUnique({
        where: { email: `${localPart}@${this.EMAIL_DOMAIN}` },
      })
    ) {
      suffix += 1;
      localPart = `${baseLocalPart}${suffix}`;
    }

    return {
      email: `${localPart}@${this.EMAIL_DOMAIN}`,
      initialPassword: `${localPart}.${new Date().getFullYear()}`,
    };
  }

  private buildLocalPart(firstName: string, lastName: string): string {
    const first = this.normalizeNamePart(firstName);
    const last = this.normalizeNamePart(lastName);
    const localPart = [first, last].filter(Boolean).join('.');
    return localPart || 'employee';
  }

  private normalizeNamePart(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .replace(/\.+/g, '.');
  }

  private formatEmployeeName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }
}
